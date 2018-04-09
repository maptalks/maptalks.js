const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require('../package.json');

module.exports = {
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
        format: 'umd',
        name: 'worker',
        globals : {
            'maptalks' : 'maptalks'
        },
        file: 'dist/' + pkg.name + '.worker.js'
    }
};
