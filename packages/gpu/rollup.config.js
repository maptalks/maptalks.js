const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const pkg = require('./package.json');

function wgsl() {
    return {
        transform(code, id) {
            if (/\.wgsl$/.test(id) === false) return null;
            let transformedCode = JSON.stringify(code.trim()
                // .replace(/(^\s*)|(\s*$)/gm, '')
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

const outputFile = pkg.main;

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;
const configPlugins = [
    nodeResolve({}),
    commonjs(),
    wgsl()
];

module.exports = [];

module.exports.push({
    input: 'src/index.js',
    plugins: configPlugins,
    output: {
        'extend': true,
        'sourcemap': false,
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
        include: [
            '../gl/src/reshader/gpu/*.js',
            '../gl/src/**/*.wgsl',
            '../analysis/src/**/*.wgsl',
            '../vt/src/**/*.wgsl',
            '../layer-video/src/**/*.wgsl',
            '../layer-3dtiles/src/**/*.wgsl',
        ]
    }
});

module.exports.push({
    input: 'src/index.js',
    plugins: configPlugins,
    output: {
        'sourcemap': false,
        'format': 'es',
        'globals' : {
            'maptalks' : 'maptalks'
        },
        banner,
        outro,
        'file': pkg.module
    },
    watch: {
        include: [
            '../gl/src/reshader/gpu/*.js',
            '../gl/src/**/*.wgsl',
            '../analysis/src/**/*.wgsl',
            '../vt/src/**/*.wgsl',
            '../layer-video/src/**/*.wgsl',
            '../layer-3dtiles/src/**/*.wgsl',
        ]
    }
});
