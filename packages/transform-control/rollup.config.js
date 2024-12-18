const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = pkg.main;
const plugins = production ? [
    terser({
        output : { comments : '/^!/' },
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true
            }
        }
    })] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

function glsl() {

    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            let transformedCode = code.replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{1,}/g, '\\n') // # \n+ to \n
                .replace(/\r{1,}/g, '\\n') // # \r+ to \n
                .replace(/"/g, '\\"');
            transformedCode = `export default "${transformedCode}";`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

const basePlugins = [
    glsl(),
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs()
];

module.exports = [
    {
        input: 'src/index.js',
        plugins: basePlugins.concat(plugins),
        external : ['maptalks', '@maptalks/gl', '@maptalks/gltf-layer'],
        output: {
            'sourcemap': true,
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro' : outro,
            'extend' : true,
            'globals' : {
                'maptalks' : 'maptalks',
                '@maptalks/gl' : 'maptalks',
                '@maptalks/gltf-layer' : 'maptalks'
            },
            'file': outputFile
        }
    },
    {
        input: 'src/index.js',
        plugins: basePlugins.concat(production ? [
            terser({
                output : { comments : '/^!/', beautify: true },
                mangle : {
                    properties: {
                        'regex' : /^_/,
                        'keep_quoted' : true
                    }
                }
            })
        ] : []),
        external : ['maptalks', '@maptalks/gl', '@maptalks/gltf-layer'],
        output: {
            'sourcemap': true,
            'format': 'es',
            'banner': banner,
            'outro' : outro,
            'file': pkg.module
        }
    }
];
