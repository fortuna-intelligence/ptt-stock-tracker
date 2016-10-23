var mongoose = module.parent.exports.mongoose;
var moment = module.parent.exports.moment;
var _ = module.parent.exports.lodash;
var Promise = module.parent.exports.bluebird;
var Schema = mongoose.Schema;

var SymbolInfo = new Schema({
    symbol_id: {type: String},
    name: {type: String},
    aliases: [{type: String}],
    market: {type: String},
    industry: {type: String},
    on_date: {type: Date},
    off_date: {type: Date},
}, { collection : 'symbol'});

SymbolInfo.index({ symbol_id: 1 }, { unique: true });
SymbolInfo.index({ market: 1 });
SymbolInfo.index({ industry: 1 });

SymbolInfo.statics = {

    getName: function(symbolId) {
        return Promise.resolve(
            this.findOne({
                symbol_id: symbolId
            }, {
                _id: 0,
                name: 1
            }).lean().exec()
        );
    },

    updateData: function(data) {
        return Promise.resolve(
            this.update({
                symbol_id: data.symbol_id,
            }, {
                $set: {
                    name: data.name,
                    market: data.market,
                    industry: data.industry,
                    on_data: data.on_date,
                    off_data: data.off_date
                },
                $addToSet: {
                    aliases: {
                        $each: data.aliases
                    }
                }
            }, { upsert: true }).exec()
        );
    }

};

module.exports = SymbolInfo;
