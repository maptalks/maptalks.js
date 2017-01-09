const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const localResolve = require('rollup-plugin-local-resolve');
const babel = require('rollup-plugin-babel');

module.exports = {
    frameworks: ['mocha', 'expect', 'expect-maptalks', 'sinon', 'happen'],
    basePath: '..',
    files: [
        'src/maptalks.js',
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
        'src/maptalks.js': ['rollup']
    },
    rollupPreprocessor: {
        plugins: [
            alias(require('./alias')),
            localResolve(),
            nodeResolve({
                jsnext: true,
                main: true,
                browser: true
            }),
            //convert zousan to es6 modules
            commonjs(),
            babel(),
        ],
        format: 'iife', // helps prevent naming collisions
        moduleName: 'maptalks', // required for 'iife' format
        sourceMap: 'inline', // sensible for testing
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
    }
};
