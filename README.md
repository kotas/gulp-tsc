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

#### options.mapRoot
Type: `String`
Default: `null`

`--mapRoot` option for `tsc` command.

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

Note: Generated `.d.ts` file is also piped into the stream.

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

Note: Generated `.js.map` file is also piped into the stream.


[npm-url]: https://npmjs.org/package/gulp-tsc
[npm-image]: https://badge.fury.io/js/gulp-tsc.png
[travis-url]: https://travis-ci.org/kotas/gulp-tsc
[travis-image]: https://travis-ci.org/kotas/gulp-tsc.png?branch=master
[daviddm-url]: https://david-dm.org/kotas/gulp-tsc
[daviddm-image]: https://david-dm.org/kotas/gulp-tsc.png?theme=shields.io
