const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const archiver = require('archiver');

const pkg = fs.readJsonSync(path.resolve(__dirname, 'package.json'));

const files = ['LICENSE', 'ACKNOWLEDGEMENT', 'docs'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const copyFiles = async () => {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await fs.copy(file, `dist/${file}`);
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
      await fs.remove(`dist/${file}`);
    }
    console.log(chalk.green(`[removeFiles] success.`));
  } catch (e) {
    console.log(chalk.red(`[removeFiles] error.`));
  }
};

const zip = () => {
  return new Promise(((resolve, reject) => {
    const name = `maptalks-${pkg.version}.zip`;
    const output = fs.createWriteStream(__dirname + '/' + name);
    const archive = archiver('zip');

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);

    // 注意此处会循环添加output文件，所以先创建临时目录，再进行压缩
    archive.directory('dist/', false);

    archive.finalize();
    resolve(name);
  }))
};

const archiverProcess = async () => {
  await copyFiles();
  try {
    const name = await zip();
    await fs.moveSync(path.resolve(__dirname, name), path.resolve(__dirname, `dist/${name}`))
    console.log(chalk.green(`[zip] success.`));
  } catch (e) {
    console.log(chalk.red(`[zip] error.`));
  }
  await removeFiles();
};

archiverProcess().catch(err => {
  console.error(err);
  process.exit(1);
});
