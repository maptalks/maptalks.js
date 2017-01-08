const base = require('./karma.base.config.js');

module.exports = function (config) {
    const options = Object.assign(base, {
        browsers: ['PhantomJS'],
        reporters: ['mocha', 'coverage'],
        // coverage output setting
        coverageReporter: {
            reporters: [
                {type: 'html', dir: 'coverage/'},
                {
                    type: 'lcov',
                    dir: 'coverage',
                    subdir: '.'
                }
            ]
        }
        singleRun: true
    });

    config.set(options);
};
