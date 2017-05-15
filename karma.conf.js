module.exports = function (config) {
	config.set({
		basePath: '.',
		frameworks: ['mocha', 'chai'],
		files: [
			'test/**/*.spec.js',
			// Watch src files for changes but
			// don't load them into the browser.
			{ pattern: 'src/**/*.js', included: false },

		],

		preprocessors: {
			//'test/buble/**/*.spec.js': ['rollup'],
			'src/**/*.js': ['rollupBabel'],
			'test/**/*.spec.js': ['rollupBabel'],
		},

		rollupPreprocessor: {
			plugins: [
				require('rollup-plugin-buble')(),
			],
			format: 'iife',
			moduleName: 'test',//<your_project>
			sourceMap: 'inline',
		},

		customPreprocessors: {
			// Clones the base preprocessor, but overwrites
			// its options with those defined below.
			rollupBabel: {
				base: 'rollup',
				options: {
					// In this case, to use
					// a different transpiler:
					plugins: [
						require('rollup-plugin-babel')(),
					],
				}
			}
		}
	});
};