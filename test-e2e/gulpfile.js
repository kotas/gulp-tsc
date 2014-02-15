var gulp = require('gulp');
var gutil = require('gulp-util');
var sequence = require('run-sequence');
var clean = require('gulp-clean');
var typescript = require('../index');
var expectFile = require('gulp-expect-file');

var expect = function (files) {
  return expectFile({ checkRealFile: true, errorOnFailure: true, verbose: true }, files);
};

var abort  = function (err) { throw err; };
var ignore = function (err) { };

gulp.task('default', ['all']);

gulp.task('clean', function () {
  return gulp.src('{build,src-inplace/**/*.js}', { read: false })
    .pipe(clean());
});

gulp.task('all', ['clean'], function (cb) {
  var tasks = Object.keys(this.tasks).filter(function (k) { return /^test\d+/.test(k) });
  tasks.sort(function (a, b) { return a.match(/\d+/)[0] - b.match(/\d+/)[0] });
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
  return gulp.src(['src-d/*.ts'])
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test7'))
    .pipe(expect([
      'build/test7/main.js',
      'build/test7/sub.js'
    ]))
});

// Compiling files including .d.ts file into one
gulp.task('test8', ['clean'], function () {
  return gulp.src('src-d/*.ts')
    .pipe(typescript({ out: 'unified.js' })).on('error', abort)
    .pipe(gulp.dest('build/test8'))
    .pipe(expect('build/test8/unified.js'))
});

// Compiling .d.ts file only
gulp.task('test9', ['clean'], function () {
  return gulp.src('src-d/hello.d.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test9'))
    .pipe(expect([]))
});

// Compiling cross-project files
gulp.task('test10', ['clean'], function () {
  return gulp.src('src-crossproj/proj-a/main.ts')
    .pipe(typescript()).on('error', abort)
    .pipe(gulp.dest('build/test10'))
    .pipe(expect([
      'build/test10/proj-a/main.js',
      'build/test10/proj-b/util.js',
      'build/test10/proj-b/sub/sub.js',
    ]))
});

// Compiling with sourcemap
gulp.task('test11', ['clean'], function () {
  return gulp.src('src/foo.ts')
    .pipe(typescript({ sourcemap: true }))
    .pipe(gulp.dest('build/test11'))
    .pipe(expect({
      'build/test11/foo.js':     true,
      'build/test11/foo.js.map': '"sources":["../src/foo.ts"]'
    }))
});

// Compiling sourcemap files
gulp.task('test12', ['clean'], function () {
  return gulp.src('src-crossproj/proj-a/main.ts')
    .pipe(typescript({ sourcemap: true, outDir: 'build/test12' }))
    .pipe(gulp.dest('build/test12'))
    .pipe(expect({
      'build/test12/proj-a/main.js':        true,
      'build/test12/proj-a/main.js.map':    '"sources":["../../../src-crossproj/proj-a/main.ts"]',
      'build/test12/proj-b/util.js':        true,
      'build/test12/proj-b/util.js.map':    '"sources":["../../../src-crossproj/proj-b/util.ts"]',
      'build/test12/proj-b/sub/sub.js':     true,
      'build/test12/proj-b/sub/sub.js.map': '"sources":["../../../../src-crossproj/proj-b/sub/sub.ts"]'
    }))
});

// Compiling sourcemap files into one file
gulp.task('test13', ['clean'], function () {
  return gulp.src('src-crossproj/proj-a/main.ts')
    .pipe(typescript({ sourcemap: true, sourceRoot: '/', out: 'unified.js' }))
    .pipe(gulp.dest('build/test13'))
    .pipe(expect({
      'build/test13/unified.js':     true,
      'build/test13/unified.js.map': [
        '"sourceRoot":"/"',
        /"sources":\[("(proj-b\/util\.ts|proj-b\/sub\/sub\.ts|proj-a\/main\.ts)",?){3}\]/
      ]
    }))
});

// Compiling into source directory (in-place)
gulp.task('test14', ['clean'], function () {
  return gulp.src('src-inplace/**/*.ts')
    .pipe(typescript())
    .pipe(gulp.dest('src-inplace'))
    .pipe(expect([
      'src-inplace/top1.js',
      'src-inplace/top2.js',
      'src-inplace/sub/sub1.js',
      'src-inplace/sub/sub2.js',
    ]))
});
