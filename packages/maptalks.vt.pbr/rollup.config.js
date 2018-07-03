const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
// const glslify = require('rollup-plugin-glslify');
const pkg = require('./package.json');

function glsl() {
    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            var transformedCode = code.replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n'); // # \n+ to \n
            return {
                code: `export default \`${transformedCode}\`;`,
                map: { mappings: '' }
            };
        }
    };
}

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

module.exports = {
    input: 'src/index.js',
    plugins: [
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs(),
        glsl(),
        // glslify({
        //     include : ['../reshader.gl/**/*.vert', '../reshader.gl/**/*.frag', '../reshader.gl/**/*.glsl']
        // }),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    external : ['maptalks.vt'],
    output: [
        {
            'sourcemap': false,
            'format': 'umd',
            'name': pkg.name,
            'banner': banner,
            'globals' : {
                'maptalks.vt' : 'maptalks'
            },
            'file': 'dist/' + pkg.name + '.js'
        },
        {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'file': 'dist/' + pkg.name + '.es.js'
        }
    ]
};
