const base = require('./karma.base.config.js');

module.exports = function (config) {
    config.set(Object.assign(base, {
        /*browsers: ['Chrome', 'Firefox', 'Safari'],
        reporters: ['progress'],*/
        browsers: ['PhantomJS'],
        reporters: ['mocha'],
        singleRun: true
    }));
};
