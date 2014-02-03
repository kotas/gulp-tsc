var helper = require('./helper');
var typescript = require('../index');
var fs = require('fs');
var gutil = require('gulp-util');
var sinon = require('sinon');

describe('gulp-tsc', function () {

  beforeEach(function () {
    sinon.stub(gutil, 'log');
  });
  afterEach(function () {
    gutil.log.restore();
  });

  it('compiles TypeScript files into JavaScript', function (done) {
    helper.createTemporaryFile({ prefix: 'gulp-tsc', suffix: '.ts' }, function (err, file) {
      if (err) return done(err);

      fs.writeSync(file.fd, 'var s:string = "Hello, world";\nvar n:number = 10;\n');
      fs.closeSync(file.fd);

      var stream = typescript();
      stream.once('data', function (file) {
        file.path.should.match(/\.js$/);
        file.contents.toString().should.equal('var s = "Hello, world";\nvar n = 10;\n');

        fs.existsSync(file.path).should.be.false;

        done();
      });
      stream.write(file);
      stream.end();
    });
  });

});
