const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const pkg = require('../package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? 'dist/maptalks.vt.js' : 'dist/maptalks.vt-dev.js';
const plugins = production ? [
    uglify({
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true
            }
        }
    })] : [];

module.exports = [{
    input: 'src/worker/index.js',
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        babel()
    ],
    output: {
        format: 'amd',
        name: 'maptalks',
        globals : {
            'maptalks' : 'maptalks'
        },
        extend : true,
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
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs()
    ],
    output: {
        format: 'amd',
        name: 'maptalks',
        globals : {
            'maptalks' : 'maptalks',
            '@maptalks/gl' : 'maptalksgl'
        },
        extend :true,
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
        globals : {
            'maptalks' : 'maptalks',
            '@maptalks/gl' : 'maptalksgl'
        },
        extend : true,
        name: 'maptalks',
        file: outputFile,
        format: 'umd',
        sourcemap: false,
        intro: `
var IS_NODE = typeof exports === 'object' && typeof module !== 'undefined';
var maptalks = maptalks;
var maptalksgl = gl;
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
    chunk(exports, maptalks, maptalksgl);
}
}`
    },
    plugins : [
        babel()
    ].concat(plugins),
    watch: {
        include: 'build/**/*.js'
    }
}];
