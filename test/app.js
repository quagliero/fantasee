var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Scraper = require('../app.js');  // our module

var expect = chai.expect;
var s;

chai.use(sinonChai);
process.env.NODE_ENV = 'test';

describe('Scraper', function () {

  beforeEach(function () {
    s = new Scraper({
      leagueId: 874089,
      baseUrl: 'http://fantasy.nfl.com/league/874089/history',
      seasons: [2012, 2013, 2014],
      methods: ['almanac', 'trades']
    });
  });

  describe('constructor', function () {
    it('should be of type object', function () {
      expect(s).to.be.an('object');
    });

    it('should throw an error if no league id supplied', function () {
      var x = function() { return new Scraper(); };
      expect(x).to.throw(Error);
    });

    it('should instantiate if a league id is supplied', function () {
      expect(s).to.be.an.instanceof(Scraper);
    });

    it('should should set the league id from the options config', function() {
      expect(s.leagueId).to.equal(874089);
    });

    it('should set the base url from the options config', function () {
      expect(s.baseUrl).to.equal('http://fantasy.nfl.com/league/874089/history');
    });

    it('should default the base url if not supplied', function () {
      var x = new Scraper({leagueId: 12345});
      expect(x.baseUrl).to.equal('http://fantasy.nfl.com/league/' + x.leagueId + '/history');
    });

    it('should set the methods from the options config', function () {
      expect(s.methodsToRun).to.have.length(2);
      expect(s.methodsToRun).to.contain('almanac');
      expect(s.methodsToRun).to.contain('trades');
    });

    it('should default the methods to an empty array if not supplied', function () {
      var x = new Scraper({leagueId: 874089});
      expect(x.methodsToRun).to.be.an('array');
      expect(x.methodsToRun).to.have.length(0);
    });

    it('should set the seasons from the options config', function () {
      expect(s.seasons).to.have.length(3);
      expect(s.seasons).to.contain(2012);
      expect(s.seasons).to.contain(2014);
    });

    it('should default the seasons to be empty array if not supplied', function () {
      var x = new Scraper({leagueId: 874089});
      expect(x.seasons).to.be.an('array');
      expect(x.seasons).to.have.length(0);
    });
  });

  describe('#init()', function () {
    var fireScraper = sinon.spy(Scraper.prototype, 'fireScraper');
    var getSeasons = sinon.spy(Scraper.prototype, 'getSeasons');

    it('should exist', function () {
      expect(s.init).to.be.a('function');
    });

    it('should respond when called', function () {
      expect(s).to.respondTo('init');
    });

    it('should call the #fireScraper method if we have seasons', function () {
      s.init();
      expect(fireScraper).to.have.been.called;
    });

    it('should call the #getSeasons method if we have no seasons', function () {
      var x = new Scraper({leagueId: 874089});
      x.init();
      expect(getSeasons).to.have.been.called;
    });
  });

  describe('#getSeasons()', function () {
    it('should exist', function () {
      expect(s.getSeasons).to.be.a('function');
    });

    it('should respond when called', function () {
      expect(s).to.respondTo('getSeasons');
    });

    it('should resolve an array of season(s) scraped from nfl.com', function () {
      return s.getSeasons().then(function (season) {
        expect(season).to.be.an('array');
      });
    });

  });

});
