import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: './src/init.js',
    format: 'umd',
    dest: './dist/bundle.js',
    moduleName: 'fusion',
    // sourceMap: 'inline',
    external: [
        'fs', 
        'path'
    ],
    plugins: [
        resolve({
            jsnext: true,
            main: true
        }),
        commonjs(),
        babel({
            //exclude: 'node_modules/**'
        })
    ]
};