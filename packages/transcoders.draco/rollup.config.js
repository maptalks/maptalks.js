const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const nodePolyfills = require('rollup-plugin-polyfill-node');
const replace = require('@rollup/plugin-replace');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2022-${new Date().getFullYear()} maptalks.com\n */`;

const plugins = [
    nodePolyfills(),
    nodeResolve({
        // module : true,
        // jsnext : true,
        // main : true
    }),
    commonjs(),
];

const getGlobal = function () {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
};

const printVer = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');\n`;
const intro = `${printVer} const transcoder = function () { const getGlobal = ${getGlobal.toString()}; const currentGlobal = getGlobal(); if (!currentGlobal.draco______decoder) currentGlobal.draco______decoder = function () {\n`;
const outro = `
    }(); return currentGlobal.draco______decoder; };
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        const maptalksgl = require('@maptalks/gl');
        maptalksgl.transcoders.registerTranscoder('draco', transcoder);
    } else {
        return transcoder;
    }
`;

const terserPlugin = terser({
    toplevel: true,
    mangle: {
        // properties: {
        //     // 'regex' : /^_/,
        //     'keep_quoted' : true,
        //     'reserved': ['maptalks', 'transcoders', 'draco'],
        // }
    },
    compress: {
        pure_getters: true
    },
    output : {
        ecma: 2017,
        // keep_quoted_props: true,
        beautify: false,
        comments : '/^!/'
    }
});

module.exports = [
    {
        input: 'src/index.js',
        external : ['@maptalks/gl',],
        plugins : plugins.concat(production ? [terserPlugin] : []),
        output: [
            {
                'sourcemap': false,
                'format': 'umd',
                extend: true,
                'name': 'maptalks.transcoders.draco',
                'globals' : {
                    '@maptalks/gl' : 'maptalks'
                },
                intro,
                outro,
                file: pkg.main,
                banner: `${banner}(function () {`,
                footer: '}())'
            }
        ]
    }
];

if (production) {
    module.exports.push(
        {
            input: 'src/index.js',
            external : ['@maptalks/gl/dist/transcoders'],
            plugins : plugins.concat([
                replace({
                  // '(function(A) {': 'function (A) {',
                  'export { promisify as default };': 'return promisify;',
                  preventAssignment: false,
                  delimiters: ['', '']
                }),
                terserPlugin
            ]),
            output: {
                strict: false,
                format: 'es',
                name: 'exports',
                exports: 'named',
                extend: true,
                file: 'dist/transcoder.js',
                banner: `export default function () { const getGlobal = ${getGlobal.toString()}; const currentGlobal = getGlobal(); if (!currentGlobal.draco______decoder) currentGlobal.draco______decoder = function () {`,
                footer: '}(); return currentGlobal.draco______decoder; };',
            }
        },
        {
            input: 'src/index.es.js',
            external : ['@maptalks/gl/dist/transcoders'],
            plugins : plugins,
            output: {
                globals: {
                    '@maptalks/gl': 'maptalks'
                },
                extend: true,
                format: 'es',
                sourcemap: false,
                name: 'maptalks.transcoders.draco',
                banner,
                intro: printVer,
                file: pkg.module
            }
        }
    );
}
