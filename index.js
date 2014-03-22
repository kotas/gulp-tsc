'use strict';

var Compiler = require('./lib/compiler');
var gutil = require('gulp-util');
var through = require('through2');
var async = require('async');

module.exports = function (options) {
  var sourceFiles = [];
  var emitError   = (!options || options.emitError !== false);

  function eachFile(file, encoding, done) {
    sourceFiles.push(file);
    done();
  }

  function endStream(done) {
    if (sourceFiles.length === 0) {
      return done();
    }

    var _this = this;
    var compiler = new Compiler(sourceFiles, options);
    compiler.on('stdout', function (line) {
      gutil.log(gutil.colors.green('[tsc] >'), line);
    });
    compiler.on('stderr', function (line) {
      gutil.log(gutil.colors.red('[tsc] >'), line);
    });
    compiler.on('error', function (err) {
      gutil.log(gutil.colors.red('[tsc] Error: ' + err.toString()));
      err.stack && console.log(gutil.colors.gray(err.stack));
    });
    compiler.on('data', function (file) {
      _this.push(file);
    });

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
        if (emitError) {
          Compiler.abortAll(function () {
            _this.emit('error', new gutil.PluginError('gulp-tsc', 'Failed to compile: ' + (err.message || err)));
            sourceFiles = [];
            done();
          });
          return;
        }
      }
      sourceFiles = [];
      done();
    });
  }

  return through.obj(eachFile, endStream);
};
