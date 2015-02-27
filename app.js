/* Dependencies */
var request = require('request');
var cheerio = require('cheerio');

/* Required vars */
/* We have to have a league ID for anything to work */
var leagueId  = process.argv[2] || null;
var baseUrl = 'http://fantasy.nfl.com/league/' + leagueId + '/history';
var methods = [];


if (null === leagueId) {
  throw new Error('No league id supplied. e.g. `node app.js 12345`');
}

if (undefined === process.argv[3]) {
  console.warn('No scrape methods supplied. Will run all.');
}

process.argv.forEach(function (arg, i) {
  if (i >= 3) {
    methods.push(arg);
  }
});

var Scraper = function(leagueId, baseUrl, methods) {
  this.leagueId = leagueId;
  this.baseUrl = baseUrl;
  this.methodsToRun = methods;
  this.seasons = [];

  var that = this;
  this.getSeasonsPromise = new Promise(function(resolve, reject) {
    request(that.baseUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        $('#historySeasonNav .st-menu a[href]').each(function (i, e) {
          var year = parseInt($(e).text());
          that.seasons.push(year);
        });
        resolve(that.seasons);
      } else {
        reject(Error('Not found'));
      }
    });
  });
};


Scraper.prototype.init = function () {
  var that = this;
  if (this.seasons.length > 0) {
    this.fireScraper(that.seasons);
  } else {
    this.getSeasonsPromise.then(function (seasons) {
      that.fireScraper(seasons);
    }, function(err) {
      console.log(err);
    });
  }
};

Scraper.prototype.fireScraper = function (seasons) {
  var that = this;

  // If we've got no methods passed in, run everything cuz whaaa
  if (that.methodsToRun.length === 0) {
    for (var method in that.Scrape) {
      that.Scrape[method].call(that, seasons);
    }
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

      $('#leagueHistoryAlmanac [class*="history-champ"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        seasons.push(year);
        console.log(year + ' Champion: ' + team);
      });

      $('#leagueHistoryAlmanac [class*="history-btw"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Weekly Points Winner: ' + team + ' with ' + points + ' points in week ' + week);
      });

      $('#leagueHistoryAlmanac [class*="history-bpw"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var player = $row.find('.playerNameAndInfo .playerName').text();
        var posTeam = $row.find('.playerNameAndInfo em').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Weekly Player Points Winner: ' + team + ' with ' + player + ' (' + posTeam + ') with ' + points + ' points in week ' + week);
      });

      $('#leagueHistoryAlmanac [class*="history-bts"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Season Points Winner: ' + team + ' with ' + points + ' points');
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
          console.log(season + ' season');
          $('#finalStandings #championResults .results li').each(function (i, e) {
            var $row = $(e);
            var pos = i += 1;
            var team = $row.find('.teamName').text();
            console.log(pos + ' : ' + team);
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
        console.log(season + ' season draft');
        $('#leagueDraftResults #leagueDraftResultsResults .results .wrap > ul').each(function (j, e) {
          var round = j += 1;
          console.log('Round ' + round);
          var $picks = $(e).children('li');
          $picks.each(function (k, e) {
            var $pick = $(e);
            var pick = Number($pick.find('.count').text());
            var player = $pick.find('.playerName').text();
            var team = $pick.find('.teamName').text();
            console.log('Pick ' + pick + ': ' + player + ' TO ' + team);
          });
        });
      } else {
        console.log(error);
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
        $('#leagueOwners .tableWrap tbody tr').each(function (i, e) {
          var $row = $(e);
          var owner = $row.find('.teamOwnerName').text();
          var ownerId = ($row.find('[class*="userId-"]').attr('class')).replace(/(\D)*/, '');
          var ownerTeamName = $row.find('.teamName').text();
          console.log(owner + ' (' + ownerId + ') : ' + ownerTeamName);
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
        $('#leagueTransactions .tableWrap tbody > [class*="transaction-trade-"]').each(function (i, e) {
          var $row = $(e);
          // ignore the dropped players for now, we're only interested in "status" 1 and 2
          var tradeId = $(e).attr('class').match(/transaction-trade-(.*?)-[12]/);

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
        console.log(season);
        for (var trade in tradeObj) {
          if (tradeObj.hasOwnProperty(trade)) {
            var team1 = tradeObj[trade][0];
            var team2 = tradeObj[trade][1];
            console.log(trade + ': ' + team1.teamName + ' traded ' + team1.players.join(', ') + ' to ' + team2.teamName + ' for ' + team2.players.join(', ') + ' on ' + team1.date);
          }
        }

        var next = $('#leagueTransactions .paginationWrap .pagination .next a').attr('href');

        if (undefined !== next) {
          // we have a next link, recursion!
          that.Scrape.trades([season], next);
        }

      }
    });
  });
};

Scraper.prototype.Scrape = ScrapeAPI;

var scrapeSession = new Scraper(leagueId, baseUrl, methods);
scrapeSession.init();
