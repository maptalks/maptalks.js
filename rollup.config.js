const commonjs = require('rollup-plugin-commonjs'),
    resolve = require('rollup-plugin-node-resolve'),
    babel = require('rollup-plugin-babel'),
    json = require('rollup-plugin-json');
const pkg = require('./package.json');

const testing = process.env.BUILD === 'test';
const dev = process.env.BUILD === 'dev';
console.log(process.env.BUILD);
const isDebug = testing || dev;
const plugins = testing ?
    [
        ['istanbul', {
            // TileLayerGLRenderer is not testable on CI
            exclude: ['test/**/*.js', 'src/core/mapbox/*.js', 'src/util/dom.js', 'src/renderer/layer/tilelayer/TileLayerGLRenderer.js', 'src/renderer/layer/ImageGLRenderable.js', 'node_modules/**/*']
        }]]
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
    babel({
        plugins
    })
];
const external = ['rbush', 'frustum-intersects', 'simplify-js', 'zousan'];

const builds = [
    {
        input: 'src/index.js',
        plugins: rollupPlugins,
        output: [
            {
                'sourcemap': isDebug,
                'format': 'umd',
                'name': 'maptalks',
                banner,
                outro,
                'file': pkg.main
            }
        ]
    },
    {
        input: 'src/index.js',
        plugins: rollupPlugins,
        external,
        output: [
            {
                'sourcemap': false,
                'format': 'es',
                banner,
                'file': pkg.module
            }
        ]
    },
    //for browser esm
    {
        input: 'src/index.js',
        plugins: rollupPlugins,
        output: [
            {
                'sourcemap': false,
                'format': 'es',
                banner,
                'file': pkg.module_browser
            }
        ]
    }];

if (isDebug) {
    module.exports = [builds[0]];
} else {
    module.exports = builds;
}
