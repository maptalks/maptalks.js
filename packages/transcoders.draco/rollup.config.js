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


const printVer = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');\n`;
const intro = `${printVer} const transcoder = function () {\n`;
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
        toplevel: true,
        mangle: {
            // properties: {
            //     // 'regex' : /^_/,
            //     'keep_quoted' : true,
            //     'reserved': ['maptalksgl', 'transcoders', 'draco'],
            // }
        },
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
    }
];

if (production) {

    module.exports.push(
        {
            input: 'src/index.es.js',
            external : ['@maptalks/gl/dist/transcoders'],
            plugins : plugins,
            output: {
                globals: {
                    '@maptalks/gl': 'maptalksgl'
                },
                extend: true,
                format: 'es',
                sourcemap: false,
                name: 'maptalksgl.transcoders.draco',
                banner,
                intro: printVer,
                file: pkg.module
            }
        }
    )
}
