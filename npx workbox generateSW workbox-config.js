module.exports = {
	globDirectory: 'src',
	globPatterns: [
		'**/*.{json,css,ico}'
	],
	swDest: '/public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};