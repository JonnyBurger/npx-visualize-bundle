import qs from 'qs';

export const sourceMapQuery = qs.stringify({
	platform: 'ios',
	sourceMap: 'true',
	dev: 'false',
	minify: 'false',
	hot: 'false'
});

export const bundleQuery = qs.stringify({
	platform: 'ios',
	sourceMap: 'true',
	dev: 'false',
	minify: 'false',
	hot: 'false'
});
