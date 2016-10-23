var request = require('request-promise');
var cheerio = require('cheerio');
var moment = require('moment');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('lodash');
var ipRegex = require('ip-regex');

module.exports.mongoose = mongoose;
module.exports.moment = moment;
module.exports.bluebird = Promise;
module.exports.lodash = _;

var config = require('../config');
var connString = (config.db.user && config.db.password) ? 
    `mongodb://${config.db.user}:${config.db.password}@${config.db.url}/fugle_ptt` :
    `mongodb://${config.db.url}/fugle_ptt`;
var connection = mongoose.createConnection(connString, config.db.options);
var Ptt = connection.model('Ptt', require('../../schemas/ptt'));
var Symbol = connection.model('Symbol', require('../../schemas/symbol'));

var HOST = 'https://www.ptt.cc';
var MAX_RETRY = 10;

// PART1:只是宣告，將每個index的連結寫入links，直到到預設的index被讀取
function getMenu(url, dateUntil, retry, results) {
    // for over-18 test
    var jar = request.jar();
    jar.setCookie(request.cookie('over18=1'), url);
    console.log(`fetching menu ${url}`);
    return request({url: url, jar: jar}).then(function(body) {
        var stop = 0;
        var $ = cheerio.load(body);
        // if index.html, ignore bottom articles
        var div_list = (url.slice(-11) === '/index.html') ? $('div.r-list-sep').prevAll() : $('div.r-ent');
        div_list.each(function(i, e) {
            if ($(e).find('a').attr('href') !== undefined) {
                var day = moment().format('YYYY') + '-' + $(e).find('div.meta > div.date').text().replace('/', '-').replace(' ', '0');
                if (day < dateUntil.format('YYYY-MM-DD')) {
                    // comment this to fetch all articles
                    stop = 1;
                } else {
                    var title = $(e).find('a').text();
                    // ignore reply and non-target posts
                    if (title.indexOf('Re: ') !== -1 || title.indexOf('[標的]') === -1) {
                         return; 
                    }
                    results.push({
                        title: $(e).find('a').text(),
                        url: $(e).find('a').attr('href'),
                        userId: $(e).find('.author').text()
                    });
                }
            }
        });
        // Try to get the next page
        var lastPage = $('a.wide:nth-child(2)').attr('href');
        if (stop === 0 && lastPage) {
            // Pass this state as the beginning state in the next round.
            return getMenu(HOST + lastPage, dateUntil, 0, results);
        } else {
            return results;
        }
    }).catch(function(error) {
        console.log('Connect to PTT error ' + url);
        console.log(error);
        if (retry++ < MAX_RETRY) {
            console.log(`retry ${retry} ...`);
            return Promise.delay(2000).then(function() {
                return getMenu(url, dateUntil, retry++, results);
            });
        } else {
            return [];
        }
    });
};

// PART2:只是宣告，將內文從每篇連結的article寫入contents
function getOneArticle(board, meta, retry, tokens) {
    var url = HOST + meta.url;
    var jar = request.jar();
    jar.setCookie(request.cookie('over18=1'), url);
    return request({url: url, jar: jar}).then(function(body) {
        var $ = cheerio.load(body);
        var comments = [];
        var $pushList = $(".push");
        $pushList.each(function(index, value) {
            var $push = $(value);
            var tmp = moment().format('YYYY') + '-' + $push.find('.push-ipdatetime').text().slice(-12).replace(/\n/, '');
            var timestamp = moment(tmp, 'YYYY-MM/DD HH:mm').toDate();
            var result = {
                expression: $push.find('.push-tag').text().trim(),
                user_id: $push.find('.push-userid').text().trim(),
                words: $push.find('.push-content').text().replace(/^: /, ''),
                timestamp: timestamp,
            }
            comments.push(result);
        });

        // get ip
        var ip = '';
        if ($('span.f2').text().match(ipRegex.v4())) {
            ip = $('span.f2').text().match(ipRegex.v4())[0];
        }

        // get article timestamp
        var timestamp = $('span.article-meta-value').eq(-1).text();
        if (moment(timestamp, 'ddd MMM DD HH:mm:ss YYYY').isValid()) {
            timestamp = moment(timestamp, 'ddd MMM DD HH:mm:ss YYYY').toDate();
        } else {
            timestamp = new Date();
        }

        // get user info
        var userInfo = $('div.article-metaline:nth-child(1) > span:nth-child(2)').text()
        var userName = '';
        if (userInfo.match(/\((.+)\)/)) {
            userName = userInfo.match(/\((.+)\)/)[1];
        }

        // content
        var content = $('#main-content').find('.article-metaline').remove().end()
            .find('.article-metaline-right').remove().end()
            .find('span[class="f2"]').remove().end()
            .find('.push').remove().end()
            .text();

        // check title to put symbolId in
        var symbolIds = [];
        tokens.forEach(function(token) {
            if (meta.title.indexOf(token.symbolId) !== -1) {
                symbolIds.push(token.symbolId);
            }
        });
        // try again
        if (symbolIds.length === 0) {
            tokens.forEach(function(token) {
                var mapped = token.terms.some(function(term) {
                    return meta.title.indexOf(term) !== -1;
                });
                if (mapped) {
                    symbolIds.push(token.symbolId);
                }
            });
        }
        symbolIds = _.uniq(symbolIds);

        console.log(meta.title);
        return {
            article_id: url.slice((HOST+'/bbs/'+board).length).slice(1, 19).replace(/\./g, ''),
            user_id: meta.userId,
            user_name: userName,
            title: meta.title,
            timestamp: timestamp,
            board: board,
            url: url,
            ip: ip,
            content: content,
            comments: comments,
            symbol_ids: symbolIds,
        };
    }).catch(function(error) {
        console.log('error getOneArticle: ' + url);
        console.log(error)
        //global_err_log = global_err_log + 'error to get article: ' + url +'<br/>';
        if (retry++ < MAX_RETRY) {
            console.log(`retry ${retry} ...`);
            return Promise.delay(2000).then(function() {
                return getOneArticle(board, meta, retry++);
            });
        } else {
            return -1;
        }
    });
}

function getTermMappings() {
    return Promise.resolve(
        Symbol.find({
            market: { $in: ['tw.tse', 'tw.otc', 'tw.emg', 'tw.etf', 'tw.index'] }
        }, {
            _id: 0,
            symbol_id: 1,
            name: 1,
            aliases: 1
        }).lean().exec()
    ).map(function(symbol) {
        return {
            symbolId: symbol.symbol_id,
            terms: symbol.aliases.concat([symbol.name])
        };
    }).catch(function(error) {
        console.log(error);
        return [];
    });
}

function crawlerWork(dateUntil) {
    var totalArticles = 0;
    var finalArticles = 0;
    var tokens = [];

    return getTermMappings().then(function(dbTokens) {
        tokens = dbTokens;
        var url = HOST + '/bbs/Stock/index.html';
        return getMenu(url, dateUntil, 0, []).then(function(array) {
            totalArticles = array.length;
            return array;
        });
    }).each(function(meta) {
        return Promise.delay(500).then(function() {
            return getOneArticle('Stock', meta, 0, tokens);
        }).then(function(article) {
            if (article === -1) { return; }
            finalArticles++;
            return Ptt.updateData(article);
        });
    }).then(function() {
        console.log(`Total: ${finalArticles} / ${totalArticles}`);
    }).catch(function(error) {
        console.log(error);
    });
}

// default to crawl last 3 days' data
var today = moment().format('YYYYMMDD');
var dateUntil = (process.argv.length > 2) ? moment(process.argv[2], "YYYYMMDD") : moment(today, 'YYYYMMDD').add(-30, 'days');

console.log('PTT crawler Start...');
return crawlerWork(dateUntil).done(function() {
    console.log('done.');
    mongoose.disconnect();
});
