const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const terser = require('rollup-plugin-terser').terser;
const glslMinify = require('@maptalks/rollup-plugin-glsl-minify');
const replace = require('@rollup/plugin-replace');
const pkg = require('../package.json');

const production = process.env.BUILD === 'production';
const outputFile = 'dist/maptalks.vt.js';//(production || process.env.BUILD === 'test') ? 'dist/maptalks.vt.js' : 'dist/maptalks.vt-dev.js';
const plugins = production ? [
    terser({
        module: true,
        mangle: {
            properties: {
                'regex': /^_/,
                'keep_quoted': true,
                'reserved': ['on', 'once', 'off'],
            }
        },
        output: {
            beautify: true,
            comments: '/^!/'
        }
    })] : [];
//worker.js中的global可能被webpack替换为全局变量，造成worker代码执行失败，所以这里统一把typeof global替换为typeof undefined
function removeGlobal() {
    return {
        transform(code, id) {
            if (id.indexOf('worker.js') === -1) return null;
            const commonjsCode = /typeof global/g;
            var transformedCode = code.replace(commonjsCode, 'typeof undefined');
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

function transformBackQuote() {
    return {
        renderChunk(code) {
            // if (/\.js/.test(id) === false) return null;
            // var transformedCode = 'const code = `' + code.replace(/`/g, '\\`') + '`';
            code = code.substring('export default '.length)
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$\{/g, '${e}');
            var transformedCode = 'const e = "${"; const code = `' + code + '`;\n';
            transformedCode += 'export default code';
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

function glsl() {

    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            var transformedCode = code
                .replace(/\r{1,}/g, '\\n') // # \r+ to \n
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{1,}/g, '\\n') // # \n+ to \n
                .replace(/"/g, '\\"');
            transformedCode = `export default "${transformedCode}";`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}


const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;

module.exports = [{
        input: 'src/worker/index.js',
        external: ['maptalks'],
        plugins: [
            json(),
            nodeResolve({
                mainFields: ['module', 'main'],
            }),
            commonjs(),
            replace({
              // 'this.exports = this.exports || {}': '',
              '(function (exports) {': 'function (exports) {',
              '})(this.exports = this.exports || {});': '}',
              preventAssignment: false,
              delimiters: ['', '']
            }),
        ].concat(plugins).concat([transformBackQuote()]),
        output: {
            strict: false,
            format: 'iife',
            name: 'exports',
            globals: ['exports'],
            extend: true,
            file: 'build/worker.js',
            banner: `export default `,
            // footer: ``
        },
        watch: {
            include: ['src/worker/**/*.js']
        }
    },
    {
        input: './build/index.js',
        external: ['maptalks', '@maptalks/gl'],
        output: {
            globals: {
                'maptalks': 'maptalks',
                '@maptalks/gl': 'maptalksgl'
            },
            banner,
            outro,
            extend: true,
            name: 'maptalks',
            file: outputFile,
            format: 'umd',
            sourcemap: production ? false : 'inline',
        },
        plugins: [
            json(),
            production ? glslMinify({
                commons: []
            }) : glsl(),
            nodeResolve({
                mainFields: ['module', 'main'],
            }),
            commonjs(),
            removeGlobal()
        ].concat(plugins),
        watch: {
            include: ['build/**/*.js', 'src/layer/**/*.js']
        }
    },
    {
        input: './build/index.js',
        external: ['maptalks', '@maptalks/gl',
        '@mapbox/point-geometry', '@mapbox/vector-tile', '@maptalks/feature-filter', '@maptalks/function-type', '@maptalks/geojson-bbox',
        '@maptalks/tbn-packer', '@maptalks/vt-plugin', '@maptalks/vector-packer',
         'animation-easings', 'color', 'earcut', 'fast-deep-equal', 'geojson-vt', 'gl-matrix', 'pbf', 'quickselect', 'rbush', 'vt-pbf'],
        output: {
            globals: {
                'maptalks': 'maptalks',
                '@maptalks/gl': 'maptalksgl'
            },
            banner,
            outro,
            extend: true,
            name: 'maptalks',
            file: 'dist/maptalks.vt.mjs',
            format: 'es',
            sourcemap: production ? false : 'inline',
        },
        plugins: [
            json(),
            production ? glslMinify({
                commons: []
            }) : glsl(),
            nodeResolve({
                mainFields: ['module', 'main'],
            }),
            commonjs(),
            removeGlobal()
        ].concat(plugins),
        watch: {
            include: 'build/**/*.js'
        }
    }
];
