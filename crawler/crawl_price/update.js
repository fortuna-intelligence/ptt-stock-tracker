var moment = require('moment');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var _ = require('lodash');

var TseCrawler = require('./tse');
var OtcCrawler = require('./otc');
var EmgCrawler = require('./emg');
var TimeScheduler = require('../scheduler');

module.exports.mongoose = mongoose;
module.exports.moment = moment;
module.exports.bluebird = Promise;
module.exports.lodash = _;

var config = require('../config');
var connString = (config.db.user && config.db.password) ? 
    `mongodb://${config.db.user}:${config.db.password}@${config.db.url}/fugle_ptt` :
    `mongodb://${config.db.url}/fugle_ptt`;
var connection = mongoose.createConnection(connString, config.db.options);
var Price = connection.model('Price', require('../../schemas/price'));
var Ptt = connection.model('Ptt', require('../../schemas/ptt'));

function crawlerWork(momentDate) {
    return Promise.all([
        getStockTicks(TseCrawler, momentDate),
        getStockTicks(OtcCrawler, momentDate),
        getStockTicks(EmgCrawler, momentDate)
    ]).then(function() {
        return Ptt.getByTime(momentDate.clone().add(-90, 'days'), momentDate.clone().add(-1, 'days'));
    }).each(function(article) {
        return Price.calPerformances(article.symbol_id, moment(article.timestamp), momentDate).then(function(p) {
            return Ptt.setPerformances(article, p);
        });
    });
}

function getStockTicks(crawler, momentDate) {
    return crawler.crawl(momentDate).map(function(data) {
        return Price.updateData(data);
    }).catch(function(error) {
        console.log(error);
        return;
    });
};

// default to crawl 3 days data
// * if no specified date: crawl from today-2 ~ today
// * if start date is specified: crawl only that date
// * if start/end are specified: crawl from start ~ end
var today = moment().format('YYYYMMDD');
var date_start = (process.argv.length > 2)? moment(process.argv[2], "YYYYMMDD") : moment(today, 'YYYYMMDD').add(-2, 'd');
var date_end = (process.argv.length > 3)? moment(process.argv[3], "YYYYMMDD") : ( (process.argv.length > 2)? date_start.clone() : moment(today, 'YYYYMMDD') );
var scheduler = new TimeScheduler({
    taskName : 'Stock Price',
    start:  date_start,
    end:    date_end,
    step :  function(momentDate) {  return momentDate.add(1, 'days'); },
    work :  crawlerWork
});

console.log('start...');
scheduler.start().done(function() {
    console.log('done.');
    mongoose.disconnect();
});

