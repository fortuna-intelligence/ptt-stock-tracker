var moment = require('moment');
var Promise = require('bluebird');
var _ = require('lodash');
var mongoose = require('mongoose');

var etfCrawler = require('./etf');
var mopsCrawler = require('./mops');
var isinCrawler = require('./isin');
var indices = require('../indices');

module.exports.mongoose = mongoose;
module.exports.moment = moment;
module.exports.bluebird = Promise;
module.exports.lodash = _;

var config = require('../config');
var connString = (config.db.user && config.db.password) ? 
    `mongodb://${config.db.user}:${config.db.password}@${config.db.url}/fugle_ptt` :
    `mongodb://${config.db.url}/fugle_ptt`;
var connection = mongoose.createConnection(connString, config.db.options);
var Symbol = connection.model('Symbol', require('../../schemas/symbol'));

console.log('start crawl symbol...');
Promise.resolve().then(function() {
    var ret = indices;
    // combine twse indices, stock(from mops), etf
    return Promise.reduce([mopsCrawler.crawlBasic(), etfCrawler.crawlBasic()], function(total, idv) {
        return total.concat(idv);
    }, ret);
}).then(function(mopsDataList) {
    return isinCrawler.crawlIsin().each(function(isinData) {
        var mopsDataIdx = _.findIndex(mopsDataList, function(mopsData) { return mopsData.symbol_id === isinData.symbol_id; });
        if (mopsDataIdx > 0) {
            mopsDataList[mopsDataIdx] = _.defaults(mopsDataList[mopsDataIdx], _.pick(isinData, 'name', 'market', 'industry', 'on_date', 'off_date'));
            mopsDataList[mopsDataIdx].aliases = _.without(mopsDataList[mopsDataIdx].aliases, isinData.name);
        } else {
            mopsDataList.push(isinData);
        }
    }).then(function() {
        return mopsDataList.map(function(mopsData) {
            // ensure we get valid values of fields
            if (!mopsData.aliases) { mopsData.aliases = []; }
            if (!mopsData.name && mopsData.aliases.length > 0) {
                mopsData.name = mopsData.aliases[0];
                mopsData.aliases.shift();
            }
            return mopsData;
        });
    });
}).map(function(data) {
    return Symbol.updateData(data).catch(function(error) {
        console.log(error);
    });
}).catch(function(err) {
    console.error(err);
}).done(function() {
    console.log('done.');
    mongoose.disconnect();
});
