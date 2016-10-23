var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var request = require('request-promise');
var iconv = require('iconv-lite');

if (require.main === module) {
    crawl(moment().add(-1, 'd')).then(function(data){
        console.log(data);
    });
}

module.exports.crawl = crawl;

function crawl(momentDate){
    return request({
        uri: 'http://www.tpex.org.tw/web/emergingstock/historical/daily/EMdes010_result.php?l=zh-tw&f=EMdes010.' + momentDate.format("YYYYMMDD") + '-C.csv&_=' + (+moment()),
        method: 'GET',
        encoding : null
    }).then(function(data){
        return [iconv.decode(new Buffer(data), 'big5'), momentDate];
    }).then(function(params) {
        return parseContent(params);
    });
}

// 興櫃目前資料定義: 
// * 開盤價 = open  = 前日均價 (因為暫時無法取得第一筆成交資料)
// * 收盤價 = close = 最後一筆成交
// * avg(暫存) = 當日均價
var Fields = ['symbol_id', 'avg', 'open', 'change', 'change_rate', 'high', 'low', 'close', 'volume', 'amount', 'turnover'];
function parseContent(params) {
	var body = params[0];
	var date = params[1].toDate();
	var json = JSON.parse(body);
	if (json.aaData.length === 0) { throw new Error('no data'); }

	var ret = [];
	json.aaData.forEach(function(el, idx) {
		var rowInfo = el.filter(function(inEl, inIdx) {
			return (inIdx === 0 || (inIdx >= 4 && inIdx <= 13));
		}).map(function(inEl){
			return inEl.replace(/[\,\+]/g,'').trim();
		});

       	var rowObj = _.mapValues(_.object(Fields, rowInfo), function(val, key){
            return (key === 'volume' || key === 'amount' || key === 'turnover')? ( isNaN(+val)? 0 : +val ) : val;
        });

        rowObj.date = date;
        // set NaN value to null
        Object.keys(rowObj).forEach(function(key) {
            if (['close', 'change', 'change_rate', 'open', 'high', 'low', 'avg', 'volume', 'amount', 'turnover'].indexOf(key) !== -1) {
                if (isNaN(+rowObj[key])) {
                    rowObj[key] = null;
                }
            }
        });

        ret.push(rowObj);
    });

    return ret;
}
