const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

export default {
    input: './src/index.js',
    output: {
        sourcemap : 'inline',
        name:'fusion',
        exports: 'named',
        format:'umd',
        file:'./dist/fusion.gl-dev.js'
    },
    plugins: [
        resolve(),
        commonjs()
    ]
};
