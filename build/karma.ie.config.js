const base = require('./karma.base.config.js');

module.exports = function (config) {
    const options = Object.assign(base, {
        browsers: ['IE'],
        reporters: ['mocha'],
        singleRun: true
    });

    config.set(options);
};

