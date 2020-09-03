const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const uglify = require('rollup-plugin-uglify').uglify;
const glslMinify = require('@maptalks/rollup-plugin-glsl-minify');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = 'dist/maptalks.vt.basic.js';//production ? 'dist/maptalks.vt.basic.js' : 'dist/maptalks.vt.basic-dev.js';
const plugins = production ? [
    uglify({
        mangle: {
            properties: {
                'regex': /^_/,
                'keep_quoted': true
            }
        },
        output: {
            beautify: true,
            comments: '/^!/'
        }
    })] : [];

function glsl() {

    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            var transformedCode = code
                .replace(/\r{1,}/g, '\\n') // # \r+ to \n
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{1,}/g, '\\n') // # \n+ to \n
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

module.exports = {
    input: 'src/index.js',
    plugins: [
        json(),
        production ? glslMinify({
            commons: []
        }) : glsl(),
        resolve({
            mainFields: ['module', 'main'],
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**',
            compact: false
        })
    ].concat(plugins),
    external: ['@maptalks/vt', '@maptalks/gl', 'maptalks'],
    output: [
        {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalks.vt.basic',
            'banner': banner,
            'outro': outro,
            'globals': {
                '@maptalks/gl': 'maptalksgl',
                '@maptalks/vt': 'maptalks',
                'maptalks': 'maptalks'
            },
            'file': outputFile
        }/* ,
        {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'file': pkg.module
        } */
    ]
};
