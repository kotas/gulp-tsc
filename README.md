```
Under development
```

# gulp-tsc [![Build Status][travis-image]][travis-url]
> TypeScript compiler for gulp 3

## Usage

First, install `gulp-tsc` as a development dependency:

```shell
npm install --save-dev kotas/gulp-tsc
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

Not documented yet.

```
this.options = xtend({
  tscPath:           null,
  tscSearch:         null,
  module:            'commonjs',
  target:            'ES3',
  out:               null,
  mapRoot:           null,
  allowbool:         false,
  allowimportmodule: false,
  declaration:       false,
  noImplicitAny:     false,
  noResolve:         false,
  removeComments:    false,
  sourcemap:         false
}, options);
```

[npm-url]: https://npmjs.org/package/gulp-tsc
[npm-image]: https://badge.fury.io/js/gulp-tsc.png
[travis-url]: https://travis-ci.org/kotas/gulp-tsc
[travis-image]: https://travis-ci.org/kotas/gulp-tsc.png?branch=master
[daviddm-url]: https://david-dm.org/kotas/gulp-tsc
[daviddm-image]: https://david-dm.org/kotas/gulp-tsc.png?theme=shields.io
