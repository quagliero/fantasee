var req     = require('request');
var cheerio = require('cheerio');
var mysql   = require('mysql');
var league  = process.argv[2] || null;
var baseUrl = 'http://fantasy.nfl.com/league/' + league + '/history';

if (league === null) {
  console.warn('No league id supplied. e.g. `node app.js 12345`');
  return false;
}

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database: 'fantasee'
});

// insert league to db
connection.connect();

connection.query('INSERT IGNORE INTO `league` SET `league_id` = ' + league, function(err, rows, fields) {
  if (err) throw err;
  var rowId = rows.insertId ? rows.insertId : 'league already exists';
  console.log('League ' + league + ' added with id: ' + rowId);
});

connection.end();

function almanac() {
  req(baseUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var seasons = [];

      $('[class*="history-champ"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        seasons.push(year);
        console.log(year + ' Champion: ' + team);
      });

      $('[class*="history-btw"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Weekly Points Winner: ' + team + ' with ' + points + ' points in week ' + week);
      });

      $('[class*="history-bpw"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var week = $row.find('.historyWeek').text();
        var team = $row.find('.historyTeam .teamName').text();
        var player = $row.find('.playerNameAndInfo .playerName').text();
        var posTeam = $row.find('.playerNameAndInfo em').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Weekly Player Points Winner: ' + team + ' with ' + player + ' (' + posTeam + ') with ' + points + ' points in week ' + week);
      });

      $('[class*="history-bts"]').each(function (i, e) {
        var $row = $(e);
        var year = $row.find('.historySeason').text();
        var team = $row.find('.historyTeam .teamName').text();
        var points = $row.find('.historyPts').text();
        console.log(year + ' Season Points Winner: ' + team + ' with ' + points + ' points');
      });

      seasonStandings(seasons);
      seasonDraftResults(seasons);
    }
  });
}

function seasonStandings(seasons) {
    seasons.forEach(function (season, i) {
      req(baseUrl + '/' + season + '/standings', function (error, response, body) {
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
}

function seasonDraftResults(seasons) {
  seasons.forEach(function (season, i) {
    req(baseUrl + '/' + season + '/draftresults?draftResultsDetail=0&draftResultsTab=round&draftResultsType=results', function (error, response, body) {
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
      }
  });
});
}

// Run it
almanac();
