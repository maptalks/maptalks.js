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
            'node_modules/maptalks/dist/maptalks.js',
            'node_modules/@maptalks/gl/dist/maptalksgl.js',
            "node_modules/@maptalks/transcoders.draco/dist/transcoders.draco.js",
            'node_modules/@maptalks/transform-control/dist/transform-control.js',
            pkg.main,
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
        reporters: ['mocha']
    });
};
