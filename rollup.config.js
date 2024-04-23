const commonjs = require('@rollup/plugin-commonjs'),
    resolve = require('@rollup/plugin-node-resolve'),
    babel = require('@rollup/plugin-babel'),
    json = require('@rollup/plugin-json'),
    typescript = require('@rollup/plugin-typescript'),
    terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');
const { dts } = require("rollup-plugin-dts");

const testing = process.env.BUILD === 'test';
const dev = process.env.BUILD === 'dev';

const isDebug = testing || dev;
const plugins = testing ?
    [
        // ['istanbul', {
        //     // TileLayerGLRenderer is not testable on CI
        //     exclude: ['test/**/*.js', 'src/core/mapbox/*.js', 'src/util/dom.js', 'src/renderer/layer/tilelayer/TileLayerGLRenderer.js', 'src/renderer/layer/ImageGLRenderable.js', 'node_modules/**/*']
        // }]
    ]
    :
    [];

const year = new Date().getFullYear();
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${year} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log && console.log('${pkg.name} v${pkg.version}');`;

const rollupPlugins = [
    json(),
    resolve({
        module: true,
        jsnext: true,
        main: true
    }),
    commonjs(),
    typescript()
];

// const compilePlugins = [
//     babel({
//         plugins,
//         babelHelpers: 'bundled'
//     })
// ];

// if (!isDebug) {
//     rollupPlugins.push(terser(), ...compilePlugins)
// } else {
//     rollupPlugins.push(...compilePlugins);
// }
// const external = ['rbush', 'frustum-intersects', 'simplify-js'];

const builds = [
    {
        input: 'src/index.ts',
        plugins: rollupPlugins,
        output: [
            {
                'sourcemap': true,
                'format': 'umd',
                'name': 'maptalks',
                banner,
                outro,
                'file': pkg.main
            }
        ]
    },
    {
        input: 'dist/index.d.ts',
        plugins: [dts()],
        output: [
            {
                'sourcemap': true,
                'format': 'es',
                'name': 'maptalks',
                banner,
                'file': pkg['d.ts']
            }
        ]
    },
    {
        input: 'src/index.ts',
        plugins: rollupPlugins.concat([terser()]),
        output: [
            {
                'sourcemap': false,
                'format': 'umd',
                'name': 'maptalks',
                banner,
                outro,
                'file': pkg.minify
            }
        ]
    },
    //for browser esm
    {
        input: 'src/index.ts',
        plugins: rollupPlugins,
        output: [
            {
                'sourcemap': true,
                'format': 'es',
                banner,
                'file': pkg.module_browser
            }
        ]
    }
];

if (isDebug) {
    module.exports = builds.slice(0, 2);
} else {
    module.exports = builds;
}
