const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('../package.json');

module.exports = [
{
    input: 'src/worker/index.js',
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        }),
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
    watch: {
        include: 'src/worker/**'
    }
},
{
    input: 'src/layer/index.js',
    external: ['maptalks'],
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    output: {
        format: 'amd',
        name: 'maptalks',
        globals : {
            'maptalks' : 'maptalks'
        },
        extend :true,
        file: 'build/layer.js'
    },
    watch: {
        include: 'src/layer/**'
    }
},
{
    // Next, bundle together the three "chunks" produced in the previous pass
    // into a single, final bundle. See 'intro:' below and rollup/mapboxgl.js
    // for details.
    input: './build/index.js',
    external: [ 'maptalks' ],
    output: {
        globals : {
            'maptalks' : 'maptalks'
        },
        extend : true,
        name: 'maptalks',
        file: pkg.main,
        format: 'umd',
        sourcemap: false,
        intro: `
let workerLoaded;
function define(_, chunk) {
if (!workerLoaded) {
    maptalks.registerWorkerAdapter('${pkg.name}', chunk);
    workerLoaded = true;
} else {
    const exports = maptalks;
    chunk(exports, maptalks);
}
}`
    },
    plugins: [],
    watch: {
        include: 'build/**/*.js'
    }
}];
