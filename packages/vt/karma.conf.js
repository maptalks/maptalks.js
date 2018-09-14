const pkg = require('./package.json');

module.exports = {
    basePath : '.',
    frameworks: ['mocha', 'expect'],
    files: [
        './node_modules/maptalks/dist/maptalks.js',
        './dist/' + pkg.name + '.js',
        './test/**/*.js',
        {
            pattern : './dist/' + pkg.name + '.worker.js',
            watched : false,
            included : false
        }

    ],
    browsers: ['Chrome'],
    reporters: ['mocha'],
    singleRun : true
};
