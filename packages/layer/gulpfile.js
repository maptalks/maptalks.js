const rollup = require('rollup');
const gulp = require('gulp');
const connect = require('gulp-connect');
const pkg = require('./package.json');
const Server = require('karma').Server;

const karmaConfig = require('./karma.config');

const rollupWorkerConfig = require('./build/rollup.config.worker');
const rollupConfig = require('./build/rollup.config');

// gulp.task('build:worker', () => {
//     return rollup.rollup(rollupWorkerConfig).then(bundle => Promise.all(
//         [
//             bundle.write(rollupWorkerConfig.output)
//         ]
//     ));
// });

// gulp.task('build', ['build:worker'], () => {
//     return rollup.rollup(rollupConfig).then(bundle => Promise.all(
//         [
//             bundle.write(rollupConfig.output)
//         ]
//     ));

// });

gulp.task('test', ['build'], () => {
    karmaConfig.singleRun = true;
    const server = new Server(karmaConfig);
    server.start();
});

gulp.task('debug', ['build'], () => {
    karmaConfig.singleRun = false;
    const server = new Server(karmaConfig);
    server.start();
});

gulp.task('minify', ['build'], () => {
    bundleHelper.minify();
});

gulp.task('dev', ['build'], () => {
    return gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('connect', ['dev'], () => {
    connect.server({
        root: ['.'],
        livereload: true,
        port: 20001
    });
});

gulp.task('default', ['connect']);
