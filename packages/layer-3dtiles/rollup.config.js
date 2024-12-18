const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const replace = require('@rollup/plugin-replace');
const pkg = require('./package.json');
const typescript = require('@rollup/plugin-typescript');
const { dts } = require("rollup-plugin-dts");

const production = process.env.BUILD === 'production';
const outputFile = pkg.main;
const outputESFile = pkg.module;
const plugins = [].concat(production ? [
    removeGlobal(),
    terser({
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true,
                'reserved': ['on', 'once', 'off']
            }
        },
        output : {
            keep_quoted_props: true,
            beautify: false,
            comments : '/^!/'
        }
    })
] : []);

//worker.js中的global可能被webpack替换为全局变量，造成worker代码执行失败，所以这里统一把typeof global替换为typeof undefined
function removeGlobal() {
    return {
        transform(code, id) {
            if (id.indexOf('worker.js') === -1) return null;
            const commonjsCode = /typeof global/g;
            const transformedCode = code.replace(commonjsCode, 'typeof undefined');
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

function transformBackQuote() {
    return {
        renderChunk(code) {
            // if (/\.js/.test(id) === false) return null;
            // var transformedCode = 'const code = `' + code.replace(/`/g, '\\`') + '`';
            code = code.substring('export default '.length)
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$\{/g, '${e}');
            let transformedCode = 'const e = "${"; const code = `' + code + '`;\n';
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
            let transformedCode = code
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

// 概述:
// 因为图层和worker是在不同的进程中执行的，图层程序和worker程序的逻辑需要分别编译。
// worker程序的编译结果会用 maptalks.registerWorkerAdapter 方法注册到maptalks核心库统一管理的worker pool中。

// registerWorkerAdapter 包含两个参数，第一个是workerKey（与worker通信时标识要调用的逻辑），第二个是worker源代码

// 本配置文件中：
// worker程序的编译入口是 src/worker/index.js
// 图层程序的编译入口是 src/layer/index.js

// 原理：
// 利用rollup把程序编译为amd格式，然后重载amd的全局define函数来实现worker程序的注入。
// 下面的配置文件中，前两个配置是用来把图层程序和worker程序打包成amd格式
// 第三个配置用来编译成最终使用的umd格式模块：
// 关键是intro配置中的代码，重载了amd模块的全局define函数，会被图层程序和worker程序打包的amd模块自动调用。
// 第一次是worker程序调用，在其中即实现了transcoder（crn，ktx2和draco解析）的注入和 registerWorkerAdapter 逻辑


module.exports = [
    {
        input: 'src/worker/index.js',
        external: ['maptalks'],
        plugins: [
            resolve({}),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                '(function (exports) {': 'function (exports) {',
                '})(this.exports = this.exports || {});': '}',

                // 为了引入loaders.gl做的修改
                '(function (exports, Module, path) {': 'function (exports) { const Module = {}; const path = {};',
                '})(this.exports = this.exports || {}, Module, path);': '}',
                preventAssignment: false,
                delimiters: ['', '']
            })
        ].concat(plugins).concat([transformBackQuote()]),
        output: {
            strict: false,
            format: 'iife',
            name: 'exports',
            globals: ['exports'],
            extend: true,
            file: 'build/worker.js',
            banner: `export default `,
            footer: ``
        },
        watch: {
            include: ['src/worker/**/*', 'src/loaders/**/*', 'src/common/**/*', '../gltf-loader/dist/gltf-loader.es.js']
        }
    },

    {
        input: 'build/index.js',
        plugins: [
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            commonjs({
                // global keyword handling causes Webpack compatibility issues, so we disabled it:
                // https://github.com/mapbox/mapbox-gl-js/pull/6956
                ignoreGlobal: true
            }),
            glsl(),
            typescript({ tsconfig: './tsconfig.json', sourceMap: true } )
        ].concat(plugins),
        external: ['maptalks', '@maptalks/gl'],
        output: {
            globals: {
                'maptalks': 'maptalks',
                '@maptalks/gl': 'maptalks'
            },
            banner,
            outro,
            extend: true,
            name: 'maptalks',
            file: outputFile,
            format: 'umd',
            sourcemap: true
        },
        watch: {
            include: ['src/layer/**/*', 'build/worker.js']
        }
    }
];


if (production) {
    module.exports.push(
        {
            input: 'build/index.js',
            external: [
                'maptalks',
                '@maptalks/gl',
                'gl-matrix',
                'frustum-intersects',
                '@maptalks/gltf-loader'
            ],
            plugins: [
                resolve({
                    browser: true,
                    preferBuiltins: false
                }),
                commonjs({
                    // global keyword handling causes Webpack compatibility issues, so we disabled it:
                    // https://github.com/mapbox/mapbox-gl-js/pull/6956
                    ignoreGlobal: true
                }),
                glsl(),
                typescript({ tsconfig: './tsconfig.json'} )
            ].concat(plugins),
            output: {
                globals: {
                    'maptalks': 'maptalks',
                    '@maptalks/gl': 'maptalks'
                },
                banner,
                outro,
                extend: true,
                name: 'maptalks',
                file: outputESFile,
                format: 'es',
                sourcemap: true
            },
            watch: {
                include: ['src/**/*']
            }
        },
        {
            input: 'dist/layer/index.d.ts',
            plugins: [dts()],
            output: [
                {
                    'sourcemap': false,
                    'format': 'es',
                    'name': 'maptalks',
                    banner,
                    'file': pkg['types']
                }
            ]
        }
    )
}
