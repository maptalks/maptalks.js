module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 2000
            }
        },
        files: [
            '../../node_modules/maptalks/dist/maptalks.js',
            'dist/vector-packer.js',
            'test/**/*.js',
            {
                pattern: 'test/resources/**/*',
                included: false
            }
        ],
        proxies: {
            '/resources/': '/base/test/resources/'
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
