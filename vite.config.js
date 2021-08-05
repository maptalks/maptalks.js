import { defineConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';
import checker from 'vite-plugin-checker';
import babel from '@rollup/plugin-babel';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import clear from './build/vite-plugin/clear-plugin';
import jsdoc from './build/vite-plugin/jsdoc-plugin';
import transform from './build/vite-plugin/transform-plugin';
import sources from './build/api-files.js';

const nodeEnv = process.env.NODE_ENV;
const docWatch = process.env.DOC_ENV_WATCH === 'true';
const env = process.argv[process.argv.length - 1];
const pkg = fs.readJsonSync(path.resolve(__dirname, 'package.json'));
const year = new Date().getFullYear();
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${year} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log && console.log('${pkg.name} v${pkg.version}');`;

const plugins = [
  checker({
    enableBuild: false,
    eslint: {
      files: ['./src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
    },
  }),
];

const rollupPlugins = [];

if (nodeEnv === 'production' || nodeEnv === 'test') {
  // use babel plugin remove [__proto__, Symbol.toStringTag]
  plugins.push(transform({
  }));
  plugins.push(babel({
    babelHelpers: 'bundled',
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
  }));
  plugins.push(clear({
    paths: ['css'],
  }));
}

if (nodeEnv === 'production' && env === 'minify') {
  plugins.push(viteCompression({
    verbose: true,
    filter: /\.(js|css)$/i,
    algorithm: 'gzip', // @tip: should switch to brotliCompress
  }));
}

if (env === 'analyze') {
  rollupPlugins.push(visualizer({
    filename: './node_modules/.cache/visualizer/stats.html',
    open: true,
    gzipSize: true,
    brotliSize: true,
  }))
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  if (env !== 'doc') {
    return {
      base: './',
      publicDir: 'assets',
      // @tip: esbuild 的禁用 target 必须为 false ???
      esbuild: env === 'watch' || docWatch,
      build: {
        outDir: 'dist',
        assetsDir: 'images',
        assetsInlineLimit: 0, // @link https://cn.vitejs.dev/config/#build-assetsinlinelimit
        target: env === 'doc' ? 'modules' : false,
        minify: env === 'minify' ? 'terser' : false,
        sourcemap: env !== 'minify',
        brotliSize: true, // @link https://cn.vitejs.dev/config/#build-brotlisize
        watch: env === 'watch' || docWatch ? {} : null,
        // @link https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/css.ts#L483
        cssCodeSplit: false, // @link https://cn.vitejs.dev/config/#build-csscodesplit
        emptyOutDir: false,
        write: env !== 'doc',
        lib: {
          entry: path.resolve(__dirname, 'src/index.js'),
          name: 'maptalks',
          fileName: (format) => {
            if (env === 'minify') {
              return format === 'es' ? `maptalks.${format}.min.js` : `maptalks.min.js`;
            }
            return format === 'es' ? `maptalks.${format}.js` : `maptalks.js`;
          },
        },
        rollupOptions: {
          plugins: rollupPlugins,
          output: {
            assetFileNames: 'maptalks.[ext]', // hack for css file
            banner,
            outro,
          },
        },
      },
      plugins,
      css: {
        preprocessorOptions: {
          less: {
            globalVars: {},
            // 支持内联 JavaScript
            javascriptEnabled: true,
            // 重写 less 变量，定制样式
            // modifyVars: themeVariables,
            sourceMap: false,
          },
        },
        modules: {
          localsConvention: 'camelCase',
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
    };
  }
  return {
    base: './',
    build: {
      outDir: 'docs',
      write: false,
      emptyOutDir: false,
      watch: docWatch ? {} : null,
      lib: {
        // switch to [chokidar](https://github.com/paulmillr/chokidar)
        // tip: Here, it is best to use chokidar directly.
        //  It is also the watch core of rollup, but rollup has been optimized internally,
        //  so we have to use rollup temporarily
        entry: path.resolve(__dirname, 'src/index'),
        name: 'doc',
        fileName: (format) => 'temp.js',
      },
    },
    plugins: [
      jsdoc({
        config: 'jsdoc.json',
        args: ['-P', 'package.json'].concat(sources),
      }),
      // fixme: write false not support in watch mode
      clear({
        paths: ['style.css', 'temp.js'],
      }),
    ]
  };
});
