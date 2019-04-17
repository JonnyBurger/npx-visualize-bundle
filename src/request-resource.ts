import got from 'got';
import pAny from 'p-any';

const getResource = (url: string) => {
	return got(url, {
		headers: {
			'user-agent': 'npx-visualize-bundle'
		}
	});
};

export const getAnyResource = async (urls: string[]) => {
	return pAny(
		urls.map(url => {
			return getResource(url);
		})
	);
};

export default getResource;
