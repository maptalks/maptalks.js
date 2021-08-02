const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const minimist = require('minimist');
const { Server, config } = require('karma');

const spinner = ora({
  prefixText: `${chalk.green('\n[test task]')}`
});

const knownOptions = {
  string: ['browsers', 'pattern'],
  boolean: 'coverage',
  alias: {
    'coverage': 'cov'
  },
  default: {
    browsers: null,
    coverage: false
  }
};

const options = minimist(process.argv.slice(2), knownOptions);

const browsers = [];

const configBrowsers = options.browsers || process.env['MAPTALKS_BROWSERS'] || '';
configBrowsers.split(',').forEach(name => {
  if (!name || name.length < 1) {
    return;
  }
  browsers.push(name);
});

// const getArgs = async () => {
//   const { type } = await inquirer.prompt([{
//     name: 'type',
//     message: `Select karma test type?`,
//     type: 'list',
//     // type: 'checkbox',
//     choices: ['tdd', 'test']
//   }]);
// };

const getKarmaConfig = (file) => config.parseConfig(path.join(__dirname, file));

const TestTask = async () => {
  spinner.start(`karma server start. \n`);

  if (process.env.TEST_ENV === 'tdd') {
    const karmaConfig = getKarmaConfig('build/karma.tdd.config.js');
    if (browsers.length > 0) {
      karmaConfig.browsers = browsers;
    }
    if (options.pattern) {
      karmaConfig.client = {
        mocha: {
          grep: options.pattern
        }
      };
    }
    if (options.pattern) {
      if (!karmaConfig.client) {
        karmaConfig.client = {
          mocha: {
            grep: options.pattern
          }
        };
      } else {
        karmaConfig.client.mocha.grep = options.pattern;
      }
    }

    const karmaServer = new Server(karmaConfig, () => {
      spinner.succeed(`karma server test done. \n`)
    });
    karmaServer.start();
  } else {
    const karmaConfig = getKarmaConfig(options.coverage ? 'build/karma.cover.config.js' : 'build/karma.test.config.js');
    if (browsers.length > 0) {
      karmaConfig.browsers = browsers;
    }
    if (configBrowsers.indexOf('IE') >= 0) {
      let idx = -1;
      for (let i = 0; i < karmaConfig.files.length; i++) {
        if (karmaConfig.files[i].pattern.indexOf('test/core/ClassSpec.js') >= 0) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        karmaConfig.files.splice(idx, 1);
      }
    }
    if (configBrowsers === 'IE9') {
      //override IE9's pattern
      options.pattern = 'IE9.Specs';
    }
    if (options.pattern) {
      if (!karmaConfig.client) {
        karmaConfig.client = {
          mocha: {
            grep: options.pattern
          }
        };
      } else {
        karmaConfig.client.mocha.grep = options.pattern;
      }
    }
    new Server(karmaConfig, () => {
      spinner.succeed(`karma server test done. \n`)
    }).start();
  }
};

TestTask().catch((err) => {
  console.error(err);
  process.exit(1);
})
