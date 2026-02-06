const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const pkg = require('./package.json');
const terser = require('@rollup/plugin-terser');
const copy = require('rollup-plugin-copy');

const outputFile = pkg.main;

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

let outro = pkg.name + ' v' + pkg.version;
outro = `typeof console !== 'undefined' && console.log('${outro}');`;

module.exports = [
    {
        input: './index.js',
        plugins: [
            copy({
                targets: [
                    { src: '../maptalks/assets/*', dest: 'dist' },
                    { src: '../maptalks/assets/maptalks.css', dest: 'dist/', rename: 'maptalks-gpu.css' },
                ]
            }),
            nodeResolve({
                module: true,
                // jsnext : true,
                main: true
            }),
            commonjs(),
            terser({
                mangle: true,
                compress: {
                    pure_getters: true
                },
                // three.js 151-160 needs constructor.name to decide if isWebGL2
                keep_classnames: true,
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
