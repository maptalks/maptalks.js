const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('rollup-plugin-terser').terser;
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
const outputFile = production ? pkg.main : 'dist/maptalksgl-dev.js';
const plugins = production ? [terser({
    mangle: {
        properties: {
            'regex' : /^_/,
            'keep_quoted' : true
        }
    },
    output : {
        keep_quoted_props: true,
        beautify: true,
        comments : '/^!/'
    }
})] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
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

module.exports = [
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
            banner,
            outro,
            'file': 'build/gl.es.js'
        }
    },
    {
        input: 'build/index.js',
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
            include: ['build/**/*.js', '../reshader.gl/dist/*.js']
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
];
