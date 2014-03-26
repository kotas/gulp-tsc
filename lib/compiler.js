'use strict';

var tsc = require('./tsc');
var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var xtend = require('xtend');
var byline = require('byline');
var temp = require('temp');
var rimraf = require('rimraf');
var through = require('through2');
var fsSrc = require('vinyl-fs').src;
var EventEmitter = require('events').EventEmitter;

module.exports = Compiler;

function Compiler(sourceFiles, options) {
  EventEmitter.call(this);

  this.sourceFiles = sourceFiles || [];

  this.options = xtend({
    tscPath:           null,
    tscSearch:         null,
    module:            'commonjs',
    target:            'ES3',
    out:               null,
    outDir:            null,
    mapRoot:           null,
    sourceRoot:        null,
    allowbool:         false,
    allowimportmodule: false,
    declaration:       false,
    noImplicitAny:     false,
    noResolve:         false,
    removeComments:    false,
    sourcemap:         false,
    tmpDir:            '',
    noLib:             false,
    keepTree:          true
  }, options);

  this.tscOptions = {
    path:   this.options.tscPath,
    search: this.options.tscSearch
  };

  this.tempDestination = null;
  this.treeKeeperFile  = null;
}
util.inherits(Compiler, EventEmitter);

Compiler.prototype.buildTscArguments = function () {
  var args = [];
  if (this.options.module)            args.push('--module',     this.options.module.toLowerCase());
  if (this.options.target)            args.push('--target',     this.options.target.toUpperCase());
  if (this.options.mapRoot)           args.push('--mapRoot',    this.options.mapRoot);
  if (this.options.sourceRoot)        args.push('--sourceRoot', this.options.sourceRoot);
  if (this.options.allowbool)         args.push('--allowbool');
  if (this.options.allowimportmodule) args.push('--allowimportmodule');
  if (this.options.declaration)       args.push('--declaration');
  if (this.options.noImplicitAny)     args.push('--noImplicitAny');
  if (this.options.noResolve)         args.push('--noResolve');
  if (this.options.removeComments)    args.push('--removeComments');
  if (this.options.sourcemap)         args.push('--sourcemap');
  if (this.options.noLib)             args.push('--noLib');

  if (this.tempDestination) {
    args.push('--outDir', this.tempDestination);
    if (this.options.out) {
      args.push('--out', path.resolve(this.tempDestination, this.options.out));
    }
  } else if (this.options.out) {
    args.push('--out', this.options.out);
  }

  this.sourceFiles.forEach(function (f) { args.push(f.path); });
  if (this.treeKeeperFile) {
    args.push(this.treeKeeperFile);
  }

  return args;
};

Compiler.prototype.getVersion = function (callback) {
  return tsc.version(this.tscOptions, callback);
};

Compiler.prototype.compile = function (callback) {
  var _this = this;
  var checkAborted = this.checkAborted.bind(this);

  this.emit('start');
  Compiler._start(this);

  async.waterfall([
    checkAborted,
    this.makeTempDestinationDir.bind(this),
    checkAborted,
    this.makeTreeKeeperFile.bind(this),
    checkAborted,
    this.runTsc.bind(this),
    checkAborted
  ], function (err) {
    _this.processOutputFiles(function (err2) {
      _this.cleanup();
      _this.emit('end');
      callback(err || err2);
    });
  });
};

Compiler.prototype.checkAborted = function (callback) {
  if (Compiler.isAborted()) {
    callback(new Error('aborted'));
  } else {
    callback(null);
  }
};

Compiler.prototype.makeTempDestinationDir = function (callback) {
  var _this = this;
  temp.track();
  temp.mkdir({ dir: path.resolve(process.cwd(), this.options.tmpDir), prefix: 'gulp-tsc-tmp-' }, function (err, dirPath) {
    if (err) return callback(err);
    _this.tempDestination = dirPath;

    callback(null);
  });
};

Compiler.prototype.makeTreeKeeperFile = function (callback) {
  if (!this.options.keepTree || this.options.out || this.sourceFiles.length === 0) {
    return callback(null);
  }

  var _this = this;
  temp.open({ dir: this.sourceFiles[0].base, prefix: '.gulp-tsc-tmp-', suffix: '.ts' }, function (err, file) {
    if (err) {
      return callback(new Error(
        'Failed to create a temporary file on source directory: ' + (err.message || err) + ', ' +
        'To skip creating it specify { keepTree: false } to your gulp-tsc.'
      ));
    }

    _this.treeKeeperFile = file.path;
    try {
      fs.writeSync(file.fd, '// This is a temporary file by gulp-tsc for keeping directory tree.\n');
      fs.closeSync(file.fd);
    } catch (e) {
      return callback(e);
    }
    callback(null);
  });
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
  var options = { cwd: this.tempDestination, cwdbase: true };
  var patterns = ['**/*{.js,.js.map,.d.ts}'];
  if (this.treeKeeperFile) {
    patterns.push('!**/' + path.basename(this.treeKeeperFile, '.ts') + '.*');
  }

  var stream = fsSrc(patterns, options);
  stream = stream.pipe(this.fixOutputFilePath());
  if (this.options.sourcemap && !this.options.sourceRoot) {
    stream = stream.pipe(this.fixSourcemapPath());
  }
  stream.on('data', function (file) {
    _this.emit('data', file);
  });
  stream.on('error', function (err) {
    callback(err);
  });
  stream.on('end', function () {
    callback();
  });
};

Compiler.prototype.fixSourcemapPath = function () {
  return through.obj(function (file, encoding, done) {
    if (!file.isBuffer() || !/\.js\.map/.test(file.path)) {
      this.push(file);
      return done();
    }

    var map = JSON.parse(file.contents);
    if (map['sources'] && map['sources'].length > 0) {
      map['sources'] = map['sources'].map(function (sourcePath) {
        sourcePath = path.resolve(path.dirname(file.originalPath), sourcePath);
        sourcePath = path.relative(path.dirname(file.path), sourcePath);
        if (path.sep == '\\') sourcePath = sourcePath.replace(/\\/g, '/');
        return sourcePath;
      });
      file.contents = new Buffer(JSON.stringify(map));
    }
    this.push(file);
    done();
  });
};

Compiler.prototype.fixOutputFilePath = function () {
  var outDir;
  if (this.options.outDir) {
    outDir = path.resolve(process.cwd(), this.options.outDir);
  } else {
    outDir = this.tempDestination;
  }

  return through.obj(function (file, encoding, done) {
    file.originalPath = file.path;
    file.path = path.resolve(outDir, file.relative);
    file.cwd = file.base = outDir;
    this.push(file);
    done();
  });
};

Compiler.prototype.cleanup = function () {
  try { rimraf.sync(this.tempDestination); } catch(e) {}
  try { fs.unlinkSync(this.treeKeeperFile); } catch(e) {}
};

Compiler.running = 0;
Compiler.aborted = false;
Compiler.abortCallbacks = [];

Compiler.abortAll = function (callback) {
  Compiler.aborted = true;
  callback && Compiler.abortCallbacks.push(callback);
  if (Compiler.running == 0) {
    Compiler._allAborted();
  }
};

Compiler.isAborted = function () {
  return Compiler.aborted;
};

Compiler._start = function (compiler) {
  Compiler.running++;
  compiler.once('end', function () {
    Compiler.running--;
    if (Compiler.running == 0 && Compiler.aborted) {
      Compiler._allAborted();
    }
  });
};

Compiler._allAborted = function () {
  var callbacks = Compiler.abortCallbacks;
  Compiler.aborted = false;
  Compiler.abortCallbacks = [];
  callbacks.forEach(function (fn) {
    fn.call(null);
  });
};
