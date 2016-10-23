"use strict";
exports.TRACKS = [
    {
        user_id: 'test',
        timestamp: new Date(),
        symbol_id: '2330',
        symbol_name: '台積電',
        content: '應該買進...',
        url: 'http://www.google.com',
        prices: [
            { date: new Date(2016, 1, 1), price: 100 },
            { date: new Date(2016, 1, 2), price: 110 },
            { date: new Date(2016, 1, 3), price: 120 },
            { date: new Date(2016, 1, 4), price: 130 },
            { date: new Date(2016, 1, 5), price: 140 },
        ],
        performance: 1
    },
    {
        user_id: 'test 2',
        timestamp: new Date(),
        symbol_id: '2412',
        symbol_name: '中華電',
        content: '應該賣出...',
        url: 'http://www.fugle.tw',
        prices: [
            { date: new Date(2016, 1, 1), price: 200 },
            { date: new Date(2016, 1, 2), price: 210 },
            { date: new Date(2016, 1, 3), price: 220 },
            { date: new Date(2016, 1, 4), price: 230 },
            { date: new Date(2016, 1, 5), price: 240 },
        ],
        performance: 1
    },
    {
        user_id: 'test 3',
        timestamp: new Date(),
        symbol_id: '1101',
        symbol_name: '台泥',
        content: '應該買進500...',
        url: 'http://www.google.com',
        prices: [
            { date: new Date(2016, 1, 1), price: 300 },
            { date: new Date(2016, 1, 2), price: 310 },
            { date: new Date(2016, 1, 3), price: 320 },
            { date: new Date(2016, 1, 4), price: 330 },
            { date: new Date(2016, 1, 5), price: 310 },
        ],
        performance: 1
    },
];
//# sourceMappingURL=mock-tracks.js.map