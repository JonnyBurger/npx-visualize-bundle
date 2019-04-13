import got from 'got';

export default async (): Promise<boolean> => {
	try {
		await got('http://localhost:8081');
		return true;
	} catch (err) {
		return false;
	}
};
