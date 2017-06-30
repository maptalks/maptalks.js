const minimist = require('minimist'),
    path = require('path'),
    gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    connect = require('gulp-connect'),
    rollupCfg = require('./build/rollup.config'),
    BundleHelper = require('maptalks-build-helpers').BundleHelper,
    Server = require('karma').Server;

const rollupWatch = rollupCfg.watch;
const bundler = new BundleHelper(require('./package.json'));

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

var options = minimist(process.argv.slice(2), knownOptions);

const browsers = [];

let configBrowsers = options.browsers || process.env['MAPTALKS_BROWSERS'] || '';
configBrowsers.split(',').forEach(name => {
    if (!name || name.length < 2) {
        return;
    }
    var lname = name.toLowerCase();
    if (lname.indexOf('phantom') === 0) {
        browsers.push('PhantomJS');
    }
    if (lname[0] === 'i' && lname[1] === 'e') {
        browsers.push('IE' + lname.substr(2));
    } else {
        browsers.push(lname[0].toUpperCase() + lname.substr(1));
    }
});

gulp.task('scripts', () => {
    return bundler.bundle('src/index.js', rollupCfg.config);
});

var stylesPattern = './assets/css/**/*.css';

gulp.task('styles', () => {
    return gulp.src(stylesPattern)
        .pipe(concat('maptalks.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('images', () => {
    return gulp.src('./assets/images/**/*')
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('build', ['scripts', 'styles', 'images'], () => {});

gulp.task('minify', ['build'], () => {
    bundler.minify();
});

gulp.task('watch', ['styles', 'images'], () => {
    rollupWatch(() => {
        gulp.src('./dist/*.js')
            .pipe(connect.reload());
    });
    gulp.watch(stylesPattern, ['styles']);
});

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    var karmaConfig = {
        configFile: path.join(__dirname, 'build/karma.test.config.js')
    };
    if (browsers.length > 0) {
        karmaConfig.browsers = browsers;
    }
    if (options.coverage) {
        karmaConfig.configFile = path.join(__dirname, 'build/karma.cover.config.js');
    }
    if (options.pattern) {
        karmaConfig.client = {
            mocha: {
                grep: options.pattern
            }
        };
    }
    new Server(karmaConfig, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    var karmaConfig = {
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
    var started = false;
    rollupWatch(() => {
        if (!started) {
            var karmaServer = new Server(karmaConfig, done);
            karmaServer.start();
            started = true;
        }
    });
});

gulp.task('connect', ['watch'], () => {
    connect.server({
        root: 'dist',
        livereload: true,
        port: 20000
    });
});

gulp.task('reload', ['scripts'], () => {
    gulp.src('./dist/*.js')
        .pipe(connect.reload());
});

gulp.task('doc', () => {
    var sources = require('./docs/files.js');
    del([
        '../../maptalks.org/docs/api/**/*'
    ],{
        force : true
    });
    var conf = require('./jsdoc.json');
    var cmd = 'jsdoc';
    var args = ['-c', 'jsdoc.json'].concat(['API.md']).concat(sources);
    var exec = require('child_process').exec;
    exec([cmd].concat(args).join(' '), (error, stdout, stderr) => {
        if (error) {
            console.error('JSDoc returned with error: ' + stderr ? stderr : '');
            return;
        }
        if (stderr) {
            console.error(stderr);
        }
        if (stdout) { console.log(stdout); }
        console.log('Documented ' + sources.length + ' files in:');
        console.log(conf.opts.destination);
    });
});

gulp.task('editdoc', ['doc'], () => {
    gulp.watch(['src/**/*.js'], ['doc']);
});

gulp.task('default', ['connect']);
