import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import rimraf from 'rimraf';
import { debug as Debug } from 'debug';

const debug = Debug('vite-plugin-clear');

export default (options = {}) => {
  let outputPath;
  let config;

  const {
    disable = false,
    paths = [],
    verbose = true,
  } = options;

  const emptyPlugin = {
    name: 'vite-plugin-clear',
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
      outputPath = path.isAbsolute(config.build.outDir) ? config.build.outDir : path.join(config.root, config.build.outDir);
      debug('resolvedConfig:', resolvedConfig);
    },

    async writeBundle() {
      const handles = paths.map(async (p) => {
        if (p) {
          const fullPath = path.join(outputPath, p);
          if (fs.existsSync(fullPath)) {
            rimraf.sync(fullPath);
          }
        }
      });

      Promise.all(handles).then(() => {
        if (verbose) {
          config.logger.info(
            `\n${chalk.cyan('✨ [vite-plugin-clear]:' + '')}` +
            ` - clear file successfully`
          );
        }
      }).catch(error => {
        config.logger.info(
          `\n${chalk.red('✨ [vite-plugin-clear]:' + 'error')}`
        );
      });
    }
  }
}
