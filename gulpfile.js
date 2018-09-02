const minimist = require('minimist'),
    fs = require('fs'),
    path = require('path'),
    gulp = require('gulp'),
    del = require('del'),
    zip = require('gulp-zip'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    connect = require('gulp-connect'),
    uglify = require('uglify-js').minify,
    zlib = require('zlib'),
    Server = require('karma').Server,
    package = require('./package.json');

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


const stylesPattern = './assets/css/**/*.css';

gulp.task('styles', ['images'], () => {
    return gulp.src(stylesPattern)
        .pipe(concat('maptalks.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('images', () => {
    return gulp.src('./assets/images/**/*')
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('transform-proto', () => {
    //a silly work round as transform proto-to-assign is not working in babel 7
    const filename = __dirname + '/dist/maptalks.js';
    const code = fs.readFileSync(filename).toString('utf-8');
    const transformed = code.replace('subClass.__proto__ = superClass;',
        "if (typeof document !== 'undefined' && document.documentMode < 11) { _defaults(subClass, superClass); } else { subClass.__proto__ = superClass;}"
    );
    // fs.writeFileSync(__dirname + '/dist/compiled.js', transformed);
    fs.writeFileSync(filename, transformed);
});

gulp.task('minify', () => {
    const name = package.name;
    const dest = package.main;
    const code = fs.readFileSync(dest).toString('utf-8');
    const u = uglify(code, {
        'output': {
            'ascii_only': true,
            'comments' : /^!/
        }
    });
    const minified = u.code;
    fs.writeFileSync('dist/' + name + '.min.js', minified);
    const gzipped = zlib.gzipSync(minified);
    fs.writeFileSync('dist/' + name + '.min.js.gz', gzipped);
});

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    // const karmaConfig = {
    //     configFile: path.join(__dirname, 'build/karma.test.config.js')
    // };
    let file = 'build/karma.test.config.js';
    if (options.coverage) {
        file = 'build/karma.cover.config.js';
    }
    const cfg = require('karma').config;
    const karmaConfig = cfg.parseConfig(path.join(__dirname, file));
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
    new Server(karmaConfig, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    const karmaConfig = {
        configFile: path.join(__dirname, 'build/karma.tdd.config.js')
    };
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

    const karmaServer = new Server(karmaConfig, done);
    karmaServer.start();
    started = true;
});

gulp.task('connect', () => {
    connect.server({
        root: ['dist', 'debug'],
        livereload: true,
        port: 20000
    });
});

gulp.task('reload', ['scripts'], () => {
    gulp.src('./dist/*.js')
        .pipe(connect.reload());
});

gulp.task('doc', (done) => {
    const sources = require('./build/api-files.js');
    del([
        './docs/api/**/*'
    ], {
        force : true
    });
    const conf = require('./jsdoc.json');
    const cmd = 'jsdoc';
    const args = ['-c', 'jsdoc.json'].concat(['-P', 'package.json']).concat(sources);
    const exec = require('child_process').exec;
    exec([cmd].concat(args).join(' '), (error, stdout, stderr) => {
        if (error) {
            console.error('JSDoc returned with error: ' + stderr ? stderr : '');
            done(error);
            return;
        }
        if (stderr) {
            console.error(stderr);
        }
        if (stdout) { console.log(stdout); }
        console.log('Documented ' + sources.length + ' files in:');
        console.log(conf.opts.destination);
        done(stderr);
    });
});

gulp.task('editdoc', ['doc'], () => {
    gulp.watch(['src/**/*.js'], ['doc']);
});

gulp.task('beforeZip', () => {
    return gulp.src(['LICENSE', 'ACKNOWLEDGEMENT', 'docs/**/*'])
    .pipe(gulp.dest('dist'))
});

gulp.task('zip', ['beforeZip'], done => {
    gulp.src(['dist/*.js', 'dist/*.mjs', 'dist/images/**/*', 'dist/maptalks.css', 'dist/LICENSE', 'dist/ACKNOWLEDGEMENT', 'dist/api/**/*'], { base: 'dist/' })
        .pipe(zip('maptalks-' + package.version + '.zip'))
        .pipe(gulp.dest('dist'));
    setTimeout(function () {
        del([
            'dist/api/**/*', 'dist/LICENSE', 'dist/ACKNOWLEDGEMENT'
        ], {
            force : true
        });
        done();
    }, 2000);
});

gulp.task('default', ['connect']);

