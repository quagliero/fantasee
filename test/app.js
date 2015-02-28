var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var Scraper = require('../app.js');  // our module

describe('Scraper', function() {
  it('should exist', function(){
    assert.equal(typeof Scraper, 'function');
  });
  it('should have an init function', function(){
    assert.equal(typeof Scraper.prototype.init, 'function');
  });
  describe('#init()', function () {
    it('should throw an error if no leagueId supplied', function() {
      var scraper = function() { return new Scraper(); };
      expect(scraper).to.throw(Error);
    });
    it('should instantiate if a leagueId is supplied', function() {
      var scraper = new Scraper({leagueId: 874089});
      expect(scraper).to.exist;
    });
  });
});
