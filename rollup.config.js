const pkg = require('./package.json');
const resolve = require('rollup-plugin-node-resolve');
const terser = require('rollup-plugin-terser').terser;
const commonjs = require('rollup-plugin-commonjs');

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

export default {
    input: './src/index.js',
    output: {
        sourcemap : false,
        banner,
        format:'es',
        file: pkg.module
    },
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        terser({
            mangle: {
                properties: {
                    'regex' : /^_/,
                    'keep_quoted' : true
                }
            }
        })
    ]
};
