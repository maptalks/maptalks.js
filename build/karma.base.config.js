const alias = require('./alias');
const commonjs = require('rollup-plugin-commonjs'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    localResolve = require('rollup-plugin-local-resolve');
/*const webpackConfig = {
    resolve: {
        alias: alias
    },
    node: {
        fs: 'empty',
        url: 'empty',
        http: 'empty',
        https: 'empty'
    },
    module: {
        loaders: [{
            test: /\.js/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        }]
    },
    devtool: '#inline-source-map'
};*/

module.exports = {
    frameworks: ['mocha', 'expect', 'expect-maptalks', 'sinon', 'happen'],
    basePath: '..',
    files: [
        { pattern: 'src/maptalks.js', included: true },
        'test/**/*.js'
    // {
    //     pattern: 'build/test-context.js',
    //     watched: false
    // }, {
    //     pattern: 'assets/css/**/*.css',
    //     watched: true,
    //     included: false,
    //     served: true
    // }, {
    //     pattern: 'assets/images/**/*.png',
    //     watched: false,
    //     included: false,
    //     served: true
    // }, {
    //     pattern: 'test/resources/*',
    //     watched: false,
    //     included: false,
    //     served: true
    // }
    ],
    proxies: {
        '/images/': '/base/assets/images/',
        '/css/': '/base/assets/css/',
        '/lib/': '/base/assets/lib/',
        '/resources/': '/base/test/resources/'
    },
    preprocessors: {
        'src/maptalks.js': ['rollup'],
        'test/**/*.js': ['babel', 'sourcemap']
    },
    rollupPreprocessor: {
        plugins : [
            require('rollup-plugin-alias')(alias),
            localResolve(),
            nodeResolve({
                jsnext: true,
                main: true,
                browser: true
            }),
            //convert zousan to es6 modules
            commonjs(),
            require('rollup-plugin-buble')(),
        ],
        format: 'iife',               // helps prevent naming collisions
        moduleName: 'window', // required for 'iife' format
        sourceMap: 'inline',          // sensible for testing
    },
    babelPreprocessor: {
      options: {
        "presets": [
            "es2015"
          ],
        "sourceMap" : 'inline',
        "plugins": [
            ["transform-es2015-modules-umd"],
            ["module-resolver", {
              "root": ["./"],
              "alias": {
                src: '/base/src',
                control: '/base/src/control',
                core: '/base/src/core',
                geo: '/base/src/geo',
                geometry: '/base/src/geometry',
                handler: '/base/src/handler',
                layer: '/base/src/layer',
                map: '/base/src/map',
                renderer: '/base/src/renderer',
                ui: '/base/src/ui',
                utils: '/base/src/utils'
              }
            }]
        ]
      }
    },
    customLaunchers: {
        IE10: {
            base: 'IE',
            'x-ua-compatible': 'IE=EmulateIE10'
        },
        IE9: {
            base: 'IE',
            'x-ua-compatible': 'IE=EmulateIE9'
        }
    }/*,
    webpack: webpackConfig,
    webpackMiddleward: {
        noInfo: true
    }*/
};
