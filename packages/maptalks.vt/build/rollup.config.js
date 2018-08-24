const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('../package.json');

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
    watch: {
        include: 'src/worker/**'
    }
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
    watch: {
        include: 'src/layer/**'
    }
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
        file: pkg.main,
        format: 'umd',
        sourcemap: false,
        intro: `
var workerLoaded;
function define(_, chunk) {
if (!workerLoaded) {
    maptalks.registerWorkerAdapter('${pkg.name}', chunk);
    workerLoaded = true;
} else {
    var exports = maptalks;
    chunk(exports, maptalks, maptalksgl);
}
}`
    },
    plugins : [
        babel()
    ],
    watch: {
        include: 'build/**/*.js'
    }
}];
