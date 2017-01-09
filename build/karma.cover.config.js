const base = require('./karma.base.config.js');

module.exports = function (config) {
    const options = Object.assign(base, {
        logLevel: config.LOG_DEBUG,
        browsers: ['PhantomJS'],
        // reporters: ['mocha', 'coverage'],
        // coverageReport: {
        //     dir: 'coverage',
        //     reporters: [
        //         { type: 'html', subdir: 'report-html' },
        //         { type: 'lcov', subdir: '.' }
        //     ]
        // },
        reporters: ['mocha', 'coverage', 'remap-coverate'],
        coverageReporter: {
            type: 'in-memory'
        },
        remapCoverageReporter: {
            html: './coverage/html-report'
        },
        singleRun: true
    });

    // const istanbul = require('rollup-plugin-istanbul');
    // options.rollupPreprocessor.plugins.push(istanbul({
    //     exclude: ['test/**/*.js', 'node_modules/**']
    // }));

    config.set(options);
};
