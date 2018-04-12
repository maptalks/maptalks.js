const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('./package.json');


const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

module.exports = {
    input: 'src/index.js',
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
    output: [
        {
            'sourcemap': false,
            'format': 'umd',
            'name': pkg.name,
            'banner': banner,
            'file': 'dist/' + pkg.name + '.js'
        },
        {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'file': 'dist/' + pkg.name + '.es.js'
        }
    ]
};
