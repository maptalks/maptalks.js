import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import multidest from 'rollup-plugin-multidest';


export default {
    entry: './src/init.js',
    format: 'umd',
    dest: './dist/bundle.js',
    moduleName: 'Fusion',
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
        multidest([{
            dest: 'debug/karma/lib/bundle.js',
            format: 'umd'
        }]),
        babel({
            //exclude: 'node_modules/**'
        })
    ]
};