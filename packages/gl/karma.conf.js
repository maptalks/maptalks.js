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
            '../../node_modules/maptalks/dist/maptalks.js',
            './dist/maptalksgl-dev.js',
            'test/**/*.js',
            {
                pattern: 'test/fixtures/**/*',
                included: false
            }
        ],
        proxies: {
            '/fixtures/': '/base/test/fixtures/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
