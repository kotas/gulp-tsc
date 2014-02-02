'use strict';

var Compiler = require('./lib/compiler');
var gutil = require('gulp-util');
var through = require('through2');
var async = require('async');

module.exports = function (options) {
  var compiler = new Compiler(options);

  compiler.on('stdout', function (line) {
    gutil.log(gutil.colors.green('[tsc] >'), line);
  });
  compiler.on('stderr', function (line) {
    gutil.log(gutil.colors.red('[tsc] >'), line);
  });
  compiler.on('error', function (err) {
    gutil.log(gutil.colors.red('[tsc] Error: ' + err.toString()));
    err.stack && console.log(gutil.color.gray(err.stack));
  });

  function eachFile(file, encoding, done) {
    compiler.addSourceFile(file, encoding);
    done();
  }

  function endStream(done) {
    if (compiler.sourceFiles.length === 0) {
      return done();
    }

    var _this = this;
    async.waterfall([
      function (next) {
        compiler.getVersion(next);
      },
      function (version, next) {
        gutil.log('Compiling TypeScript files using tsc version ' + version);
        compiler.compile(next);
      }
    ], function (err) {
      if (err) {
        gutil.log(gutil.colors.red('Failed to compile TypeScript:', err));
        _this.emit('error', new gutil.PluginError('gulp-tsc', 'Failed to compile: ' + (err.message || err)));
      }
      compiler.outputFiles.forEach(function (f) { _this.push(f) });
      compiler.clear();
      done();
    });
  }

  return through.obj(eachFile, endStream);
};
