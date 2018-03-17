import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: './src/init.js',
    output:{
        name:'fusion',
        exports: 'named',
        format:'iife',
        file:'./dist/bundle.js'
    },
    external: [
        'fs',
        'steam',
        'path',
        'through'
    ],
    plugins: [
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
};