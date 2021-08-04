import { debug as Debug } from 'debug';

const debug = Debug('vite-plugin-transform-mtk');
let babel
const loadBabel = () => babel || (babel = require('@babel/core'))

export default (options = {}) => {
  let config;

  const {
    disable = false,
    bubleOptions = {},
    includeFormat = [],
  } = options;

  const emptyPlugin = {
    name: 'vite-plugin-transform-mtk',
  };

  if (disable) {
    return emptyPlugin;
  }

  debug('plugin options:', options);

  return {
    ...emptyPlugin,
    apply: 'build',
    enforce: 'post',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      debug('resolvedConfig:', resolvedConfig);
    },

    renderChunk(raw) {
      // @tip: remove not support code
      const sourceMaps = !!config.build.sourcemap
      const { code, map } = loadBabel().transform(raw, {
        babelrc: false,
        configFile: false,
        compact: false,
        sourceMaps,
        inputSourceMap: sourceMaps,
        presets: [
          [
            () => ({
              plugins: [
                ['./build/vite-plugin/remove-code-plugin', {
                  includeKV: [
                    ["__proto__", 'NullLiteral'],
                    ["[Symbol.toStringTag]", 'Module', true],
                  ]
                }],
              ]
            })
          ],
        ]
      })

      return { code, map }
    },
  }
}
