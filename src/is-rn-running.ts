import getResource from './request-resource';

export default async (port: number): Promise<boolean> => {
	try {
		await getResource(`http://localhost:${port}`);
		return true;
	} catch (err) {
		return false;
	}
};
