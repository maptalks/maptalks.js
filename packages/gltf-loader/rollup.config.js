const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const plugins = [
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs(),
];

module.exports = [
    {
        input: 'src/index.js',
        plugins: plugins,
        output: [
            {
                'sourcemap': true,
                'format': 'umd',
                'name': 'gltf',
                'banner': banner,
                'file': 'dist/gltf-loader.js'
            }
        ]
    },
    {
        input: 'src/index.js',
        plugins: plugins.concat(production ? [
            terser({ output : { comments : '/^!/' }})
        ] : []),
        output: {
            'sourcemap': true,
            'format': 'es',
            'banner': banner,
            'file': pkg.module
        }
    }
];
