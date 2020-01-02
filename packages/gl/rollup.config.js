const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? pkg.main : 'dist/maptalksgl-dev.js';
const plugins = production ? [uglify({ output : { comments : '/^!/', beautify: true }})] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;
const configPlugins = [
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs()
];

module.exports = [
    {
        input: 'src/index.js',
        plugins: configPlugins.concat([babel(), ...plugins]),
        external : ['maptalks'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalksgl',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            banner,
            outro,
            'file': outputFile
        }
    },
    {
        input: 'src/index.js',
        plugins: configPlugins.concat(production ? [terser({ output : { comments : '/^!/', beautify: true }})] : []),
        external : ['maptalks', '@maptalks/reshader.gl', '@maptalks/fusiongl', 'regl', 'gl-matrix'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'es',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            banner,
            outro,
            'file': pkg.module
        }
    },
];
