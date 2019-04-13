import got from 'got';
import {writeFileSync} from 'fs';
import ora from 'ora';
import {sourceMapQuery, bundleQuery} from './packager-url';
import isExpoRunning from './is-expo-running';
import isRnRunning from './is-rn-running';

const start = async () => {
	const [expoRunning, rnRunning] = await Promise.all([
		isExpoRunning(),
		isRnRunning()
	]);
	if (!expoRunning && !rnRunning) {
		console.log('Could not find a React Native or Expo project');
		process.exit(1);
	}
	const spinner = ora();
	spinner.start();
	spinner.text = 'Getting bundle from port 19001...';
	try {
		const bundle = await got(
			`${
				expoRunning
					? 'http://localhost:19001/node_modules/expo/AppEntry.bundle'
					: 'http://localhost:8081/index.ios.bundle'
			}?${bundleQuery}`
		);
		spinner.text = 'Getting map from port 19001...';
		const sourceMap = await got(
			`${
				expoRunning
					? 'http://localhost:19001/node_modules/expo/AppEntry.map'
					: 'http://localhost:8081/index.ios.map'
			}?${sourceMapQuery}`
		);
		writeFileSync('bundle.js', bundle.body);
		writeFileSync('bundle.js.map', sourceMap.body);
		spinner.stop();
		console.log('Opening bundle analysis using source-map-explorer...');
		process.exit(0);
	} catch (err) {
		console.log('Could not do bundle analysis: ' + err.message);
		console.log(err.stack);
		spinner.stop();
		process.exit(1);
	}
};

start();
