var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var request = require('request-promise');

function parseData(data, momentDate) {
    const fields = ['symbol_id', 'volume', 'turnover', 'amount', 'open', 'high', 'low', 'close', 'sign', 'change'];
    return data.map((row) => {
        const newRow = row.filter((val, idx) => {
            return idx < 11 && idx !== 1;
        })
        .map((el) => {
            return el.replace(/,/g, '').trim();
        });
//        console.log(newRow);
        const obj = _.zipObject(fields, newRow);
        obj.date = momentDate.toDate();
        obj.volume = isNaN(+obj.volume) ? 0 : +obj.volume;
        obj.amount = isNaN(+obj.amount) ? 0 : +obj.amount;
        obj.turnover = isNaN(+obj.turnover) ? 0 : +obj.turnover;
        if (obj.sign === '<p style= color:green>-</p>') {
            obj.change = `-${obj.change}`;
        }
        return {
            symbol_id: obj.symbol_id,
            type: 'tse',
            tick: _.omit(obj, ['symbol_id', 'sign'])
        };
    })
    .filter((row) => {
        return row.symbol_id !== undefined;
    });
}

function crawl(momentDate) {
    const date = momentDate.format('YYYYMMDD');
    const currentTs = new Date().getTime();
    return request({
        url: `http://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&date=${date}&type=ALLBUT0999&_=${currentTs}`,
        method: 'GET',
        json: true,
    })
    .then((body) => {
        const { fields5, data5 } = body;
        if (!fields5 || !data5) {
            throw new Error('empty data');
        }
        if (fields5.length !== 16 ||
            fields5[0] !== '證券代號' ||
            fields5[1] !== '證券名稱' ||
            fields5[2] !== '成交股數' ||
            fields5[3] !== '成交筆數' ||
            fields5[4] !== '成交金額' ||
            fields5[5] !== '開盤價' ||
            fields5[6] !== '最高價' ||
            fields5[7] !== '最低價' ||
            fields5[8] !== '收盤價' ||
            fields5[9] !== '漲跌(+/-)' ||
            fields5[10] !== '漲跌價差' ||
            fields5[11] !== '最後揭示買價' ||
            fields5[12] !== '最後揭示買量' ||
            fields5[13] !== '最後揭示賣價' ||
            fields5[14] !== '最後揭示賣量' ||
            fields5[15] !== '本益比') {
            throw new Error('format changed');
        }
        return parseData(data5, momentDate);
    })
    .catch((err) => {
        console.log(err);
        return [];
    });
}

if (require.main === module) {
    crawl(moment().add(-1, 'days')).then(function(data){
        console.log(data);
    });
}

module.exports.crawl = crawl;
