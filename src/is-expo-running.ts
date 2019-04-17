import getResource from './request-resource';

export default async (): Promise<boolean> => {
	try {
		await getResource('http://localhost:19001');
		return true;
	} catch (err) {
		return false;
	}
};
