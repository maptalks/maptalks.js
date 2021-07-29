import { defineConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';
import checker from 'vite-plugin-checker';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import istanbul from 'vite-plugin-istanbul';

const buildEnv = process.env.BUILD_ENV;
const env = process.argv[process.argv.length - 1];
const pkg = fs.readJsonSync(path.resolve(__dirname, 'package.json'))
const year = new Date().getFullYear();
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${year} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log && console.log('${pkg.name} v${pkg.version}');`;

console.log(env, buildEnv);

const plugins = [
  checker({
    enableBuild: false,
    eslint: {
      files: ['./src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    },
  }),
];

if (buildEnv === 'test' && env === 'test') {
  plugins.push(istanbul({
    include: 'src/*',
    exclude: [
      'node_modules',
      'test/',
      'src/core/mapbox/',
      'src/util/dom.js',
      'src/renderer/layer/tilelayer/TileLayerGLRenderer.js',
      'src/renderer/layer/ImageGLRenderable.js',
    ],
    extension: ['.js',],
    requireEnv: true,
  }));
}

if (buildEnv === 'production' && env === 'minify') {
  plugins.push(viteCompression({
    verbose: true,
    filter: /\.(js|css)$/i,
    algorithm: 'gzip', // @tip: should switch to brotliCompress
  }))
}

if (env === 'analyze') {
  plugins.push(visualizer({
    filename: './node_modules/.cache/visualizer/stats.html',
    open: true,
    gzipSize: true,
    brotliSize: true,
  }))
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsDir: 'images',
    assetsInlineLimit: 0, // @link https://cn.vitejs.dev/config/#build-assetsinlinelimit
    target: 'es2015',
    minify: env === 'minify' ? 'terser' : false,
    sourcemap: env !== 'minify',
    brotliSize: true, // @link https://cn.vitejs.dev/config/#build-brotlisize
    watch: env === 'watch' ? {} : null,
    // @link https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/css.ts#L483
    cssCodeSplit: false, // @link https://cn.vitejs.dev/config/#build-csscodesplit
    emptyOutDir: false,
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
      plugins: [],
      output: {
        // assetFileNames: '[name].[ext]',
        assetFileNames: 'maptalks.[ext]', // hack for css file
        banner,
        outro,
      },
    },
  },
  // assetsInclude: ['png', 'svg', 'jpe?g', 'webp'],
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
  // server: {
  //   port: 20000,
  // },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
