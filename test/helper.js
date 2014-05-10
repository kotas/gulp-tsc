var should = require('should');
var gutil = require('gulp-util');
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var path = require('path');
var temp = require('temp');

module.exports.createDummyProcess = function () {
  var proc = new EventEmitter();
  proc.stdout = new stream.PassThrough();
  proc.stderr = new stream.PassThrough();
  proc.terminate = function (code) {
    process.nextTick(function () {
      proc.stdout.end();
      proc.stderr.end();
      proc.emit('exit', code);
    });
  };
  return proc;
};

module.exports.createDummyFile = function (options) {
  options = options || {};
  if (!options.path) options.path = temp.path({ suffix: '.ts' });
  if (!options.base) options.base = path.dirname(options.path);
  if (!options.cwd)  options.cwd  = options.base;
  return new gutil.File(options);
};

module.exports.createTemporaryFile = function (fixes, callback) {
  temp.track();
  temp.open(fixes, function (err, info) {
    if (err) return callback(err, null);

    var file = new gutil.File({
      cwd: path.dirname(info.path),
      base: path.dirname(info.path),
      path: info.path,
      contents: null
    });
    file.fd = info.fd;
    file.cleanup = function () {
      temp.cleanup();
    };

    callback(null, file);
  });
};
