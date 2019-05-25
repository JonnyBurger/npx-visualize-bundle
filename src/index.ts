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
import isCraRunning from './is-cra-running';
import {ProjectType, BundleAndMapPair} from 'types';
const packageJson = require('../package.json');

const defaultDir = mkdtempSync(path.join(tempDir, 'npx-visualize-bundle'));

commander
	.version(packageJson.version, '-v, --version')
	.option('-a, --android', 'Analyse Android bundle ')
	.option('-d, --dev', 'Analyse development bundle')
	.option('-j, --json', 'Output JSON')
	.option('-o, --output [dir]', 'Specify output dir', defaultDir)
	.option('-p, --port [port]', 'Specify js package port')
	.parse(process.argv);

const sourceMapExplorer = require('source-map-explorer');

const platform = commander.android ? 'android' : 'ios';

const query = qs.stringify({
	platform,
	sourceMap: 'true',
	dev: String(Boolean(commander.dev)),
	minify: String(!commander.dev),
	hot: 'false'
});

const start = async () => {
	console.log(' ');
	process.stdout.write(
		'Searching for running React Native, Expo or CRA project... '
	);
	const [expoRunning, rnRunning, craRunning] = await Promise.all([
		isExpoRunning(query),
		isRnRunning(commander.port || 8081, platform, query),
		isCraRunning(commander.port || 3000)
	]);
	let port = commander.port || (expoRunning ? 19001 : 8081);
	let selectedProject: ProjectType | null = null;

	const choices = [];
	if (rnRunning) {
		console.log('Found React Native app.');
		console.log('');
		selectedProject = 'react-native';
		choices.push({
			value: 'react-native',
			name: `React Native project running on port ${port}`
		});
	}
	if (expoRunning) {
		console.log('Found EXpo app.');
		console.log('');
		selectedProject = 'expo';
		choices.push({
			value: 'expo',
			name: 'Expo project running on port 19001'
		});
	}
	if (craRunning) {
		console.log('Found create-react-app project.');
		console.log('');
		selectedProject = 'cra';
		choices.push({
			value: 'cra',
			name: 'create-react-app running on port 3000'
		});
	}

	if (choices.length > 0 && !commander.port) {
		console.log('Multiple found.');
		const prompt = inquirer.createPromptModule();
		const {project} = await prompt([
			{
				type: 'list',
				name: 'project',
				message:
					'Found multiple projects. Which one would you like to analyze?',
				choices
			}
		]);

		port =
			project === 'cra'
				? commander.port || 3000
				: project === 'rn'
				? commander.port || 8081
				: commander.port || 19001;
		selectedProject = project;
	}
	if (choices.length === 0) {
		console.log('None found.');
		console.log(
			`Could not find a React Native, Expo, or create-react-app projet running on port ${8081}, ${19001} or ${3000}. Start one and run 'npx visualize-bundle' again.`
		);
		console.log('');
		process.exit(0);
	}
	const startTime = Date.now();

	const spinner = ora();
	spinner.start();
	spinner.text = `Getting bundle...`;
	await new Promise(resolve => setTimeout(resolve, 100));
	let bundlePairs: BundleAndMapPair[] = [];
	if (selectedProject === 'cra') {
		bundlePairs = craRunning as BundleAndMapPair[];
	} else if (selectedProject === 'expo') {
		bundlePairs = expoRunning as BundleAndMapPair[];
	} else if (selectedProject === 'react-native') {
		bundlePairs = rnRunning as BundleAndMapPair[];
	}
	for (let [index, bundlePair] of Object.entries(bundlePairs)) {
		try {
			const [bundleUrl, sourceMapUrl] = bundlePair;
			spinner.text = `(${Number(index) + 1}/${
				bundlePairs.length
			}) Getting bundle...`;
			const bundle = await getAnyResource([bundleUrl]);
			spinner.text = `(${Number(index) + 1}/${
				bundlePairs.length
			}) Getting map...`;
			const sourceMap = await getAnyResource([sourceMapUrl]);
			await new Promise(resolve => setTimeout(resolve, 100));
			const outputDir = path.resolve(commander.output);
			const filename = `bundle${index}`;
			writeFileSync(path.join(outputDir, `${filename}.js`), bundle.body);
			writeFileSync(path.join(outputDir, `${filename}.js.map`), sourceMap.body);
			spinner.text = 'Analysing bundle using source-map-explorer...';
			await new Promise(resolve => setTimeout(resolve, 100));
			const analysis = sourceMapExplorer(
				path.join(outputDir, `${filename}.js`),
				path.join(outputDir, `${filename}.js.map`),
				{html: !commander.json}
			);
			if (commander.json) {
				writeFileSync(
					path.join(outputDir, `report${index}.json`),
					JSON.stringify({...analysis}, null, 2)
				);
				console.log('');
				console.log('');
				console.log(
					`❇️  Written report as JSON to ${path.join(
						outputDir,
						`report${index}.json`
					)}`
				);
			} else {
				writeFileSync(
					path.join(outputDir, `report${index}.html`),
					analysis.html
				);
				const endTime = Date.now();
				await open(path.join(outputDir, `report${index}.html`));
				console.log(' ');
				console.log(
					`❇️  Report generated in ${Math.floor(
						(endTime - startTime) / 1000
					)}s and opened in browser.`
				);
				console.log(' ');
			}
			await new Promise(resolve => {
				unlink(path.join(outputDir, `${filename}js`), () => {
					unlink(path.join(outputDir, `${filename}js.map`), () => {
						resolve();
					});
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
				process.exit(1);
			} else {
				//console.log('Could not do bundle analysis: ' + err.message);
				//console.log(err.stack);
			}
		}
	}
	process.exit(0);
};

start();
