/**
 * karma configuration
 * for matrix
 * reference https://github.com/jlmakes/karma-rollup-preprocessor
 */
module.exports = function (config) {
	config.set({
		// base path, that will be used to resolve files and exclude
		//basePath: '..',
		// frameworks to use
		frameworks: ['mocha', 'expect'],
		client: {
			'mocha': {
				'ui': 'bdd'
			}
		},
		// list of files / patterns to load in the browser
		files: [
			'dist/kiwi.gl.js',
			'test/**/*.spec.js',
		],
		// add a preprocessor for the main test file
		preprocessors: {
			//'src/**/*.js': ['babel'],
			'test/**/*.spec.js': ['babel']
			//'test/main-node.js': ['rollupNode'],
		},
		babelPreprocessor: {
			options: {
				presets: ['es2015'],
				sourceMap: 'inline'
			},
			filename: function (file) {
				return file.originalPath.replace(/\.js$/, '.es5.js');
			},
			sourceFileName: function (file) {
				return file.originalPath;
			}
		},
		// load necessary plugins
		plugins: [
			'karma-phantomjs-launcher',
			'karma-babel-preprocessor',
			'karma-chrome-launcher',
			'karma-expect',
			'karma-mocha',
			'karma-mocha-reporter'
		],
		// list of files to exclude
		exclude: [],
		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['mocha'],
		// web server port
		port: 9876,
		// enable / disable colors in the output (reporters and logs)
		colors: true,
		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO ||
		// config.LOG_DEBUG
		logLevel: config.LOG_INFO,
		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,
		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera (has to be installed with `npm install karma-opera-launcher`)
		// - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
		// - PhantomJS
		// - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
		browsers: ['PhantomJS'],
		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,
		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true,
	})
}