module.exports = function (config) {
	let cfg = {
		basePath: '.',
		frameworks: ['mocha', 'chai'],
		browsers: ['Chrome'],
		reporters: ['mocha', 'coverage'],
		files: [
			'test/**/*.spec.js',
			// Watch src files for changes but
			// don't load them into the browser.
			{ pattern: 'src/**/*.js', included: false },

		],
		preprocessors: {
			//'test/buble/**/*.spec.js': ['rollup'],
			'src/**/*.js': ['rollupBabel', 'coverage'],
			'test/**/*.spec.js': ['rollupBabel', 'coverage'],
		},
		coverageReporter: {
			reporters: [
				{ type: 'lcovonly', subdir: '.' },
				{ type: 'json', subdir: '.' },
			]
		},
		rollupPreprocessor: {
			plugins: [
				require('rollup-plugin-buble')(),
			],
			format: 'iife',
			moduleName: 'test',//<your_project>
			sourceMap: 'inline',
		},
		customLaunchers: {
			Chrome_travis_ci: {
				base: 'Chrome',
				flags: ['--no-sandbox']
			}
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
						require('rollup-plugin-node-resolve')(),
						require('rollup-plugin-babel')(),
					],
				}
			}
		}
	}
	if (process.env.TRAVIS) {
		cfg.browsers = ['Chrome_travis_ci'];
		cfg.preprocessors = {
			'src/**/*.js': ['rollupBabel', 'coverage'],
			'test/**/*.spec.js': ['rollupBabel', 'coverage']
		};
	} else {
		cfg.preprocessors = {
			'src/**/*.js': ['rollupBabel'],
			'test/**/*.spec.js': ['rollupBabel']
		};
	}
	config.set(cfg);
};