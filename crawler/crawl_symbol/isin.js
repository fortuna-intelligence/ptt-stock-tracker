var cheerio = require('cheerio');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var iconv = require('iconv-lite');
var request = require('request-promise');

module.exports.crawlIsin = crawlIsin;

if (require.main === module) {
    crawlIsin().then(function(x) {
        console.log(x);
    });
}

function crawlIsin(){
    // stock: 2, otc: 4, emg: 5
    return Promise.reduce(['2', '4', '5'], function(total, strMode){
        return request({
            uri: 'http://isin.twse.com.tw/isin/C_public.jsp?strMode=' + strMode,
            encoding : null
        }).then(function(data){
            return iconv.decode(new Buffer(data), 'big5');
        }).then(function(data){
            return parseIsin(data);
        }).then(function(data){
            return (data)? total.concat(data) : total;
        });
    }, []);
}

function parseIsin(body){
    var $ = cheerio.load(body);
    var keys = ['symbol_id', 'isin', 'on_date', 'market', 'industry', 'cfi', 'note'];
    var markets = {
        '上市': 'tw.tse', 
        '上櫃': 'tw.otc',
        '興櫃': 'tw.emg',
    };
    var ret = [];
    $('table').eq(1).find('tr').filter(function(idx){
        return idx >= 2;
    }).each(function(idx, val){
        var tds = $(val).find('td');
        if(tds.length > 1){
            if(
                !tds.eq(5).text().match(/^RWSN/) &&
                !tds.eq(5).text().match(/^EUCI/) &&
                !tds.eq(5).text().match(/^DM/)
            ) {
                var tdsContent = _.map(tds, function(val){ return $(val).text(); });
                var tempRet = _.object(keys, tdsContent);
                var temp = tempRet['symbol_id'].split(/[ |　]+/);
                tempRet['symbol_id'] = temp[0];
                tempRet['name'] = temp[1];
                tempRet['market'] = markets[tempRet['market']];
                tempRet['on_date'] = moment(tempRet['on_date'], 'YYYY/MM/DD').toDate();
                ret.push(_.omit(tempRet, 'isin', 'cfi', 'note'));
            }
        }
    });
    return ret;
}
