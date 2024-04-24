module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 4000
            }
        },
        files: [
            './node_modules/maptalks/dist/maptalks.js',
            './dist/maptalksgl.js',
            '../layer-gltf/dist/maptalks.gltf.js',
            './node_modules/@maptalks/vt/dist/maptalks.vt.js',
            '../analysis/dist/maptalks.analysis.js',
            'test/**/*.js',
            {
                pattern: 'test/fixtures/**/*',
                included: false
            },
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
            '/fixtures/': '/base/test/fixtures/',
            '/resources/': '/base/test/resources/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha'],
        plugins: ['karma-mocha', 'karma-mocha-reporter', 'karma-chrome-launcher', 'karma-expect']
    });
}
