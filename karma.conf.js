const resolve = require('rollup-plugin-node-resolve'),
	babel = require('rollup-plugin-babel'),
	commonjs = require('rollup-plugin-commonjs');

module.exports = function (config) {
	let cfg = {
		basePath: '.',
		frameworks: ['mocha', 'chai'],
		browsers: ['ChromeDebugging'],
		reporters: ['mocha', 'coverage'],
		files: [
			'debug/**/*.spec.js',
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
		customPreprocessors: {
			// Clones the base preprocessor, but overwrites
			// its options with those defined below.
			rollupBabel: {
				base: 'rollup',
				options: {
					format: 'umd',
					moduleName: 'fusion',
					plugins: [
						resolve(),
						commonjs(),
						babel()
					],
				}
			}
		}
	}

	if (process.env.TRAVIS) {
		cfg.browsers = ['Chrome_travis_ci'];
		cfg.preprocessors = {
			'src/init.js': ['rollupBabel', 'coverage'],
			'debug/**/*.spec.js': ['rollupBabel', 'coverage']
		};
		//	https://docs.travis-ci.com/user/gui-and-headless-browsers/
		// - google-chrome-stable --headless --disable-gpu --remote-debugging-port=9222 http://localhost
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
			'src/init.js': ['rollupBabel'],
			'debug/**/*.spec.js': ['rollupBabel']
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