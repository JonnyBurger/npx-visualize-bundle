import got from 'got';
import {writeFileSync, unlink} from 'fs';
import open from 'open';
import path from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import {sourceMapQuery, bundleQuery} from './packager-url';
import isExpoRunning from './is-expo-running';
import isRnRunning from './is-rn-running';

const sourceMapExplorer = require('source-map-explorer');

const choices = [
	'React Native project running on port 8081',
	'Expo project running on port 19001'
];

const start = async () => {
	const [expoRunning, rnRunning] = await Promise.all([
		isExpoRunning(),
		isRnRunning()
	]);
	let port = expoRunning ? 19001 : 8081;
	if (expoRunning && rnRunning) {
		const prompt = inquirer.createPromptModule();
		const {project} = await prompt([
			{
				type: 'list',
				name: 'project',
				message:
					'Found both a React Native and an Expo project. Which one would you like to analyze?',
				choices
			}
		]);
		port = project === choices[0] ? 8081 : 19001;
	}
	if (!expoRunning && !rnRunning) {
		console.log(
			`Could not find a React Native or Expo project running on port ${8081} or ${19001}. Start one and run 'npx visualize-bundle' again.`
		);
		process.exit(1);
	}
	const startTime = Date.now();

	const spinner = ora();
	spinner.start();
	spinner.text = `Getting bundle from port ${port}...`;
	try {
		const bundle = await got(
			`${
				port === 19001
					? 'http://localhost:19001/node_modules/expo/AppEntry.bundle'
					: 'http://localhost:8081/index.ios.bundle'
			}?${bundleQuery}`
		);
		spinner.text = `Getting map from port ${port}...`;
		const sourceMap = await got(
			`${
				port === 19001
					? 'http://localhost:19001/node_modules/expo/AppEntry.map'
					: 'http://localhost:8081/index.ios.map'
			}?${sourceMapQuery}`
		);
		writeFileSync(path.join(__dirname, '..', 'bundle.js'), bundle.body);
		writeFileSync(path.join(__dirname, '..', 'bundle.js.map'), sourceMap.body);
		spinner.text = 'Analysing bundle using source-map-explorer...';
		const analysis = sourceMapExplorer(
			path.join(__dirname, '..', 'bundle.js'),
			path.join(__dirname, '..', 'bundle.js.map'),
			{html: true}
		);
		writeFileSync('report.html', analysis.html);
		spinner.stop();
		const endTime = Date.now();
		open(path.join(__dirname, '..', 'report.html'));
		console.log(
			`❇️  Report generated in ${Math.floor(
				(endTime - startTime) / 1000
			)}s and opened in browser.`
		);
		unlink(path.join(__dirname, '..', 'bundle.js'), () => {
			unlink(path.join(__dirname, '..', 'bundle.js.map'), () => {
				process.exit(0);
			});
		});
	} catch (err) {
		console.log('Could not do bundle analysis: ' + err.message);
		console.log(err.stack);
		spinner.stop();
		process.exit(1);
	}
};

start();
