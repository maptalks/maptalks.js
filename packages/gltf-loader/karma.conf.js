module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 9000,
                // grep: "readInterleavedArray"
            }
        },
        files: [
            '../../node_modules/maptalks/dist/maptalks.min.js',
            '../gl/dist/maptalksgl.js',
            '../layer-3dtiles/dist/maptalks.3dtiles.js',
            '../transcoders.draco/dist/transcoders.draco.js',
            'dist/gltf-loader.js',
            'test/**/*.js',
            {
                pattern: 'test/models/**/*',
                included: false
            }
        ],
        proxies: {
            '/models/': '/base/test/models/'
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
