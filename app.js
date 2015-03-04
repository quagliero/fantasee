(function (module) {


/* Dependencies */
var request = require('request');
var cheerio = require('cheerio');
var env = process.env.NODE_ENV;

function log(msg) {
  if (env === 'dev') {
    console.log(msg);
  }
}

/* Required vars */
/* We have to have a league ID for anything to work */
var config = {
  leagueId: process.argv[2] || null,
  methods: [],
  seasons: []
};

process.argv.forEach(function (arg, i) {
  if (i >= 3) {
    config.methods.push(arg);
  }
});

var Scraper = function(config) {
  config = config || {};
  if (!config.leagueId) {
    throw new Error('No league id supplied to constructor');
  }

  this.leagueId = config.leagueId;
  this.baseUrl = config.baseUrl || 'http://fantasy.nfl.com/league/' + this.leagueId + '/history';
  this.methodsToRun = config.methods || [];
  this.seasons = config.seasons || [];
};

Scraper.prototype.getSeasons = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    request(that.baseUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        that.seasons.length = 0; // clear existing seasons
        var $ = cheerio.load(body);
        $('#historySeasonNav .st-menu a[href]').each(function (i, el) {
          var year = parseInt($(el).text());
          that.seasons.push(year);
        });
        if (that.seasons.length === 0) {
          reject(Error('No seasons to scrape'));
        } else {
          resolve(that.seasons);
        }
      } else {
        reject(Error('Could not access page: ' + error));
      }
    });
  });
};

Scraper.prototype.init = function () {
  var that = this;
  if (this.seasons.length > 0) {
    this.fireScraper(that.seasons);
  } else {
    this.getSeasons().then(function (seasons) {
      that.fireScraper(seasons);
    }, function(err) {
        log(err);
    });
  }
};

Scraper.prototype.fireScraper = function (seasons) {
  var that = this;

  // If we've got no methods passed in, run everything cuz whaaa
  if (that.methodsToRun.length === 0) {
    log('No scrape methods supplied. Will run all.');
    Object.keys(that.Scrape).forEach(function (key) {
      that.Scrape[key].call(that, seasons);
    });
  } else {
    that.methodsToRun.forEach(function (method) {
      if(that.Scrape[method] && typeof that.Scrape[method] === 'function') {
        that.Scrape[method].call(that, seasons);
      }
    });
  }
};

var ScrapeAPI = {};

ScrapeAPI.almanac = function () {
  var that = this;
  request(that.baseUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var seasons = [];

      $('#leagueHistoryAlmanac [class*="history-champ"]').each(function (i, el) {
        var $row = $(el);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        seasons.push(year);
        log(year + ' Champion: ' + team);
      });

      $('#leagueHistoryAlmanac [class*="history-btw"]').each(function (i, el) {
        var $row = $(el);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();

        log(year + ' Weekly Points Winner: ' + team + ' with ' + points + ' points in week ' + week);
      });

      $('#leagueHistoryAlmanac [class*="history-bpw"]').each(function (i, el) {
        var $row = $(el);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var player = $row.find('.playerNameAndInfo .playerName').text();
        var posTeam = $row.find('.playerNameAndInfo em').text();
        var points = $row.find('.historyPts').text();
        log(year + ' Weekly Player Points Winner: ' + team + ' with ' + player + ' (' + posTeam + ') with ' + points + ' points in week ' + week);
      });

      $('#leagueHistoryAlmanac [class*="history-bts"]').each(function (i, el) {
        var $row = $(el);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();

        log(year + ' Season Points Winner: ' + team + ' with ' + points + ' points');
      });
    }
  });
};

ScrapeAPI.seasonStandings = function (seasons) {
  var that = this;
    seasons.forEach(function (season, i) {
      request(that.baseUrl + '/' + season + '/standings', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(body);
          log(season + ' season');
          $('#finalStandings #championResults .results li').each(function (i, el) {
            var $row = $(el);
            var pos = i += 1;
            var team = $row.find('.teamName').text();
            log(pos + ' : ' + team);
          });
        }
    });
  });
};

ScrapeAPI.seasonDraftResults = function (seasons) {
  var that = this;
  seasons.forEach(function (season, i) {
    request(that.baseUrl + '/' + season + '/draftresults?draftResultsDetail=0&draftResultsTab=round&draftResultsType=results', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        log(season + ' season draft');
        $('#leagueDraftResults #leagueDraftResultsResults .results .wrap > ul').each(function (j, el) {
          var round = j += 1;
          log('Round ' + round);
          var $picks = $(el).children('li');
          $picks.each(function (k, el) {
            var $pick = $(el);
            var pick = Number($pick.find('.count').text());
            var player = $pick.find('.playerName').text();
            var team = $pick.find('.teamName').text();
            log('Pick ' + pick + ': ' + player + ' TO ' + team);
          });
        });
      } else {
        log(error);
      }
    });
  });
};

ScrapeAPI.owners = function (seasons) {
  var that = this;
  seasons.forEach(function (season, i) {
    request(that.baseUrl + '/' + season + '/owners', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        $('#leagueOwners .tableWrap tbody tr').each(function (i, el) {
          var $row = $(el);
          var owner = $row.find('.teamOwnerName').text();
          var ownerId = ($row.find('[class*="userId-"]').attr('class')).replace(/(\D)*/, '');
          var ownerTeamName = $row.find('.teamName').text();
          log(owner + ' (' + ownerId + ') : ' + ownerTeamName);
        });
      }
    });
  });
};

/*
 Trades are complex.
 They are not grouped together on the page, each teams side of the trade is in its own
 <tr>, they are grouped by a common class 'transaction-trade-XXXX-Y'
 XXXX is the unique id of the trade in this league,
 Y is a number between 1 and 4 which corresponds to:
 1: Team who offered the trade
 2: Team who accepted the trade
 3: Any players Team 1 had to drop in the process of completing the trade
 4: Any players Team 2 had to drop in the process of completing the trade
 */

 ScrapeAPI.trades = function (seasons, pagination) {
  var that = this;
  var tradeObj = {};
  var urlParams = pagination || '?transactionType=trade';

  seasons.forEach(function (season, i) {
    request(that.baseUrl + '/' + season + '/transactions' + urlParams, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var tradeObj = {};
        var $ = cheerio.load(body);
        $('#leagueTransactions .tableWrap tbody > [class*="transaction-trade-"]').each(function (i, el) {
          var $row = $(el);
          // ignore the dropped players for now, we're only interested in "status" 1 and 2
          var tradeId = $row.attr('class').match(/transaction-trade-(.*?)-[12]/);

          if (null === tradeId) {
            return;
          }

          tradeId = season + '_' + tradeId[1];

          tradeObj[tradeId] = tradeObj[tradeId] || [];
          var players = [];
          var date = $row.find('.transactionDate').text();
          var team = $row.find('.transactionFrom .teamName').text();
          var teamId = $row.find('.transactionFrom .teamName').attr('class').replace(/(\D)*/, '');
          $row.find('.playerNameAndInfo li').each(function (i, el) {
            players.push($(el).find('.playerName').text());
          });
          var data = {
            players: players,
            date: date,
            team: teamId,
            teamName: team
          };

          tradeObj[tradeId].push(data);
        });
        log(season);
        for (var trade in tradeObj) {
          if (tradeObj.hasOwnProperty(trade)) {
            var team1 = tradeObj[trade][0];
            var team2 = tradeObj[trade][1];
            log(trade + ': ' + team1.teamName + ' traded ' + team1.players.join(', ') + ' to ' + team2.teamName + ' for ' + team2.players.join(', ') + ' on ' + team1.date);
          }
        }

        var next = $('#leagueTransactions .paginationWrap .pagination .next a').attr('href');

        if (undefined !== next) {
          // we have a next link, recursion!
          that.Scrape.trades.call(that, [season], next);
        }

      }
    });
  });
};

Scraper.prototype.Scrape = ScrapeAPI;
module.exports = Scraper;

var scrapeSession = new Scraper(config);
scrapeSession.init();

}(module));
