import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
    entry: './src/init.js',
    format: 'iife',
    dest: './dist/bundle.js',
    moduleName: 'test',
    sourceMap: true,
    plugins: [
        resolve(),
        babel({
            //exclude: 'node_modules/**'
        })]
};