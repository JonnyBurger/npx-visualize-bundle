import getResource from './request-resource';
import {BundleAndMapPair} from 'types';

export default async (
	port: number,
	platform: string,
	query: string
): Promise<BundleAndMapPair[] | null> => {
	try {
		await getResource(`http://localhost:${port}`);
		return [
			[
				`http://localhost:${port}/index.bundle?${query}`,
				`http://localhost:${port}/index.map?${query}`
			],
			[
				`http://localhost:${port}/index.${platform}.bundle?${query}`,
				`http://localhost:${port}/index.${platform}.map?${query}`
			]
		];
	} catch (err) {
		return null;
	}
};
