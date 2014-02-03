'use strict';

var tsc = require('./tsc');
var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var xtend = require('xtend');
var byline = require('byline');
var EventEmitter = require('events').EventEmitter;

module.exports = Compiler;

function Compiler(options) {
  EventEmitter.call(this);
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

  this.tscOptions = {
    path:   this.options.tscPath,
    search: this.options.tscSearch
  };

  this.sourceFiles = [];
  this.outputFiles = [];
}
util.inherits(Compiler, EventEmitter);

Compiler.prototype.buildTscArguments = function () {
  var args = [];
  if (this.options.module)            args.push('--module',  this.options.module.toLowerCase());
  if (this.options.target)            args.push('--target',  this.options.target.toUpperCase());
  if (this.options.out)               args.push('--out',     this.options.out);
  if (this.options.mapRoot)           args.push('--mapRoot', this.options.mapRoot);
  if (this.options.allowbool)         args.push('--allowbool');
  if (this.options.allowimportmodule) args.push('--allowimportmodule');
  if (this.options.declaration)       args.push('--declaration');
  if (this.options.noImplicitAny)     args.push('--noImplicitAny');
  if (this.options.noResolve)         args.push('--noResolve');
  if (this.options.removeComments)    args.push('--removeComments');
  if (this.options.sourcemap)         args.push('--sourcemap');
  this.sourceFiles.forEach(function (f) { args.push(f.path); });
  return args;
};

Compiler.prototype.clear = function () {
  this.sourceFiles = [];
  this.outputFiles = [];
};

Compiler.prototype.getVersion = function (callback) {
  return tsc.version(this.tscOptions, callback);
};

Compiler.prototype.addSourceFile = function (file, encoding) {
  this.sourceFiles.push(file);

  if (this.options.out) {
    if (this.outputFiles.length === 0) {
      var outFile = file.clone();
      outFile.base = file.cwd;
      outFile.path = path.resolve(file.cwd, this.options.out);
      this.addOutputFile(outFile, encoding);
    }
  } else {
    var outFile = file.clone();
    outFile.path = outFile.path.replace(/(\.[^.]+)?$/, '.js');
    this.addOutputFile(outFile, encoding);
  }
};

Compiler.prototype.addOutputFile = function (file, encoding) {
  var paths = [file.path];
  if (this.options.declaration) {
    paths.push(file.path.replace(/(\.js)?$/, '.d.ts'));
  }
  if (this.options.sourcemap) {
    paths.push(file.path + '.map');
  }

  var _this = this;
  paths.forEach(function (p) {
    var newFile = file.clone();
    newFile.path = p;
    newFile.contents = null;
    newFile._encoding = encoding;
    _this.outputFiles.push(newFile);
  });
};

Compiler.prototype.compile = function (callback) {
  var _this = this;
  this.emit('start');
  async.waterfall([
    this.markNonexistFiles.bind(this),
    this.runTsc.bind(this)
  ], function (err) {
    _this.processOutputFiles(function (err2) {
      _this.emit('end');
      callback(err || err2);
    });
  });
};

Compiler.prototype.markNonexistFiles = function (callback) {
  async.each(this.outputFiles, function (file, next) {
    fs.exists(file.path, function (exists) {
      file._toRemove = !exists;
      next();
    });
  }, callback);
};

Compiler.prototype.runTsc = function (callback) {
  var _this = this;
  var proc = tsc.exec(this.buildTscArguments(), this.tscOptions);
  var stdout = byline(proc.stdout);
  var stderr = byline(proc.stderr);

  proc.on('exit', function (code) {
    if (code !== 0) {
      callback(new Error('tsc command has exited with code:' + code));
    } else {
      callback(null);
    }
  })
  proc.on('error', function (err) {
    _this.emit('error', err);
  });
  stdout.on('data', function (chunk) {
    _this.emit('stdout', chunk);
  });
  stderr.on('data', function (chunk) {
    _this.emit('stderr', chunk);
  });

  return proc;
};

Compiler.prototype.processOutputFiles = function (callback) {
  var _this = this;
  var newOutputFiles = [];
  async.each(this.outputFiles, function (file, next) {
    var options = file._encoding ? { encoding: file._encoding } : {};
    fs.readFile(file.path, options, function (err, contents) {
      if (err) return next(err);
      file.contents = new Buffer(contents, file._encoding);
      newOutputFiles.push(file);

      if (file._toRemove) {
        fs.unlink(file.path, next);
      } else {
        next();
      }
    });
  }, function (err) {
    _this.outputFiles = newOutputFiles;
    callback(err);
  });
};
