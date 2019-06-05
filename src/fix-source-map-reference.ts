// Trying to fix this issue here:
// https://github.com/JonnyBurger/npx-visualize-bundle/issues/8

export default (body: string, filename: string) => {
	return body
		.split('\n')
		.map(b => {
			if (b.startsWith('//# sourceMappingURL')) {
				return `//# sourceMappingURL=${filename}.js.map`;
			}
			return b;
		})
		.join('\n');
};
