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
            './node_modules/maptalks/dist/maptalks.js',
            './node_modules/@maptalks/gl-layers/dist/maptalks-gl-layers.js',
            './test/js/turf.min.js',
            './dist/maptalks.traffic.js',
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
        reporters: ['mocha'],
        plugins: ['karma-mocha', 'karma-expect', 'karma-mocha-reporter', 'karma-chrome-launcher']
    });
};
