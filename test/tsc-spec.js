var helper = require('./helper');
var tsc = require('../lib/tsc');
var sinon = require('sinon');
var child_process = require('child_process');
var shellescape = require('../lib/shellescape');

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

      var command = execStub.args[0][0];
      command.should.match(/^.+?tsc(\.cmd|\.exe)?"? foo bar$/);

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

      var command = execStub.args[0][0];
      command.should.match(/^.+?tsc(\.cmd|\.exe)?"? -v$/);

      done();
    });
    ret.should.equal('return value');
  });

  it('finds the tsc command location', function () {
    tsc.find().should.match(/tsc(\.cmd|\.exe)?$/);
  });

});
