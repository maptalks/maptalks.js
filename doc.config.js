const ora = require('ora');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const execa = require('execa');
const rimraf = require('rimraf');
const { watch } = require('rollup');
const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const conf = require('./jsdoc.json');
const sources = require('./build/api-files.js');

const spinner = ora({
  prefixText: `${chalk.green('\n[document build task]')}`
});

const docPath = path.resolve(__dirname, '.', 'docs/api')

function clearDocDir() {
  if (fs.existsSync(docPath)) {
    rimraf.sync(docPath);
  }

  fs.mkdirSync(docPath);
}

const build = () => {
  try {
    const cmd = 'jsdoc';
    const args = ['-c', 'jsdoc.json'].concat(['-P', 'package.json']).concat(sources);
    execa.commandSync([cmd].concat(args).join(' '), {})
    spinner.succeed(`${sources.length} documents generated in ${conf.opts.destination} success.`)
  } catch (e) {
    if (e.stderr) {
      console.log(chalk.red(e.stderr));
    }

    if (e.stdout) {
      console.log(chalk.yellow(`[stdout] ${e.stdout}.`));
    }

    spinner.fail('document generator failed');
  }
};

const buildDocument = async () => {
  const buildEnv = process.env.BUILD_ENV;
  spinner.start(`document generator start. \n`);
  clearDocDir();
  if (buildEnv === 'watch') {
    spinner.succeed(`document generator running. \n`);
    const watcher = watch({
      input: 'src/index.js',
      plugins: [
        json({
          indent: ' '
        }),
        nodeResolve({
          mainFields: ['module', 'main'], // Default: ['module', 'main']
          browser: true,  // Default: false
          extensions: [ '.mjs', '.js', '.json', '.node', 'jsx', 'ts' ],  // Default: [ '.mjs', '.js', '.json', '.node' ]
          preferBuiltins: true,  // Default: true
        }),
        commonjs(),
      ],
      watchOptions: {
        include: 'src/**',
        exclude: 'node_modules/**'
      }
    });
    watcher.on('event', event => {
      const code = event.code;
      if (code === 'START') {
        spinner.start(`document generator restart. \n`);
      } else if (code === 'BUNDLE_START') {
        build();
      } else if (code === 'BUNDLE_END') {

      } else if (code === 'END') {

      } else {

      }
    });
  } else {
    build();
  }
};

buildDocument().catch(err => {
  console.error(err);
  process.exit(1);
});
