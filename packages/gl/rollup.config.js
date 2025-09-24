const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const glslMinify = require('@maptalks/rollup-plugin-glsl-minify');
const { dts } = require("rollup-plugin-dts");
const pkg = require('./package.json');

function glsl() {
    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            let transformedCode = JSON.stringify(code.trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n')); // # \n+ to \n;;
            transformedCode = `export default ${transformedCode};`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

function wgsl() {
    return {
        transform(code, id) {
            if (/\.wgsl$/.test(id) === false) return null;
            return {
                code: `export default '';`,
                map: { mappings: '' }
            };
        }
    };
}

const production = process.env.BUILD === 'production';
const outputFile = pkg.main;
const plugins = production ? [terser({
    mangle: {
        properties: {
            'regex' : /^_/,
            'keep_quoted' : true,
            'reserved': ['on', 'once', 'off', '_getTilesInCurrentFrame', '_drawTiles', '_getTileZoom', '_onGeometryEvent']
        }
    },
    output : {
        keep_quoted_props: true,
        beautify: true,
        comments : '/^!/'
    }
})] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;
const configPlugins = [
    production ? glslMinify({
        commons: [
            './src/reshader/shaderlib/glsl'
        ]
    }) : glsl(),
    wgsl(),
    nodeResolve({
        // mainFields: ''
        // module : true,
        // jsnext : true,
        // main : true
    }),
    commonjs()
];

const tsPlugins = [
    ...configPlugins,
    typescript()
];

const pluginsWorker = production ? [
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
            beautify: false,
            // comments: '/^!/'
        }
    })] : [];

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

const globalFunc = `
var getGlobal = function () {
  if (typeof globalThis !== 'undefined') { return globalThis; }
  if (typeof self !== "undefined") { return self; }
  if (typeof window !== "undefined") { return window; }
  if (typeof global !== "undefined") { return global; }
};`

const externalPackages = ['maptalks', '@maptalks/fusiongl', '@maptalks/regl', 'gl-matrix', '@maptalks/gltf-loader', '@maptalks/tbn-packer'];


module.exports = [
    {
        input: "build/gltf-loader-index.js",
        plugins: [
            nodeResolve(),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                "(function (exports) {": "export function gltfLoaderExport(exports) {"+ globalFunc + ";if (getGlobal()['maptalks_gltf_loader']) return;\n",
                "})(this.exports = this.exports || {});": "getGlobal()['maptalks_gltf_loader'] = exports;}\ngltfLoaderExport({});",
                preventAssignment: false,
                delimiters: ["", ""],
            }),
        ]
            .concat(pluginsWorker),
            // .concat([transformBackQuote()]),
        output: {
            strict: false,
            format: "iife",
            name: "exports",
            globals: ["exports"],
            extend: true,
            file: "build/dist/gltf-loader-bundle.js"
            // footer: ``
        },
        watch: {
            include: ['../gltf-loader/dist/*.js']
        }
    },
    {
        input: 'src/layer/terrain/worker/index.js',
        external: ['maptalks'],
        plugins: [
            nodeResolve({
                mainFields: ['module', 'main'],
            }),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                '(function (exports) {': 'function (exports) {',
                '})(this.exports = this.exports || {});': '}',
                'Object.defineProperty(exports, \'__esModule\', { value: true });': '',
                preventAssignment: false,
                delimiters: ['', '']
            }),
        ].concat(pluginsWorker).concat([transformBackQuote()]),
        output: {
            strict: false,
            format: 'iife',
            name: 'exports',
            globals: ['exports'],
            extend: true,
            file: 'build/dist/worker.js',
            banner: `export default `,
            // footer: ``
        },
        watch: {
            include: ['src/layer/terrain/worker/*.js', 'src/layer/terrain/util/*.js']
        }
    },
        {
        input: 'src/light/LightWorker.js',
        external: ['maptalks'],
        plugins: [
            nodeResolve({
                mainFields: ['module', 'main'],
            }),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                '(function (exports) {': 'function (exports) {',
                '})(this.exports = this.exports || {});': '}',
                'Object.defineProperty(exports, \'__esModule\', { value: true });': '',
                preventAssignment: false,
                delimiters: ['', '']
            }),
        ].concat(pluginsWorker).concat([transformBackQuote()]),
        output: {
            strict: false,
            format: 'iife',
            name: 'exports',
            globals: ['exports'],
            extend: true,
            file: 'build/dist/LightWorker.js',
            banner: `export default `,
            // footer: ``
        },
        watch: {
            include: ['src/light/LightWorker.js']
        }
    },
    {
        input: 'src/transcoders.js',
        plugins: plugins,
        output: {
            'sourcemap': false,
            'format': 'es',
            banner,
            'file': 'dist/transcoders.js'
        }
    }
];

if (production) {
    module.exports.push({
        input: 'src/index.ts',
        plugins: tsPlugins.concat(plugins),
        external : externalPackages,
        output: {
            'sourcemap': true,
            'format': 'es',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            'file': 'build/dist/gl/gl.es.js'
        }
    });
}

module.exports.push({
    input: production ? 'build/index.js' : 'src/index-dev.js',
    plugins: production ? configPlugins : tsPlugins,
    external : ['maptalks'],
    output: {
        'extend': true,
        'sourcemap': true,
        'format': 'umd',
        'name': 'maptalks',
        'globals' : {
            'maptalks' : 'maptalks'
        },
        banner,
        outro,
        'file': outputFile
    },
    watch: {
        include: ['src/**/*.js', 'src/**/*.ts', 'src/**/*.glsl',  'src/**/*.wgsl', 'src/**/*.vert',  'src/**/*.frag',
            'build/dist/**/*.js']
    }
});

if (production) {
    module.exports.push({
        input: 'src/index-dev.js',
        plugins: tsPlugins,
        external : externalPackages,
        output: {
            'sourcemap': true,
            'format': 'es',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            banner,
            outro,
            'file': pkg.module
        }
    });
}

module.exports.push({
    input: 'build/index.d.ts',
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
});
