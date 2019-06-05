var mongoose = module.parent.exports.mongoose;
var moment = module.parent.exports.moment;
var _ = module.parent.exports.lodash;
var Promise = module.parent.exports.bluebird;
var Schema = mongoose.Schema;

var StockSchema = new Schema({
    symbol_id   : { type: String },
    date        : { type: Date },
    volume      : { type: Number },  // 成交量 (成交股數)
    amount      : { type: Number },  // 成交金額
    open        : { type: Number },
    high        : { type: Number },
    low         : { type: Number },
    close       : { type: Number },
    change      : { type: Number },  // 漲跌價
    change_rate : { type: Number },  // 漲跌幅
    turnover    : { type: Number },  // 成交筆數
}, {     
    versionKey: false,
    collection : 'price' 
});

StockSchema.index({ symbol_id: 1, date: -1 }, {unique: true});
StockSchema.index({ date: -1 });

StockSchema.statics = {

    get: function(symbolId, startDate, days) {
        var endDate = moment(startDate).add(days, 'days');
        return Promise.resolve(
            this.find({
                symbol_id: symbolId,
                date: {
                    $gt: startDate,
                    $lt: endDate
                }
            }, {
                _id: 0,
                date: 1,
                close: 1
            }).sort({
                date: 1
            }).lean().exec()
        ).map(function(row) {
            row.price = row.close;
            delete row.close;
            return row;
        });
    },

    calPerformances: function(symbolId, startDate, endDate) {
        var startPromise = Promise.resolve(
            this.find({
                symbol_id: symbolId,
                date: {
                    $lte: startDate.toDate()
                }
            }, {
                _id: 0,
                close: 1
            }).sort({ date: -1 }).limit(1).lean().exec()
        );
        var endPromise = Promise.resolve(
            this.find({
                symbol_id: symbolId,
                date: {
                    $lte: endDate.toDate()
                }
            }, {
                _id: 0,
                close: 1
            }).sort({ date: -1 }).limit(1).lean().exec()
        );

        return Promise.all([startPromise, endPromise]).then(function(prices) {
            var ret = {};
            var startPrice = prices[0].length ? prices[0][0].close : 0;
            var endPrice = prices[1].length ? prices[1][0].close : 0;
            var p = startPrice > 0 ? ((endPrice - startPrice) / startPrice) : 0; 
            if (endDate.diff(startDate, 'days') <= 30) {
                ret['performances.days30'] = p;
            } else if (endDate.diff(startDate, 'days') <= 90) {
                ret['performances.days90'] = p;
            }
            return ret;
        });
    },

    updateData: function(tick) {
        return Promise.resolve(
            this.updateOne({
                symbol_id: tick.symbol_id,
                date: tick.date
            }, tick, { upsert: true }).exec()
        );
    }

}

module.exports = StockSchema;
