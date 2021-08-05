module.exports = (api) => {
  const plugins = [];
  if (api.env(envName => envName.startsWith('test'))) {
    plugins.push([
      'istanbul',
      {
        // TileLayerGLRenderer is not testable on CI
        exclude: [
          'assets/**/*',
          'test/**/*.js',
          'src/core/mapbox/*.js',
          'src/util/dom.js',
          'src/renderer/layer/tilelayer/TileLayerGLRenderer.js',
          'src/renderer/layer/ImageGLRenderable.js',
          'node_modules/**/*',
        ]
      }
    ]);
  }

  return {
    presets: [
      [
        '@babel/env',
        {
          targets: {
            browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'],
          },
          loose: true,
          modules: false,
        },
      ],
    ],
    plugins: plugins,
    env: {},
    ignore: [
      'dist/*.js',
      'node_modules'
    ],
    comments: false,
  };
};
