# gulp-tsc [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> TypeScript compiler for gulp 3

## Usage

First, install `gulp-tsc` as a development dependency:

```shell
npm install --save-dev gulp-tsc
```

Then, add it to your `gulpfile.js`:

```js
var typescript = require('gulp-tsc');

gulp.task('compile', function(){
  gulp.src(['src/**/*.ts'])
    .pipe(typescript())
    .pipe(gulp.dest('dest/'))
});
```

## API

### typescript(options)

#### options.tscPath
Type: `String`
Default: `null`

The path to `tsc` command for compile.

If not set, this plugin searches for `tsc` command in the order as described below:

1. from `typescript` module installed as your project's dependency (i.e. `require("typescript")` on current directory)
2. from PATH of the running shell (using [node-which](https://github.com/isaacs/node-which))
3. from Bundled `typescript` module

(This search list can be modified by [options.tscSearch](#optionstscsearch))

So, if you want to use other version of `tsc` command, you can add any version of `typescript` module to your project's dependecy.

However, this plugin could fail to run the future `tsc` because of incompatible changes of arguments.

#### options.tscSearch
Type: `Array` of `String`
Default: `['cwd', 'shell', 'bundle']`

This options changes how this plugin searches for `tsc` command on your system.

See [options.tscPath](#optionstscpath) for details.

#### options.emitError
Type: `Boolean`
Default: `true`

If set to true, this plugin emits `error` event on compilation failure, which causes gulp to abort running task.

See [Error handling](#error-handling) for details.

#### options.module
Type: `String` (`"commonjs"` or `"amd"`)
Default: `"commonjs"`

`--module` option for `tsc` command.

#### options.target
Type: `String` (`"ES3"` or `"ES5"`)
Default: `"ES3"`

`--target` option for `tsc` command.

#### options.out
Type: `String`
Default: `null`

`--out` option for `tsc` command.

#### options.outDir
Type: `String`
Default: `null`

A path to the directory where output files are finally going to.

This option does not affect the actual output directory for `tsc` command.

See [options.sourcemap](#optionssourcemap) for usage of this option.

#### options.mapRoot
Type: `String`
Default: `null`

`--mapRoot` option for `tsc` command.

#### options.sourceRoot
Type: `String`
Default: `null`

`--sourceRoot` option for `tsc` command.

#### options.allowbool
Type: `Boolean`
Default: `false`

`--allowbool` option for `tsc` command. (version 0.9.1.1)

#### options.allowimportmodule
Type: `Boolean`
Default: `false`

`--allowimportmodule` option for `tsc` command. (version 0.9.1.1)

#### options.declaration
Type: `Boolean`
Default: `false`

`--declaration` option for `tsc` command.

Generated `.d.ts` file is also piped into the stream.

#### options.noImplicitAny
Type: `Boolean`
Default: `false`

`--noImplicitAny` option for `tsc` command.

#### options.noResolve
Type: `Boolean`
Default: `false`

`--noResolve` option for `tsc` command.

#### options.removeComments
Type: `Boolean`
Default: `false`

`--removeComments` option for `tsc` command.

#### options.sourcemap
Type: `Boolean`
Default: `false`

`--sourcemap` option for `tsc` command.

Generated `.js.map` file is also piped into the stream.

**Notice**: If your output files are NOT going to `{working directory}/something/` (to a directory beneath the working directory), you have to tell your output path to gulp-tsc by `outDir` option or `sourceRoot` option.

If you have a gulp task like this:

```
gulp.task('compile', function(){
  gulp.src(['src/**/*.ts'])
    .pipe(typescript({ sourcemap: true }))
    .pipe(gulp.dest('foo/bar/'))
});
```

Output files are going under `{working directory}/foo/bar/`, but sourcemap files will contain a relative path to source files from `{working directory}/foo/` which is not correct.

To fix the relative path, just specify `outDir` with your `gulp.dest` path.

```
gulp.task('compile', function(){
  gulp.src(['src/**/*.ts'])
    .pipe(typescript({ sourcemap: true, outDir: 'foo/bar/' }))
    .pipe(gulp.dest('foo/bar/'))
});
```

This is because of gulp's mechanism which does not allow gulp plugins to know where the output files are going to be stored finally.

gulp-tsc assumes that your output files go into `{working directory}/something/` so that the relative paths in sourcemap files are based on that path by default.

`sourceRoot` option is an absolute path to the source location, so you can also fix this problem by specifying it instead of `outDir`.

#### options.tmpDir
Type: `String`
Default: `''` (current working directory)

A path relative to current working directory, where a temporary build folder will be put in.

**Notice**: If you use this option with sourcemaps, consider to specify `outDir` or `sourceRoot`. See [options.sourcemap](#optionssourcemap) for details.

If you are watching some files in current working directory with gulp.watch(), the creation of temporary build folder will trigger a folder change event.

If this is unexpected, you can put temp folders in a non-watched directory with this option.

Example:
```
gulp.task('tsc', function() {
  return gulp.src(src.ts)
        .pipe(tsc({tmpDir:'.tmp'}))
        .pipe(gulp.dest('.tmp/js'));
});
```

This will put a temporary folder in '.tmp'.

See [Temporary directory and file by gulp-tsc](#temporary-directory-and-file-by-gulp-tsc) for details.

#### options.noLib
Type: `Boolean`
Default: `false`

`--noLib` option for `tsc` command.

Set `noLib` to `true` will dramatically reduce compile time, because 'tsc' will ignore builtin declarations like 'lib.d.ts'.

So if you are not using 'lib.d.ts' or prefer speed, set this to `true`. (In my case `noLib:true` only takes 25% time compared to `noLib:false`)

#### options.keepTree
Type: `Boolean`
Default: `true`

If set to false, gulp-tsc skips creating a temporary file in your source directory which is used for keeping source directory structure in output.

See [Temporary directory and file by gulp-tsc](#temporary-directory-and-file-by-gulp-tsc) for details.

## Error handling

If gulp-tsc fails to compile files, it emits `error` event with `gutil.PluginError` as the manner of gulp plugins.

This causes gulp to stop running on TypeScript compile errors, which is sometimes a problem like using with `gulp.watch()`.

If you want to suppress the error, just pass `{ emitError: false }` to gulp-tsc like below.

```
var typescript = require('gulp-tsc');

gulp.task('default', function () {
    gulp.watch('src/**/*.ts', ['compile'])
});

gulp.task('compile', function () {
    return gulp.src('src/**/*.ts')
        .pipe(typescript({ emitError: false }))
        .pipe(gulp.dest('dest/'));
});
```

## Temporary directory and file by gulp-tsc

Since gulp-tsc uses `tsc` command internally for compiling TypeScript files, compiled JavaScript files require to be written on the file system temporarily.

For those compiled files, gulp-tsc creates a temporary directory named `gulp-tsc-tmp-*` in the current working directory. You can change the location of the temporary directory by [options.tmpDir](#optionstmpdir).

In addition, gulp-tsc also creates a temporary file named `.gulp-tsc-tmp-*.ts` in your source root directory while compiling. The source root is determined by your `gulp.src()`. (e.g. For `gulp.src("src/**/*.ts")`, the source root is `src/`)

This is required for keeping your source directory structure in output since tsc command omits the common part of your output paths.

If you do not need to keep the structure, you can skip creating the temporary file by setting [options.keepTree](#optionskeeptree) to false.


[npm-url]: https://npmjs.org/package/gulp-tsc
[npm-image]: https://badge.fury.io/js/gulp-tsc.png
[travis-url]: https://travis-ci.org/kotas/gulp-tsc
[travis-image]: https://travis-ci.org/kotas/gulp-tsc.png?branch=master
[daviddm-url]: https://david-dm.org/kotas/gulp-tsc
[daviddm-image]: https://david-dm.org/kotas/gulp-tsc.png?theme=shields.io
