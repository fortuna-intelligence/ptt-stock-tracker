var cheerio = require('cheerio');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var iconv = require('iconv-lite');
var request = require('request-promise');

module.exports.crawlBasic = crawlBasic;

if (require.main === module) {
    crawlBasic().then(function(x){
        console.log(x);
    });
}

function crawlBasic(){
    return request({
        url: 'http://mops.twse.com.tw/mops/web/ajax_quickpgm',
        method : 'POST',
        form: {
            encodeURIComponent: 1,
            firstin: true,
            step: 4,
            checkbtn: 1,
            queryName: 'co_id',
            TYPEK2: '',
            code1: '',
            keyword4: ''
        }
    }).then(function(body){
        return parseBasic(body);
    });
}

function getDateFromDesc(string) {
    if (string) {
        var matches = string.match(/(\d+)\/(\d+)\/(\d+)/);
        if (matches) {
            var temp = (+matches[1] + 1911) + '-' + matches[2] + '-' + matches[3];
            return moment(temp, 'YYYY-MM-DD').toDate();
        }
    }
    return null;
}

function parseBasic(data){
    var $ = cheerio.load(data);
    var markets = {
        '上市': 'tw.tse', 
        '上櫃': 'tw.otc',
        '興櫃': 'tw.emg',
        '公開發行': 'tw.public',
    };
    var key = ['symbol_id', 'aliases', 'fullname', 'market', 'industry', 'desc'];
    var companyData = [];
    var ignoreIds = ['000001', '1192', '1198', '3990', '3994', '3997', '3998', '3999', '4001', '4002', '8888', '000399'];
    $('#zoom').find('.odd, .even').each(function(idx, val) {
        var tdData = $(this).find('td').map(function() {
            return $(this).text().trim();
        }).toArray();
        var ret = {};
        for (var i = 0; i < 6; i++) {
            ret[ key[i] ] = tdData[i];
        };
        if (ret['symbol_id'] === '4527'){ ret['aliases'] = '堃霖'; }
        if (_.includes(ignoreIds, ret['symbol_id'])){ return; }

        ret['market'] = markets[ret['market']];

        // set aliases
        ret['aliases'] = ret['aliases'].replace(/\n(\.|-$|N$|NA$|無|未變更|變更|不適用|適用)/g, '');
        ret['aliases'] = ret['aliases'].split('\n');
        if (!_.isEmpty(ret['fullname'])) {
            ret['aliases'].push(ret['fullname']);
        }
        ret['aliases'] = _.uniq(ret['aliases']);
        ret['aliases'] = ret['aliases'].map(function(name) {
            return name.replace(/(金融股份有限公司|國際股份有限公司|工業股份有限公司|企業股份有限公司|半導體公司|台灣分公司|股份有限公司|控股有限公司|有限公司|\(股\)公司)|\(控股\)/, ''); 
        }).filter(function(name) {
            return name !== '' && name !== '0';
        });

        delete(ret['fullname']);

        // set on_date & off_date
        var matches = ret['desc'].match(/(上市|上櫃|公開發行|興櫃)日期：([\d-\/]+)((下市|下櫃|撤銷公開發行)日期：([\d-\/]+))?/);
        ret['on_date'] = matches ? getDateFromDesc(matches[2]) : null;
        ret['off_date'] = matches ? getDateFromDesc(matches[5]) : null;
        ret['category'] = 'stock';
        delete(ret['desc']);

        companyData.push(ret);
    });
    return companyData;
}
