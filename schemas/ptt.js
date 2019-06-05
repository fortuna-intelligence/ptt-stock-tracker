var mongoose = module.parent.exports.mongoose;
var moment = module.parent.exports.moment;
var _ = module.parent.exports.lodash;
var Promise = module.parent.exports.bluebird;
var Schema = mongoose.Schema;

var commentSchema = new Schema({
    expression: { type: String },
    user_id: { type: String },
    words: { type: String },
    timestamp: { type: Date },
}, { _id : false });

var PttSchema = new Schema({
    article_id: { type: String },
    user_id: { type: String },
    user_name: { type: String },
    title: { type: String },
    timestamp: { type: Date },
    board: { type: String },
    url: { type: String },
    ip: { type: String },
    content: { type: String },
    comments: [commentSchema],
    symbol_ids: [{ type: String }],
    performances: {
        days30: { type: Number },
        days90: { type: Number },
    }
},  {
    collection : 'ptt',
});

PttSchema.index({ article_id: 1 }, { unique: true });
PttSchema.index({ user_id: -1 });
PttSchema.index({ timestamp: -1 });
PttSchema.index({ board: -1 });
PttSchema.index({ ip: -1 });
PttSchema.index({ symbol_ids: -1 });
PttSchema.index({ 'performances.days30': -1 });
PttSchema.index({ 'performances.days90': -1 });

function filterPost(post) {
    post.symbol_id = post.symbol_ids[0];
    post.content = post.content.replace(/[-]{10,}(.|\n)+[-]{10,}/, '');
    post.content = post.content.slice(0, 150);
    if (!post.performances) { post.performances = {}; }
    delete post.symbol_ids;
    return post;
}

PttSchema.statics = {

    getLatest: function(page, size) {
        var skip = page * size;
        return Promise.resolve(
            this.find({
                symbol_ids: { $size: 1 }
            }, {
                _id: 0,
                user_id: 1,
                user_name: 1,
                title: 1,
                timestamp: 1,
                url: 1,
                content: 1,
                symbol_ids: 1,
                performances: 1
            }).sort({ timestamp: -1 }).skip(skip).limit(size).lean().exec()
        ).map(function(post) {
            return filterPost(post);
        });
    },

    getByUser: function(userId, page, size) {
        var skip = page * size;
        return Promise.resolve(
            this.find({
                user_id: userId,
                symbol_ids: { $size: 1 }
            }, {
                _id: 0,
                user_id: 1,
                user_name: 1,
                title: 1,
                timestamp: 1,
                url: 1,
                content: 1,
                symbol_ids: 1,
                performances: 1
            }).sort({ timestamp: -1 }).skip(skip).limit(size).lean().exec()
        ).map(function(post) {
            return filterPost(post);
        });
    },

    getBySymbol: function(symbolId, page, size) {
        var skip = page * size;
        return Promise.resolve(
            this.find({
                $and: [
                    { symbol_ids: symbolId },
                    { symbol_ids: { $size: 1 } }
                ]
            }, {
                _id: 0,
                user_id: 1,
                user_name: 1,
                title: 1,
                timestamp: 1,
                url: 1,
                content: 1,
                symbol_ids: 1,
                performances: 1
            }).sort({ timestamp: -1 }).skip(skip).limit(size).lean().exec()
        ).map(function(post) {
            return filterPost(post);
        });
    },

    getByPerformance: function(page, size) {
        var skip = page * size;
        return Promise.resolve(
            this.find({
                symbol_ids: { $size: 1 }
            }, {
                _id: 0,
                user_id: 1,
                user_name: 1,
                title: 1,
                timestamp: 1,
                url: 1,
                content: 1,
                symbol_ids: 1,
                performances: 1
            }).sort({ 'performances.days30': -1 }).skip(skip).limit(size).lean().exec()
        ).map(function(post) {
            return filterPost(post);
        });
    },

    getByTime: function(startDate, endDate) {
        //console.log(startDate.toDate());
        //console.log(endDate.toDate());
        return Promise.resolve(
            this.find({
                timestamp: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                },
                symbol_ids: { $size: 1 }
            }, {
                article_id: 1,
                symbol_ids: 1,
                timestamp: 1,
                content: 1
            }).sort({ timestamp: 1 }).lean().exec()
        ).map(function(post) {
            return filterPost(post);
        });
    },

    setPerformances: function(article, performances) {
        return Promise.resolve(
            this.update({
                article_id: article.article_id
            }, {
                $set: performances
            }).exec()
        );
    },

    updateData: function(row) {
        var self = this;
        var match = {
            article_id: row.article_id
        };
        return Promise.resolve(
            this.updateOne(match, row, { upsert: true }).exec()
        ).then(function(response) {
            if (response.nModified !== 0 || response.upserted) {
                return self.updateOne(match, {
                    $set: { updated_at: new Date() }
                }).exec().then(function() {
                    return true;
                });
            } else {
                return false;
            }
        });
    },

};

module.exports = PttSchema;
