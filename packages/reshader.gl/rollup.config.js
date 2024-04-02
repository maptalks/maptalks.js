const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
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

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

const plugins = [
    // glsl(),
    production ? glslMinify({
        commons: [
            './src/shaderlib/glsl'
        ]
    }) : glsl(),
    nodeResolve({
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
        //         'keep_quoted' : true,
        //         'reserved': ['on', 'once', 'off'],
        //     }
        // },
        compress: {
            pure_getters: true
        },
        output : {
            ecma: 2017,
            // keep_quoted_props: true,
            beautify: true,
            comments : '/^!/'
        }
    }));
}

module.exports = [
    {
        input: 'src/index.js',
        external : ['gl-matrix', '@maptalks/gltf-loader', '@maptalks/tbn-packer'],
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
