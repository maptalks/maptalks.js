const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const pkg = require('./package.json');
const terser = require('@rollup/plugin-terser');
const sourcemaps = require('rollup-plugin-sourcemaps');

const outputFile = pkg.main;

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

let outro = pkg.name + ' v' + pkg.version;
outro = `typeof console !== 'undefined' && console.log('${outro}');`;

module.exports = [
    {
        input: './index.js',
        plugins: [
            nodeResolve({
                module: true,
                // jsnext : true,
                main: true
            }),
            commonjs(),
            sourcemaps(),
            terser({
                mangle: false,
                compress: {
                    pure_getters: true
                },
                output: {
                    ecma: 2017,
                    // keep_quoted_props: true,
                    beautify: false,
                    comments: '/^!/'
                }
            })
        ],
        output: {
            sourcemap: true,
            banner,
            outro,
            extend: true,
            name: 'maptalks',
            file: outputFile,
            format: 'umd'
        }
    }
];
