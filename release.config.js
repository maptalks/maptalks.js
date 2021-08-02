const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const archiver = require('archiver');
const rimraf = require('rimraf');

const pkg = fs.readJsonSync(path.resolve(__dirname, 'package.json'));

const files = ['LICENSE', 'ACKNOWLEDGEMENT', 'docs/api'];

const copyFiles = async () => {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arr = file.split('/');
      const hasSubDir = arr.length > 1;
      if (hasSubDir) {
        await fs.copy(file, `dist/${arr[arr.length - 1]}`);
      } else {
        await fs.copy(file, `dist/${file}`);
      }
    }
    console.log(chalk.green(`[copyFiles] success.`));
  } catch (e) {
    console.log(chalk.red(`[copyFiles] error.`));
  }
};

const removeFiles = async () => {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arr = file.split('/');
      const hasSubDir = arr.length > 1;
      if (hasSubDir) {
        await fs.remove(`dist/${arr[arr.length - 1]}`);
      } else {
        await fs.remove(`dist/${file}`);
      }
    }
    console.log(chalk.green(`[removeFiles] success.`));
  } catch (e) {
    console.log(chalk.red(`[removeFiles] error.`));
  }
};

const zip = () => {
  const spinner = ora('archive dist ...').start();
  return new Promise(((resolve, reject) => {
    const name = `maptalks-${pkg.version}.zip`;
    const fullPath = path.resolve(__dirname, `dist/${name}`);
    if (fs.existsSync(fullPath)) {
      rimraf.sync(fullPath);
    }

    const output = fs.createWriteStream(__dirname + '/' + name);
    const archive = archiver('zip');

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);

    // 注意此处会循环添加output文件，所以先创建临时目录，再进行压缩
    archive.directory('dist/', false);

    archive.finalize().then(() => {
      resolve(name);
    }).catch(err => {
      reject(err);
    }).finally(() => {
      spinner.stop();
    });
  }))
};

const archiverProcess = async () => {
  await copyFiles();
  try {
    const name = await zip();
    fs.moveSync(path.resolve(__dirname, name), path.resolve(__dirname, `dist/${name}`));
    console.log(chalk.green(`[zip] success.`));
  } catch (e) {
    console.log(chalk.red(`\n [zip] error.`));
  }
  await removeFiles();
};

archiverProcess().catch(err => {
  console.error(err);
  process.exit(1);
});
