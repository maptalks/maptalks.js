const pkg = require('./package.json');

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect', 'happen'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 10000
            }
        },
        files: [
            './node_modules/maptalks/dist/maptalks.js',
            '../gl/dist/maptalksgl.js',
            pkg.main,
            'test/**/*.js',
            {
                pattern: 'test/video/**/*',
                included: false
            }
        ],
        proxies: {
            '/video/': '/base/test/video/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha'],
        plugins: ['karma-mocha', 'karma-happen', 'karma-expect', 'karma-mocha-reporter', 'karma-chrome-launcher']
    });
};
