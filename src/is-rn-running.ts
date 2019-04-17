import getResource from './request-resource';

export default async (): Promise<boolean> => {
	try {
		await getResource('http://localhost:8081');
		return true;
	} catch (err) {
		return false;
	}
};
