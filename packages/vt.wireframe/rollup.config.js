const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? 'dist/maptalks.vt.wireframe.js' : 'dist/maptalks.vt.wireframe-dev.js';
const plugins = production ? [
    uglify({
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true
            }
        }
    })] : [];

function glsl() {

    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            var transformedCode = code.replace(/[ \t]*\/\/.*\n/g, '') // remove //
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

module.exports = {
    input: 'src/index.js',
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        glsl(),
        babel({
            exclude: 'node_modules/**'
        })
    ].concat(plugins),
    external : ['@maptalks/vt', '@maptalks/gl'],
    output: [
        {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalks.vt.wireframe',
            'banner': banner,
            'globals' : {
                '@maptalks/vt' : 'maptalks',
                '@maptalks/gl' : 'maptalksgl'
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
