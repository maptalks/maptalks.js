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
            '../../node_modules/maptalks/dist/maptalks.js',
            '../gl/dist/maptalksgl.js',
            '../layer-gltf/dist/maptalks.gltf.js',
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
        reporters: ['mocha']
    });
};
