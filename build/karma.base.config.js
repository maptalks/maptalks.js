const config = require('./rollup.config').config;
config.name = 'maptalks';
config.format = 'umd';

module.exports = {
    frameworks: ['mocha', 'expect', 'expect-maptalks', 'sinon', 'happen'],
    basePath: '..',
    client: {
        mocha: {
          timeout : 8000
        }
    },
    files: [
        'src/index.js',
        'test/core/ClassSpec.js',
        'test/**/*.js',
        {
            pattern: 'assets/css/**/*.css',
            included: false
        }, {
            pattern: 'assets/images/**/*.png',
            included: false
        }, {
            pattern: 'test/resources/*',
            included: false
        }
    ],
    proxies: {
        '/images/': '/base/assets/images/',
        '/css/': '/base/assets/css/',
        '/lib/': '/base/assets/lib/',
        '/resources/': '/base/test/resources/'
    },
    preprocessors: {
        'test/core/ClassSpec.js': ['babel'],
        'src/index.js': ['rollup']
    },
    rollupPreprocessor: config,
    customLaunchers: {
        IE10: {
            base: 'IE',
            'x-ua-compatible': 'IE=EmulateIE10'
        },
        IE9: {
            base: 'IE',
            'x-ua-compatible': 'IE=EmulateIE9'
        }
    }
};
