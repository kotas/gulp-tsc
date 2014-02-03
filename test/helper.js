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
    setTimeout(function () {
      proc.stdout.end();
      proc.stderr.end();
      proc.emit('exit', code);
    }, 10);
  };
  return proc;
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
