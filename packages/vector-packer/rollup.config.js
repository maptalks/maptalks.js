const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
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
        glsl(),
        resolve({
            module : true,
            jsnext : true,
            main : true
        }),
        commonjs()
    ],
    output: [
        {
            'sourcemap': 'inline',
            'format': 'umd',
            'name': 'packer',
            'banner': banner,
            'file': pkg.main
        }
    ]
};
