const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

const plugins = [
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
        output: {
            ecma: 2017,
            // keep_quoted_props: true,
            beautify: true,
            comments: '/^!/'
        }
    }));
}

module.exports = [
    {
        input: 'src/index.js',
        external: [
            // package.json中的dependencies必须要全部排除出去，否则会出现打包错误
            'maptalks',
            '@mapbox/point-geometry',
            '@mapbox/shelf-pack',
            '@mapbox/tiny-sdf',
            '@maptalks/feature-filter',
            '@maptalks/function-type',
            '@maptalks/tbn-packer',
            'color',
            'earcut',
            'gl-matrix',
            'quickselect',
            'tinyqueue'
        ],
        plugins: plugins,
        output: [
            {
                'sourcemap': true,
                'format': 'es',
                'banner': banner,
                'file': pkg.module
            }
        ]
    },
];
