'use strict';

var minimist = require('minimist'),
  gulp   = require('gulp'),
  header = require('gulp-header'),
  footer = require('gulp-footer'),
  concat = require('gulp-concat'),
  jshint = require('gulp-jshint'),
  gzip   = require('gulp-gzip'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify'),
  cssnano = require('gulp-cssnano');
var Server = require('karma').Server;


var knownOptions = {
  string: ['browsers', 'pattern'],
  boolean: 'coverage',
  alias: {
    'coverage': 'cov'
  },
  default: { browsers: 'PhantomJS', coverage: false }
};

var options = minimist(process.argv.slice(2), knownOptions);

var sources = require('./build/getFiles.js').getFiles(),
    styles = './assets/css/**/*.css';

gulp.task('scripts', function() {
  return gulp.src(sources)
      .pipe(jshint())                 // do special things to the changed files...
      .pipe(concat('layertalks.js'))         // do things that require all files
      .pipe(header('(function () {\n')) // e.g. jshinting ^^^
      .pipe(footer('\n})();'))          // and some kind of module wrapping
      .pipe(gulp.dest('./dist'))
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('./dist'))
      .pipe(gzip())
      .pipe(gulp.dest('./dist'));
});

gulp.task('styles',function() {
   return gulp.src(styles)
        .pipe(concat('layertalks.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('./dist'));
});


gulp.task('build',['scripts','styles'],function() {
  return gulp.src('./assets/images/**/*')
    .pipe(gulp.dest('./dist/images'));
});

gulp.task('watch', ['build'], function () {
  var scriptWatcher = gulp.watch(['src/**/*.js', './gulpfile.js','build/srcList.txt'], ['scripts']); // watch the same files in our scripts task
  var stylesWatcher = gulp.watch(styles, ['styles']);
});

var coveralls = require('gulp-coveralls');
gulp.task('coveralls', function () {
  if (!process.env.CI) return;
  return gulp.src('./coverage/**/lcov.info')
    .pipe(coveralls());
});

var browsers = options.browsers.split(',');
browsers = browsers.map(function(name) {
  var lname = name.toLowerCase();
  if (lname.indexOf('phantom') === 0) {
    return 'PhantomJS';
  }
  if (lname[0] === 'i') {
    return 'IE' + lname.substr(2);
  } else {
    return lname[0].toUpperCase() + lname.substr(1);
  }
});

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
  var karmaConfig = {
    configFile: __dirname + '/karma.conf.js',
    browsers:browsers,
    singleRun: true
  };
  if (options.coverage) {
    karmaConfig.preprocessors = {
      'src/!(maptalks)/**/!(Matrix|Promise).js': ['coverage']
    };
    karmaConfig.coverageReporter = {
      type: 'lcov', // lcov or lcovonly are required for generating lcov.info files
      dir: 'coverage/'
    };
    karmaConfig.reporters = ['coverage'];
  };
  if (options.pattern) {
    karmaConfig.client = {
      mocha: {
        grep: options.pattern
      }
    };
  };
  new Server(karmaConfig, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
  var karmaConfig = {
    configFile: __dirname + '/karma.conf.js',
    browsers: browsers,
    singleRun: false
  };
  if (options.pattern) {
    karmaConfig.client = {
      mocha: {
        grep: options.pattern
      }
    };
  }
  new Server(karmaConfig, done).start();
});

gulp.task('default', ['watch']);
