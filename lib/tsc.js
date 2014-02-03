'use strict';

var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var which = require('which');
var shellescape = require('shell-escape');

module.exports.exec = exec;
module.exports.version = version;
module.exports.find = find;

function exec(args, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!options && typeof args === 'function') {
    callback = args;
    args = null;
  }
  options = options || {};

  var tscPath = options.path;
  if (!tscPath) {
    try {
      tscPath = find(options.search);
    } catch (e) {
      return callback && callback(e);
    }
  }

  var nodePath = process.execPath;
  var command = shellescape([nodePath, tscPath]);
  if (args) {
    command += ' ' + (Array.isArray(args) ? shellescape(args) : args);
  }
  return child_process.exec(command, options, callback);
}

function version(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }
  return exec('-v', options, function (err, stdout, stderr) {
    if (err) return callback(err, null);

    var version = stdout && stdout.match(/^Version (\d+\.\d+\.\d+\.\d+)/);
    version = version && version[1];

    callback(null, version);
  });
}

function find(places) {
  places = places || ['cwd', 'shell', 'bundle'];
  for (var i = 0; i < places.length; i++) {
    var fn = searchFunctions[places[i]];
    if (!fn) {
      throw new Error('Unknown search place: ' + places[i]);
    }
    var found = fn();
    if (found) return found;
  }
  throw new Error('Can\'t locate `tsc` command');
}

var searchFunctions = {
  cwd: function () {
    var tscPath = path.resolve(process.cwd(), './node_module/typescript/bin/tsc');
    return fs.existsSync(tscPath) ? tscPath : null;
  },
  shell: function () {
    try { return which.sync('tsc') } catch (e) { return null }
  },
  bundle: function () {
    try { return path.resolve(require.resolve('typescript'), '../tsc') } catch (e) { return null }
  }
};
