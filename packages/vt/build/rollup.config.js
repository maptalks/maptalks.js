const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const uglify = require('rollup-plugin-uglify').uglify;
const pkg = require('../package.json');

const production = process.env.BUILD === 'production';
const outputFile = 'dist/maptalks.vt.js';//(production || process.env.BUILD === 'test') ? 'dist/maptalks.vt.js' : 'dist/maptalks.vt-dev.js';
const plugins = production ? [
    uglify({
        mangle: {
            properties: {
                'regex': /^_/,
                'keep_quoted': true
            }
        }
    })] : [];
//worker.js中的global可能被webpack替换为全局变量，造成worker代码执行失败，所以这里统一把typeof global替换为typeof undefined
function removeGlobal() {
    return {
        transform(code, id) {
            if (id.indexOf('worker.js') === -1) return null;
            const commonjsCode = /typeof global/g;
            var transformedCode = code.replace(commonjsCode, 'typeof undefined');
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

module.exports = [{
    input: 'src/worker/index.js',
    plugins: [
        json(),
        resolve({
            module: true,
            jsnext: true,
            main: true
        }),
        commonjs(),
        babel()
    ],
    external: ['maptalks'],
    output: {
        format: 'amd',
        name: 'maptalks',
        globals: {
            'maptalks': 'maptalks'
        },
        extend: true,
        file: 'build/worker.js'
    },
    // watch: {
    //     include: 'src/worker/**'
    // }
},
{
    input: 'src/layer/index.js',
    external: ['maptalks', '@maptalks/gl'],
    plugins: [
        json(),
        resolve({
            module: true,
            jsnext: true,
            main: true
        }),
        commonjs()
    ],
    output: {
        format: 'amd',
        name: 'maptalks',
        globals: {
            'maptalks': 'maptalks',
            '@maptalks/gl': 'maptalksgl'
        },
        extend: true,
        file: 'build/layer.js'
    },
    // watch: {
    //     include: 'src/layer/**'
    // }
},
{
    input: './build/index.js',
    external: ['maptalks', '@maptalks/gl'],
    output: {
        globals: {
            'maptalks': 'maptalks',
            '@maptalks/gl': 'maptalksgl'
        },
        extend: true,
        name: 'maptalks',
        file: outputFile,
        format: 'umd',
        sourcemap: false,
        intro: `
var IS_NODE = typeof exports === 'object' && typeof module !== 'undefined';
var maptalks = maptalks;
var maptalksgl = maptalksgl;
if (IS_NODE) {
    maptalks = maptalks || require('maptalks');
    maptalksgl = maptalksgl || require('@maptalks/gl');
}
var workerLoaded;
function define(_, chunk) {
if (!workerLoaded) {
    maptalks.registerWorkerAdapter('${pkg.name}', chunk);
    workerLoaded = true;
} else {
    var exports = IS_NODE ? module.exports : maptalks;
    chunk(exports, maptalks, maptalksgl);
}
}`
    },
    plugins: [
        babel(),
        removeGlobal()
    ].concat(plugins),
    watch: {
        include: 'build/**/*.js'
    }
}];
