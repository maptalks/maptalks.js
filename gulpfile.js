const gulp = require("gulp"),
    rollup = require("rollup"),
    babel = require("rollup-plugin-babel"),
    //glup-karma reference https://github.com/karma-runner/gulp-karma
    Server = require('karma').Server,
    package = require("./package.json");

//combine
gulp.task("kiwl.gl.combine", function () {
    rollup.rollup({
        entry: "./src/matrix/init.js",
        plugins: [babel()]
    }).then(function (bundle) {
        bundle.write({
            format: "iife", //umd
            moduleName: "kiwi",
            dest: "./dist/kiwi.gl.js",
            // sourceMap: "inline"
        })
    });
});

//mocha-matrix测试
gulp.task("test", function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }, done).start();
});

gulp.task('tdd', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }, done).start();
});

gulp.task("default", ["tdd","kiwl.gl.combine"]);
//gulp.task("default",["kiwl.gl.combine"]);
//gulp.start(["tdd"]);
//gulp.start(["kiwi.test"]);

// gulp.task("default", function () {


// });