const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
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
    glsl(),
    nodeResolve({
        // mainFields: ''
        // module : true,
        // jsnext : true,
        // main : true
    }),
    commonjs()
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
            comments: '/^!/'
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

module.exports = [
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
            file: 'build/worker.js',
            banner: `export default `,
            // footer: ``
        },
        watch: {
            include: ['src/layer/terrain/worker/**/*.js', 'src/layer/terrain/util/**/*.js']
        }
    },
    {
        input: 'src/index.js',
        plugins: configPlugins.concat(plugins),
        external : ['maptalks', '@maptalks/reshader.gl', '@maptalks/fusiongl', '@maptalks/regl', 'gl-matrix'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'es',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            'file': 'build/gl.es.js'
        }
    },
    {
        input: production ? 'build/index.js' : 'src/index-dev.js',
        plugins: configPlugins,
        external : ['maptalks'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalksgl',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            banner,
            outro,
            'file': outputFile
        },
        watch: {
            include: ['src/**/*.js', 'src/**/*.glsl',  'src/**/*.vert',  'src/**/*.frag', '../reshader.gl/dist/*.es.js', 'build/worker.js']
        }
    },
    {
        input: 'build/index.js',
        plugins: configPlugins,
        external : ['maptalks', '@maptalks/reshader.gl', '@maptalks/fusiongl', '@maptalks/regl', 'gl-matrix'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'es',
            'globals' : {
                'maptalks' : 'maptalks'
            },
            banner,
            outro,
            'file': pkg.module
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
