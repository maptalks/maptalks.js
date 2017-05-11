const gulp = require("gulp"),
    mocha = require("gulp-mocha"),
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
            format: "umd",
            moduleName: "kiwigl",
            dest: "./dist/kiwigl.js",
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

gulp.task("default", ["tdd"]);
//gulp.task("default",["kiwl.gl.combine"]);
//gulp.start(["combine.gl"]);
//gulp.start(["kiwi.test"]);

// gulp.task("default", function () {


// });