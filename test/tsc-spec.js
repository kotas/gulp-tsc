var helper = require('./helper');
var tsc = require('../lib/tsc');
var sinon = require('sinon');
var child_process = require('child_process');
var shellescape = require('shell-escape');

describe('tsc', function () {
  var execStub;

  beforeEach(function () {
    execStub = sinon.stub(child_process, 'exec');
  });

  afterEach(function () {
    execStub.restore();
  });

  it('executes tsc command', function (done) {
    execStub.callsArgWith(2, null);
    execStub.returns('return value');

    var ret = tsc.exec('foo bar', function (err) {
      if (err) return done(err);

      execStub.calledOnce.should.be.true;

      var command = execStub.args[0][0].split(/ +/);
      command[0].should.equal(shellescape([process.execPath]));
      command[1].should.match(/tsc$/);
      command[2].should.equal('foo');
      command[3].should.equal('bar');

      done();
    });
    ret.should.equal('return value');
  });

  it('returns the version of tsc command', function (done) {
    execStub.callsArgWith(2, null, 'Version 12.34.56.78\n', '');
    execStub.returns('return value');

    var ret = tsc.version(function (err, version) {
      if (err) return done(err);
      version.should.equal('12.34.56.78');

      execStub.calledOnce.should.be.true;

      var command = execStub.args[0][0].split(/ +/);
      command[0].should.equal(shellescape([process.execPath]));
      command[1].should.match(/tsc$/);
      command[2].should.equal('-v');

      done();
    });
    ret.should.equal('return value');
  });

  it('finds the tsc command location', function () {
    tsc.find().should.match(/tsc$/);
  });

});
