const pkg = require('./package.json');

module.exports = function (config) {
    config.set({
        browserDisconnectTimeout: 100000,
        browserNoActivityTimeout: 100000,
        browserDisconnectTolerance: 12,
        frameworks: ['mocha', 'expect', 'happen'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 40000
            }
        },
        files: [
            './node_modules/maptalks/dist/maptalks.js',
            '../gl/dist/maptalksgl.js',
            pkg.main,
            "../transcoders.draco/dist/transcoders.draco.js",
            '../transform-control/dist/transform-control.js',
            './node_modules/@maptalks/vt/dist/maptalks.vt.js',
            '../analysis/dist/maptalks.analysis.js',
            'test/js/flv.min.js',

            'test/test.config.js',
            'test/**/*.js',
            {
                pattern: 'test/models/**/*',
                included: false
            },
            {
                pattern: 'test/images/**/*',
                included: false
            },
            {
                pattern: 'test/resources/**/*',
                included: false
            }
        ],
        proxies: {
            '/models/': '/base/test/models/',
            '/images/': '/base/test/images/',
            '/resources/': '/base/test/resources/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        flags: [
            // '--disable-gpu'
        ],
        reporters: ['mocha'],
        plugins: ['karma-mocha', 'karma-expect', 'karma-mocha-reporter', 'karma-chrome-launcher', 'karma-happen']
    });
};
