var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var request = require('request-promise');

if (require.main === module) {
    crawl(moment().add(-1, 'd')).then(function(data){
        console.log(data);
    });
}

module.exports.crawl = crawl;

function crawl(momentDate) {
    var TWyear = momentDate.year() - 1911;
    return request({
        uri: 'http://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_print.php?l=zh-tw&d='+TWyear+'/'+momentDate.format('MM/DD')+'&s=0,asc,0',
    }).then(function(data) {
        return parseContent(data);
    });
}

var Fields = ['symbol_id', 'close', 'change', 'open', 'high', 'low', 'avg', 'volume', 'amount', 'turnover'];
function parseContent(body) {
    if (body.indexOf('共0筆') > 0) { throw new Error('no data'); }
    var $ = cheerio.load(body);
    var ret = [];
    var dateText = $('thead').find('tr').eq(0).text();
    var dataDate = dateText.match(/\d+/g);
    dataDate = dataDate.slice(-3);
    dataDate[0] = +dataDate[0]+1911;
    dataDate = moment(dataDate.join(""), "YYYYMMDD").toDate();

    $('table').find('tbody tr').each(function(idx,val) {
        if ($(val).find('td').length === 1){
            // '管理股票' useless row
            return;
        }

        var rowInfo = $(val).find('td').filter(function(idx) {
            return idx <11 && idx!=1;
        }).map(function(inidx, inval){
            return $(inval).text().replace(/[\,\+]/g,'').trim();
        }).toArray();

        var rowObj = _.mapValues(_.object(Fields, rowInfo), function(val, key) {
            return (key === 'volume' || key === 'amount' || key === 'turnover')? ( isNaN(+val)? 0 : +val ) : val;
        });

        // calculate change
        if (rowObj.change === '除權息' ||
            rowObj.change === '除權' ||
            rowObj.change === '除息' ) { 
            rowObj.change = (Number(rowObj.close) - Number(rowObj.open)).toFixed(2);
        }
        // set NaN value to null
        Object.keys(rowObj).forEach(function(key) {
            if (['close', 'change', 'open', 'high', 'low', 'avg', 'volume', 'amount', 'turnover'].indexOf(key) !== -1) {
                if (isNaN(+rowObj[key])) {
                    rowObj[key] = null;
                }
            }
        });

        rowObj.date = dataDate;
        ret.push(rowObj);
    });
    
    if (ret.length === 0) { throw new Error('no data'); }
    return ret;
}
