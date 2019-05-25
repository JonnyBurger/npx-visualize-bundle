import cheerio from 'cheerio';
import getResource from './request-resource';
import {BundleAndMapPair} from 'types';

export default async (port: number): Promise<BundleAndMapPair[] | null> => {
	try {
		const response = await getResource(`http://localhost:${port}`);
		const $ = cheerio.load(response.body);
		// @ts-ignore
		const scripts: string[] = $('script')
			.map((_, s) => s.attribs.src as string)
			.toArray();
		if (scripts.filter(s => s !== '/static/js/bundle.js').length === 0) {
			return null;
		}
		return scripts.map(s => [
			`http://localhost:3000/${s}`,
			`http://localhost:3000/${s}.map`
		]);
	} catch (err) {
		return null;
	}
};
