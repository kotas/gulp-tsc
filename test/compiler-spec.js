var helper = require('./helper');
var Compiler = require('../lib/compiler');
var tsc = require('../lib/tsc');
var sinon = require('sinon');
var File = require('gulp-util').File;
var fs = require('fs');

describe('Compiler', function () {

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sinon.restore();
  });

  describe('#getVersion', function () {
    it('returns the version of tsc', function (done) {
      this.sinon.stub(tsc, 'version').callsArgWith(1, null, '1.2.3');

      var compiler = new Compiler();
      compiler.getVersion(function (err, version) {
        if (err) return done(err);
        version.should.equal('1.2.3');
        done();
      });
    });
  });

  describe('#addSourceFile', function () {
    it('adds a source file and an output file for it', function () {
      var sourceFile = new File({ cwd: '/', path: '/test.ts' });

      var compiler = new Compiler();
      compiler.addSourceFile(sourceFile);

      compiler.sourceFiles.should.have.length(1);
      compiler.sourceFiles[0].path.should.equal('/test.ts');

      compiler.outputFiles.should.have.length(1);
      compiler.outputFiles[0].path.should.equal('/test.js');
    });

    it('adds also .map and .d.ts files when required', function () {
      var sourceFile = new File({ cwd: '/', path: '/test.ts' });

      var compiler = new Compiler({ sourcemap: true, declaration: true });
      compiler.addSourceFile(sourceFile);

      compiler.outputFiles.should.have.length(3);
      compiler.outputFiles[0].path.should.equal('/test.js');
      compiler.outputFiles[1].path.should.equal('/test.d.ts');
      compiler.outputFiles[2].path.should.equal('/test.js.map');
    });

    it('never adds an output file for .d.ts file', function () {
      var sourceFile = new File({ cwd: '/', path: '/test.d.ts' });

      var compiler = new Compiler();
      compiler.addSourceFile(sourceFile);

      compiler.outputFiles.should.be.empty;
    });
  });

  describe('#compile', function () {
    it('executes tsc command', function (done) {
      var proc = helper.createDummyProcess();
      this.sinon.stub(tsc, 'exec').returns(proc);

      var compiler = new Compiler();
      compiler.compile(function (err) {
        if (err) return done(err);

        tsc.exec.calledOnce.should.be.true;
        var args = tsc.exec.args[0];
        args[0].should.eql(['--module', 'commonjs', '--target', 'ES3']);

        done();
      });

      proc.terminate(0);
    });

    it('removes generated file after compilation', function (done) {
      var proc = helper.createDummyProcess();
      this.sinon.stub(tsc, 'exec').returns(proc);

      helper.createTemporaryFile({ prefix: 'gulp-tsc', suffix: '.ts' }, function (err, file) {
        if (err) return done(err);

        var compiler = new Compiler();
        compiler.addSourceFile(file);
        compiler.outputFiles.should.have.length(1);
        var outputFile = compiler.outputFiles[0];

        compiler.compile(function (err) {
          if (err) return done(err);
          fs.existsSync(outputFile.path).should.be.false;
          done();
        });

        setTimeout(function () {
          fs.writeFileSync(outputFile.path, 'test file');
          proc.terminate(0);
        }, 10);
      });
    });

    it('keeps existed file after compilation', function (done) {
      var proc = helper.createDummyProcess();
      this.sinon.stub(tsc, 'exec').returns(proc);

      helper.createTemporaryFile({ prefix: 'gulp-tsc', suffix: '.ts' }, function (err, file) {
        if (err) return done(err);

        var compiler = new Compiler();
        compiler.addSourceFile(file);
        compiler.outputFiles.should.have.length(1);
        var outputFile = compiler.outputFiles[0];

        fs.writeFileSync(outputFile.path, 'test file');

        compiler.compile(function (err) {
          if (err) return done(err);
          fs.existsSync(outputFile.path).should.be.true;
          fs.unlinkSync(outputFile.path);
          done();
        });

        proc.terminate(0);
      });
    });

    it('bypasses outputs from tsc process as events', function (done) {
      var proc = helper.createDummyProcess();
      this.sinon.stub(tsc, 'exec').returns(proc);

      var emitted = [];

      var compiler = new Compiler();
      compiler.on('stdout', function (line) { emitted.push(['stdout', line.toString()]) });
      compiler.on('stderr', function (line) { emitted.push(['stderr', line.toString()]) });

      compiler.compile(function (err) {
        if (err) return done(err);

        emitted.should.have.length(4);
        emitted[0].should.eql(['stdout', 'test stdout1']);
        emitted[1].should.eql(['stderr', 'test stderr1']);
        emitted[2].should.eql(['stdout', 'test stdout2']);
        emitted[3].should.eql(['stderr', 'test stderr2']);

        done();
      });

      setTimeout(function () {
        proc.stdout.write('test stdout1\n');
        proc.stderr.write('test stderr1\n');
        proc.stdout.write('test stdout2\n');
        proc.stderr.write('test stderr2\n');
        proc.terminate(0);
      }, 10);
    });
  });

});
