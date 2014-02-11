var gulp = require('gulp');
var gutil = require('gulp-util');
var sequence = require('run-sequence');
var clean = require('gulp-clean');
var typescript = require('../index');
var expectFile = require('gulp-expect-file');

var expect = function (files) {
  return expectFile({ checkRealFile: true, errorOnFailure: true }, files);
};

var abort  = function (err) { throw err; };
var ignore = function (err) { };

gulp.task('default', ['all']);

gulp.task('clean', function () {
  return gulp.src('build', { read: false })
    .pipe(clean());
});

gulp.task('all', ['clean'], function (cb) {
  var tasks = Object.keys(this.tasks).filter(function (k) { return /^test\d+/.test(k) });
  tasks.sort();
  tasks.push(cb);
  sequence.apply(null, tasks);
});

// Compiling single file
gulp.task('test1', ['clean'], function () {
  return gulp.src('src/foo.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test1'))
    .pipe(expect('build/test1/foo.js'));
});

// Compiling multiple files
gulp.task('test2', ['clean'], function () {
  return gulp.src('src/*.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test2'))
    .pipe(expect([
      'build/test2/foo.js',
      'build/test2/sum.js',
      'build/test2/calc.js'
    ]));
});

// Compiling multiple files keeping directory structure
gulp.task('test3', ['clean'], function () {
  return gulp.src('src/**/*.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test3'))
    .pipe(expect([
      'build/test3/foo.js',
      'build/test3/sum.js',
      'build/test3/calc.js',
      'build/test3/s1/a.js',
      'build/test3/s2/b.js'
    ]));
});

// Compiling multiple files into one file
gulp.task('test4', ['clean'], function () {
  return gulp.src('src/*.ts')
    .pipe(typescript({ out: 'test4.js' })).on('error', abort)
    .pipe(gulp.dest('build/test4'))
    .pipe(expect('build/test4/test4.js'));
});

// Compiling fails and outputs nothing
gulp.task('test5', ['clean'], function () {
  return gulp.src('src-broken/error.ts')
    .pipe(typescript()).on('error', ignore)
    .pipe(gulp.dest('build/test5'))
    .pipe(expect([]));
});

// Compiling warns some errors but outputs a file
gulp.task('test6', ['clean'], function () {
  return gulp.src('src-broken/warning.ts')
    .pipe(typescript()).on('error', ignore)
    .pipe(gulp.dest('build/test6'))
    .pipe(expect('build/test6/warning.js'));
});

// Compiling files including .d.ts file
gulp.task('test7', ['clean'], function () {
  return gulp.src('src-d/*.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test7'))
    .pipe(expect('build/test7/main.js'))
});
