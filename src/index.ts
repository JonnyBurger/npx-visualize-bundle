import commander from 'commander';
import {writeFileSync, unlink, mkdtempSync} from 'fs';
import qs from 'qs';
import open from 'open';
import path from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import tempDir from 'temp-dir';
import isExpoRunning from './is-expo-running';
import isRnRunning from './is-rn-running';
import {getAnyResource} from './request-resource';
const packageJson = require('../package.json');

const defaultDir = mkdtempSync(path.join(tempDir, 'npx-visualize-bundle'));

commander
	.version(packageJson.version, '-v, --version')
	.option('-a, --android', 'Analyse Android bundle ')
	.option('-d, --dev', 'Analyse developement bundle')
	.option('-j, --json', 'Output JSON')
	.option('-o, --output [dir]', 'Specify output dir', defaultDir)
	.option('-p, --port [port]', 'Specify js package port')
	.parse(process.argv);

const sourceMapExplorer = require('source-map-explorer');

const platform = commander.android ? 'android' : 'ios';

const query = qs.stringify({
	platform,
	sourceMap: 'true',
	dev: commander.dev ? 'true' : 'false',
	minify: 'false',
	hot: 'false'
});

const choices = [
	'React Native project running on port 8081',
	'Expo project running on port 19001'
];

const start = async () => {
	console.log(' ');
	process.stdout.write('Searching for running React Native app... ');
	const [expoRunning, rnRunning] = await Promise.all([
		isExpoRunning(),
		isRnRunning(commander.port || 8081)
	]);
	let port = commander.port || (expoRunning ? 19001 : 8081);

	if (expoRunning && !rnRunning) {
		console.log('Found Expo app.');
		console.log('');
	}
	if (!expoRunning && rnRunning) {
		console.log('Found React Native app.');
		console.log('');
	}

	if (expoRunning && rnRunning && !commander.port) {
		console.log('Multiple found.');
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
		console.log('None found.');
		console.log(
			`Could not find a React Native or Expo project running on port ${8081} or ${19001}. Start one and run 'npx visualize-bundle' again.`
		);
		console.log('');
		process.exit(0);
	}
	const startTime = Date.now();

	const spinner = ora();
	spinner.start();
	spinner.text = `Getting bundle from port ${port}...`;
	await new Promise(resolve => setTimeout(resolve, 100));
	try {
		const bundle = await getAnyResource(
			port === 19001
				? [`http://localhost:19001/node_modules/expo/AppEntry.bundle?${query}`]
				: [
						`http://localhost:${port}/index.bundle?${query}`,
						`http://localhost:${port}/index.${platform}.bundle?${query}`
				  ]
		);
		spinner.text = `Getting map from port ${port}...`;
		await new Promise(resolve => setTimeout(resolve, 100));
		const sourceMap = await getAnyResource(
			port === 19001
				? [`http://localhost:19001/node_modules/expo/AppEntry.map?${query}`]
				: [
						`http://localhost:${port}/index.map?${query}`,
						`http://localhost:${port}/index.${platform}.map?${query}`
				  ]
		);
		const outputDir = path.resolve(commander.output);
		writeFileSync(path.join(outputDir, 'bundle.js'), bundle.body);
		writeFileSync(path.join(outputDir, 'bundle.js.map'), sourceMap.body);
		spinner.text = 'Analysing bundle using source-map-explorer...';
		await new Promise(resolve => setTimeout(resolve, 100));

		const analysis = sourceMapExplorer(
			path.join(outputDir, 'bundle.js'),
			path.join(outputDir, 'bundle.js.map'),
			{html: !commander.json}
		);
		spinner.stop();
		if (commander.json) {
			writeFileSync(
				path.join(outputDir, 'report.json'),
				JSON.stringify({...analysis}, null, 2)
			);
			console.log('');
			console.log('');
			console.log(
				`❇️  Written report as JSON to ${path.join(outputDir, 'report.json')}`
			);
		} else {
			writeFileSync(path.join(outputDir, 'report.html'), analysis.html);
			const endTime = Date.now();
			await open(path.join(outputDir, 'report.html'));
			console.log(' ');
			console.log(
				`❇️  Report generated in ${Math.floor(
					(endTime - startTime) / 1000
				)}s and opened in browser.`
			);
			console.log(' ');
		}
		unlink(path.join(outputDir, 'bundle.js'), () => {
			unlink(path.join(outputDir, 'bundle.js.map'), () => {
				process.exit(0);
			});
		});
	} catch (err) {
		console.log('');
		if (err.message.match(/500/)) {
			console.log(
				[
					'The packager returned status code 500.',
					'Your code might have an error that will prevent it from compilation.',
					'Check the output of the packager.'
				].join('\n')
			);
		} else {
			console.log('Could not do bundle analysis: ' + err.message);
			console.log(err.stack);
		}
		spinner.stop();
		process.exit(1);
	}
};

start();
