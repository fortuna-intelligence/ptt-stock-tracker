var express = require('express');
var router = express.Router();
var moment = require('moment');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports.mongoose = mongoose;
module.exports.moment = moment;
module.exports.bluebird = Promise;
module.exports.lodash = _;

var config = require('../config');
var connString = (config.db.user && config.db.password) ? 
    `mongodb://${config.db.user}:${config.db.password}@${config.db.url}/fugle_ptt` :
    `mongodb://${config.db.url}/fugle_ptt`;
var connection = mongoose.createConnection(connString, config.db.options);
var Ptt = connection.model('Ptt', require('../../schemas/ptt'));
var Symbol = connection.model('Symbol', require('../../schemas/symbol'));
var Price = connection.model('Price', require('../../schemas/price'));

function mergeInfo(post) {
    var days = 30;
    return Symbol.getName(post.symbol_id).then(function(symbol) {
        post.symbol_name = symbol.name;
    }).then(function() {
        return Price.get(post.symbol_id, post.timestamp, days);
    }).then(function(prices) {
        post.prices = prices;
        return post;
    });
}

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/latest', function(req, res, next) {
    var page = +req.query.page || 0;
    var size = +req.query.size || 20;
    Ptt.getLatest(page, size).map(function(post) {
        return mergeInfo(post);
    }).then(function(posts) {
        res.json(posts);
    });
});

router.get('/user', function(req, res, next) {
    var userId = req.query.user_id;
    var page = +req.query.page || 0;
    var size = +req.query.size || 20;
    if (!userId) {
        res.json([]);
    } else {
        Ptt.getByUser(userId, page, size).map(function(post) {
            return mergeInfo(post);
        }).then(function(posts) {
            res.json(posts);
        });
    }
});

router.get('/ranking', function(req, res, next) {
    var page = +req.query.page || 0;
    var size = +req.query.size || 20;
    Ptt.getByPerformance(page, size).map(function(post) {
        return mergeInfo(post);
    }).then(function(posts) {
        res.json(posts);
    });
});

router.get('/symbol', function(req, res, next) {
    var symbolId = req.query.symbol_id;
    var page = +req.query.page || 0;
    var size = +req.query.size || 20;
    if (!symbolId) {
        res.json([]);
    } else {
        Ptt.getBySymbol(symbolId, page, size).map(function(post) {
            return mergeInfo(post);
        }).then(function(posts) {
            res.json(posts);
        });
    }
});

module.exports = router;
