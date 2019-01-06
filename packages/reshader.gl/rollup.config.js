const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

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

const plugins = [
    glsl(),
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs(),
];

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
        plugins : plugins.concat([terser({
            // mangle: {
            //     properties: {
            //         'regex' : /^_/,
            //         'keep_quoted' : true
            //     }
            // },
            output : {
                comments : '/^!/'
            }
        })]),
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
