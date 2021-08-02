import { debug as Debug } from 'debug';
import execa from 'execa';
import chalk from 'chalk';
import fs from 'fs-extra';
import rimraf from 'rimraf';
import path from 'path';

const debug = Debug('vite-plugin-jsdoc');

function clearDocDir(docPath) {
  if (fs.existsSync(docPath)) {
    rimraf.sync(docPath);
  }

  fs.mkdirSync(docPath);
}

const build = (config, args = [], destinationDir) => {
  return new Promise(((resolve, reject) => {
    try {
      clearDocDir(destinationDir);
      const cmd = 'jsdoc';
      const a = ['-c', config].concat(args);
      execa.commandSync([cmd].concat(a).join(' '), {});
      resolve(true);
      // spinner.succeed(`${sources.length} documents generated in ${conf.opts.destination} success.`)
    } catch (e) {
      reject(e);
      // spinner.fail('document generator failed');
    }
  }))
};

export default (options = {}) => {
  let viteConfig;
  let destinationDir;
  const {
    disable = false,
    verbose = true,
    config = 'jsdoc.json',
    destination = null,
    args = [],
  } = options;

  const emptyPlugin = {
    name: 'vite-plugin-jsdoc',
  };

  if (disable) {
    return emptyPlugin;
  }

  debug('plugin options:', options);

  return {
    ...emptyPlugin,
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
      const jsdocConfig = fs.readJsonSync(path.join(viteConfig.root, config));
      if (!destination) {
        destinationDir = jsdocConfig.opts.destination;
      } else {
        destinationDir = destination;
      }
      destinationDir = path.join(viteConfig.root, destinationDir);
      debug('jsdocConfig:', {
        ...jsdocConfig,
        destinationDir,
      });
    },
    buildStart() {
      build(config, args, destinationDir).then(state => {
        if (state && verbose) {
          viteConfig.logger.info(
            `\n${chalk.cyan('✨ [vite-plugin-jsdoc]:' + '')}` +
            ` - documents generated in ${destinationDir} success.`
          );
        }
      }).catch(error => {
        if (error.stderr) {
          viteConfig.logger.info(
            `\n${chalk.red('✨ [vite-plugin-jsdoc]:' + error.stderr)}`,
          );
        }

        if (error.stdout) {
          viteConfig.logger.info(
            `\n${chalk.yellow('✨ [vite-plugin-jsdoc]:' + error.stdout)}`,
          );
        }
      });
    },
  };
}
