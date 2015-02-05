var req = require('request');
var cheerio = require('cheerio');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database: 'fantasee'
});


req('http://fantasy.nfl.com/league/874089/history', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(body);

    var leagueId = Number($('.navHome').attr('href').split('=')[1]);
    var seasons = [];

    console.log('League id: ' + leagueId);

    $('[class*="history-champ"]').each(function (i, e) {
      var $row = $(e);
      var year = $row.find('.historySeason').text();
      var team = $row.find('.historyTeam .teamName').text();
      seasons.push(year);
      console.log(year + ' Champion: ' + team);
    });

    console.log(seasons);

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

    connection.connect();

    connection.query('INSERT IGNORE INTO `league` SET `league_id` = ' + leagueId, function(err, rows, fields) {
      if (err) throw err;
      var rowId = rows.insertId ? rows.insertId : 'league already exists';
      console.log('League ' + leagueId + ' added with id: ' + rowId);
    });

    connection.end();
  }
});
