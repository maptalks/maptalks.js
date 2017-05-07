var gulp = require("gulp"),
    mocha = require("gulp-mocha"),
    rollup = require("rollup"),
    babel = require("rollup-plugin-babel");

var package = require("./package.json");

//gl
gulp.task("combine.gl", function () {
    rollup.rollup({
        entry: "./src/kiwi.gl/init.js",
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

//mocha测试
gulp.task("test", function () {


});



gulp.start(["combine.gl"]);


// gulp.task("default", function () {


// });