module.exports = function (config) {
	let cfg = {
		basePath: '.',
		frameworks: ['mocha', 'chai'],
		browsers: ['ChromeDebugging'],
		reporters: ['mocha', 'coverage'],
		files: [
			'test/**/*.spec.js',
			// Watch src files for changes but
			// don't load them into the browser.
			{ pattern: 'src/**/*.js', included: false }
		],
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
			moduleName: 'test',	//<your_project>
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
		cfg.customLaunchers = {
			Chrome_travis_ci: {
				base: 'Chrome',
				flags: ['--no-sandbox']
			}
		};
	} else {
		cfg.browserDisconnectTimeout = 30000;
		cfg.browserNoActivityTimeout = 30000;
		cfg.processKillTimeout = 30000;
		cfg.preprocessors = {
			'src/**/*.js': ['rollupBabel'],
			'test/**/*.spec.js': ['rollupBabel']
		};
		cfg.customLaunchers = {
			ChromeDebugging: {
				base: 'Chrome',
				flags: ['--remote-debugging-port=9333']
			}
		};
	}
	config.set(cfg);
};