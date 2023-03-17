const pkg = require('./package.json');

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 10000
            }
        },
        files: [
            '../../node_modules/maptalks/dist/maptalks.js',
            '../gl/dist/maptalksgl.js',
            '../../node_modules/@maptalks/gltf-layer/dist/maptalks.gltf.js',
            pkg.main,
            'test/**/*.js',
            {
                pattern: 'test/models/**/*',
                included: false
            },
            {
                pattern: 'test/resources/**/*',
                included: false
            }
        ],
        proxies: {
            '/models/': '/base/test/models/',
            '/resources/': '/base/test/resources/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
