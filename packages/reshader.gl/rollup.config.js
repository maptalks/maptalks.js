const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');
const glslMinify = require('@maptalks/rollup-plugin-glsl-minify');

const production = process.env.BUILD === 'production';

function glsl() {
    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            let transformedCode = JSON.stringify(code.trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n')); // # \n+ to \n;;
            transformedCode = `export default ${transformedCode};`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

const plugins = [
    // glsl(),
    production ? glslMinify({
        commons: [
            './src/shaderlib/glsl'
        ]
    }) : glsl(),
    resolve({
        // module : true,
        // jsnext : true,
        // main : true
    }),
    commonjs(),
];

if (production) {
    plugins.push(terser({
        // mangle: {
        //     properties: {
        //         'regex' : /^_/,
        //         'keep_quoted' : true
        //     }
        // },
        output : {
            beautify: true,
            comments : '/^!/'
        }
    }));
}

module.exports = [
    {
        input: 'src/index.js',
        plugins,
        output: [
            {
                'sourcemap': true,
                'format': 'umd',
                'name': 'reshader',
                'banner': banner,
                'file': 'dist/reshadergl.js'
            }
        ]
    },
    {
        input: 'src/index.js',
        external : ['gl-matrix'],
        plugins : plugins,
        output: [
            {
                'sourcemap': false,
                'format': 'es',
                'banner': banner,
                'file': pkg.module
            }
        ]
    },
];
