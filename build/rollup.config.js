const rollup = require('rollup'),
    commonjs = require('rollup-plugin-commonjs'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    localResolve = require('rollup-plugin-local-resolve'),
    babel = require('maptalks-rollup-plugin-babel');
const pkg = require('../package.json');



const config = {
    plugins: [
        localResolve(),
        nodeResolve({
            jsnext: true,
            main: true,
            browser: true
        }),
        commonjs(),
        babel({
            plugins : ['transform-proto-to-assign']
        })
    ],
    'sourcemap': false
};

module.exports = {
    watch(cb) {

        const year = new Date().getFullYear();
        const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${year} maptalks.org\n */`;
        config.input = 'src/index.js';
        config.banner = banner;
        config.outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;
        config.output = [
            {
                file: 'dist/maptalks.js',
                format: 'umd',
                name: 'maptalks',
                extend : true
            }
        ];
        const watcher = rollup.watch(config);
        let startTime = 0;
        watcher.on('event', e => {
            if (e.code === 'START') {
                console.log('[' + new Date().toLocaleTimeString() + '] [ROLLUP] Starting to build');
                startTime = +new Date();
            } else if (e.code === 'END') {
                console.log('[' + new Date().toLocaleTimeString() + '] [ROLLUP] Complete building in ' + (+new Date() - startTime) / 1000 + 's.');
                if (cb) {
                    cb();
                }
            } else if (e.code === 'ERROR') {
                console.error(e);
            }
        });
    },

    config : config
};
