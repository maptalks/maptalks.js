/**
 * karma configuration
 * for matrix
 * reference https://github.com/jlmakes/karma-rollup-preprocessor
 */
module.exports = function (config) {
	config.set({
		// base path, that will be used to resolve files and exclude
		basePath: '..',
		// frameworks to use
		frameworks: ['mocha'],
		// list of files / patterns to load in the browser
		files: [
			'src/init.js',
			'test/**/*.spec.js',
		],
		// add a preprocessor for the main test file
		preprocessors: {
			//'src/**/*.js': ['babel'],
			'src/init.js':['babel']
            //'test/main-node.js': ['rollupNode'],
		},
		// specify the config for the rollup pre-processor: run babel plugin on the code
		rollupPreprocessor: {
			format: 'iife',
            moduleName: 'kiwi.gl',
            //sourceMap: 'inline',
			plugins: [
				require('rollup-plugin-buble')(),
			],
		},
		// specify a custom config for the rollup pre-processor:
		// run node-resolve + commonjs + buble plugin on the code
		// customPreprocessors: {
		// 	rollupNode: {
		// 		base: 'rollup',
		// 		options: {
		// 			plugins: [
		// 				require('rollup-plugin-node-resolve')(),
		// 				require('rollup-plugin-commonjs')(),
		// 				require('rollup-plugin-buble')(),
		// 			],
		// 		},
		// 	},
		// },
		// load necessary plugins
		plugins: [
			//'karma-jasmine',
			//'karma-phantomjs-launcher',
			//require('./lib'),
		],
		// list of files to exclude
		exclude: [],
		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage','mochawesome'
		reporters: ['mochawesome'],
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
		browsers: ['Chrome'],
		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,
		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true,
	})
}