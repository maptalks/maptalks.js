const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? pkg.main : 'dist/maptalksgl-dev.js';
const plugins = production ? [uglify({ output : { comments : '/^!/' }})] : [];

function glsl() {
    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            let transformedCode = code.replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{1,}/g, '\\n') // # \n+ to \n
                .replace(/\r{1,}/g, '\\n') // # \r+ to \n
                .replace(/"/g, '\\"');
            transformedCode = `export default "${transformedCode}";`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;
const configPlugins = [
    glsl(),
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
        plugins: configPlugins.concat(production ? [terser({ output : { comments : '/^!/' }})] : []),
        external : ['maptalks'],
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
