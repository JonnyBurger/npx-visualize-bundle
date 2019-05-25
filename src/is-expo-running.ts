import getResource from './request-resource';
import {BundleAndMapPair} from 'types';

export default async (query: string): Promise<BundleAndMapPair[] | null> => {
	try {
		await getResource('http://localhost:19001');
		return [
			[
				`http://localhost:19001/node_modules/expo/AppEntry.bundle?${query}`,
				`http://localhost:19001/node_modules/expo/AppEntry.map?${query}`
			]
		];
	} catch (err) {
		return null;
	}
};
