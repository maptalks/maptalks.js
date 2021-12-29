const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('rollup-plugin-terser').terser;
const nodePolyfills = require('rollup-plugin-polyfill-node');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

const plugins = [
    nodePolyfills(),
    nodeResolve({
        // module : true,
        // jsnext : true,
        // main : true
    }),
    commonjs(),
];

const intro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');\nconst transcoder = function () {\n`;
const outro = `
    };
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        const maptalksgl = require('@maptalks/gl');
        maptalksgl.transcoders.registerTranscoder('draco', transcoder);
    } else {
        return transcoder;
    }
`;

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
            beautify: false,
            comments : '/^!/'
        }
    }));
}

module.exports = [
    {
        input: 'src/index.js',
        external : ['@maptalks/gl',],
        plugins : plugins,
        output: [
            {
                'sourcemap': false,
                'format': 'umd',
                'name': 'maptalksgl.transcoders.draco',
                'globals' : {
                    '@maptalks/gl' : 'maptalksgl'
                },
                banner,
                intro,
                outro,
                'file': pkg.main
            }
        ]
    },
];
