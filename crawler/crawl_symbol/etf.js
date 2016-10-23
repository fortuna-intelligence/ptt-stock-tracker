var request = require('request-promise');
var cheerio = require('cheerio');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var iconv = require('iconv-lite');

if (require.main === module) {
//    crawlBasic().then(function(data){
    crawlBasic().then(function(data) {
        console.log(data);
    }).catch(function(err) {
        console.log(err)
    }).done(function() {
    })
}

module.exports.crawlBasic = crawlBasic;

function crawlETFLinks() {
    return request({
        uri: 'http://www.twse.com.tw/ETF/ETFlist.php',
        encoding: null,
    }).then(function(body) {
        return iconv.decode(new Buffer(body), "big5");
    }).then(function(data) {
        return parseETFLinks(data);
    }).catch(function(err) {
        console.log(err);
        throw new Error("get ETF links err");
    })
}

function crawlBasic() {
    return crawlETFLinks().reduce(function(total, link) {
        var uri = 'http://www.twse.com.tw/' + link;
        return request({
            encoding: null,
            uri: uri
        }).then(function(body) {
            return iconv.decode(new Buffer(body), "big5");
        }).then(function(data) {
            return parseETFBasic(data);
        }).then(function(data) {
            return total.concat(data);
        }).catch(function(err) {
            console.log(err);
            throw new Error("crawl basic err");
        })
    }, []).then(function(data) {
        // we finally get an array consists of ETF profiles
        return data;
    });
}

function parseETFLinks(body){
    var $ = cheerio.load(body);
    var etfCells = $('tr.domestic').add('tr.foreign').add('tr.outside').add('tr.leveraged').add('tr.futures').find('a');
    var etfLinks = [];
    etfCells.each(function(idx, el){
        etfLinks.push($(this).attr('href'));
    });
    return etfLinks;
}

function parseETFBasic(body){
    var $ = cheerio.load(body);
    var rows = $('.board_prod').eq(0).find('tr');
    var ret = { 
        'category': 'etf',
        'market': 'tw.etf',
        'off_date': null,
    };
    var mapping = {
        '證券代號': 'symbol_id',
        'ETF簡稱': 'name',
        '名稱': 'aliases',
        '上市日期': 'on_date',
        'ETF類別': 'industry',
    };

    rows.each(function(idx, el) { 
        if (idx === 0){ return; }
        var key = $(this).children('td').eq(0).text().replace(/\s+/g, '');
        var val = $(this).children('td').eq(1).text().replace(/\s+/g, '');

        // check mapping
        var newKey = mapping[key];
        if (newKey) {
            if (newKey === 'name'){
                if (val.indexOf('(') !== -1) {
                    val = val.substr(0, val.indexOf('('));
                } else {
                    val = val;
                }
            }
            if (newKey === 'aliases'){ val = [val]; }
            if (newKey === 'on_date'){
                var date = val.match(/[0-9]+/g);
                var dateString = date[0] + '-' + date[1] + '-' + date[2];
                val = moment(dateString, 'YYYY-M-D').toDate();
            }
            ret[newKey] = val;
        }
    });
    // manual modify
    var multipleSymbols = ret['symbol_id'].match(/([a-z0-9]+)\(.+\)\/[a-z0-9]+\(.+\)/i);
    if (multipleSymbols) { ret['symbol_id'] = multipleSymbols[1]; }
    if (ret['symbol_id'] === '0080'){ ret['name'] = '恒中國'; }
    if (ret['symbol_id'] === '0081'){ ret['name'] = '恒香港'; }
    if (ret['symbol_id'] === '008201'){ ret['name'] = '上證50'; }
    return ret;
}
