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

1. from `(current directory)/node_module/typescript/bin/tsc` (i.e. `typescript` module installed as your project's dependency)
2. from PATH of the running shell (using [node-which](https://github.com/isaacs/node-which))
3. from Bundled `typescript` module

(This search list can be modified by `options.tscSearch`)

So, if you want to use other version of `tsc` command, you can add any version of `typescript` module to your project's dependecy.

However, this plugin could fail to run the future `tsc` because of incompatible changes of arguments.

#### options.tscSearch
Type: `Array` of `String`
Default: `['cwd', 'shell', 'bundle']`

This options changes how this plugin searches for `tsc` command on your system.

See `options.tscPath` for details.

#### options.module
Type: `String` (`"commonjs"` or `"amd"`)
Default: `"commonjs"`

`--module` option for `tsc` command.

#### options.target
Type: `String` (`"ES3"` or `"ES5"`)
Default: `"ES5"`

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

See `options.sourcemap` for usage of this option.

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


[npm-url]: https://npmjs.org/package/gulp-tsc
[npm-image]: https://badge.fury.io/js/gulp-tsc.png
[travis-url]: https://travis-ci.org/kotas/gulp-tsc
[travis-image]: https://travis-ci.org/kotas/gulp-tsc.png?branch=master
[daviddm-url]: https://david-dm.org/kotas/gulp-tsc
[daviddm-image]: https://david-dm.org/kotas/gulp-tsc.png?theme=shields.io
