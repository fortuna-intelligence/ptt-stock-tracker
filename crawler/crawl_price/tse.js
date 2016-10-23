var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var request = require('request-promise');

if (require.main === module) {
    crawl(moment().add(-1, 'days')).then(function(data){
        console.log(data);
    });
}

module.exports.crawl = crawl;

function crawl(momentDate) {
    var TWyear = momentDate.year() - 1911;
    return request({
        uri: 'http://www.twse.com.tw/ch/trading/exchange/MI_INDEX/MI_INDEX.php',
        method: 'POST',
        formData: {
            download: 'html',
            qdate: TWyear + '/' + momentDate.format("MM/DD"),
            selectType: 'ALLBUT0999'
        },
        encoding : 'utf-8'
    }).then(function(data) {
        return parseContent(data);
    });
}

var Fields = ['symbol_id', 'volume', 'turnover', 'amount', 'open', 'high', 'low', 'close', 'sign', 'change'];
function parseContent(body) {
    // check empty
    if (_.isEmpty(body)) { throw new Error('empty data'); }
    var $ = cheerio.load(body);
    var $table = $('table').eq(1);
    if (body.indexOf('查無資料') > 0) { 
        if ($('table').length === 0) {
            throw new Error('no data'); 
        } else {
            $table = $('table').eq(0);
        }
    }

    var ret = [];
    var dateText = $table.find('thead span').text();
    var dataDate = dateText.match(/\d+/g);
    dataDate = dataDate.slice(-3);
    dataDate[0] = +dataDate[0]+1911;
    dataDate = moment(dataDate.join(""), "YYYYMMDD").toDate();

    $table.find('tbody tr').each(function(idx,val) {
        var rowInfo = $(val).find('td').filter(function(idx) {
            return idx < 11 && idx != 1;
        }).map(function(inidx, inval) {
            return $(inval).text().replace(/\,/g,'').trim();
        }).toArray();

        var rowObj = _.mapValues(_.object(Fields, rowInfo), function(val, key) {
            return (key === 'volume' || key === 'amount' || key === 'turnover') ? ( isNaN(+val)? 0 : +val ) : val;
        });
        if (rowObj.sign === '－'){
            rowObj.change = '-' + rowObj.change;
        }
        rowObj.date = dataDate;
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
