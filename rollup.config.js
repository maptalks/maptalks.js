const commonjs = require('rollup-plugin-commonjs'),
    resolve = require('rollup-plugin-node-resolve'),
    babel = require('rollup-plugin-babel');
const pkg = require('./package.json');

const testing = process.env.BUILD === 'test';
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

module.exports = {
    input: 'src/index.js',
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        babel({
            plugins
        })
    ],
    output: [
        {
            'sourcemap': testing ? 'inline' : false,
            'format': 'umd',
            'name': 'maptalks',
            banner,
            outro,
            'file': pkg.main
        },
        {
            'sourcemap': false,
            'format': 'es',
            banner,
            'file': pkg.module
        }
    ]
};
