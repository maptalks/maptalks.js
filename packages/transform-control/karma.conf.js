const pkg = require('./package.json');

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 6000
            }
        },
        files: [
            'node_modules/maptalks/dist/maptalks.js',
            'node_modules/@maptalks/gl/dist/maptalksgl.js',
            pkg.main,
            'test/**/*.js',
            {
                pattern: 'test/models/**/*',
                included: false
            }
        ],
        proxies: {
            '/models/': '/base/test/models/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
