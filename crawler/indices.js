var _ = require('lodash');
var fields = ['symbol_id', 'mis_id', 'category', 'industry', 'market', 'on_date', 'off_date', 'aliases', 'name'];
var vals = [
    ['Y9999', 'tse_t00.tw', 'index', '指數', 'tw.index', null, null, ['加權股價指數'],           '加權指數'],
    ['M1100', 'tse_t01.tw', 'index', '指數', 'tw.index', null, null, ['水泥指數'],               '水泥類指數'],
    ['M1200', 'tse_t02.tw', 'index', '指數', 'tw.index', null, null, ['食品指數'],               '食品類指數'],
    ['M1300', 'tse_t03.tw', 'index', '指數', 'tw.index', null, null, ['塑膠指數'],               '塑膠類指數'],
    ['M1400', 'tse_t04.tw', 'index', '指數', 'tw.index', null, null, ['紡織纖維指數'],           '紡織纖維類指數'],
    ['M1500', 'tse_t05.tw', 'index', '指數', 'tw.index', null, null, ['電機機械指數'],           '電機機械類指數'],
    ['M1600', 'tse_t06.tw', 'index', '指數', 'tw.index', null, null, ['電器電纜指數'],           '電器電纜類指數'],
    ['M1700', 'tse_t07.tw', 'index', '指數', 'tw.index', null, null, ['化學生技醫療指數'],       '化學生技醫療類指數'],
    ['M1721', 'tse_t21.tw', 'index', '指數', 'tw.index', null, null, ['化學指數'],               '化學類指數'],
    ['M1722', 'tse_t22.tw', 'index', '指數', 'tw.index', null, null, ['生技醫療指數'],           '生技醫療類指數'],
    ['M1800', 'tse_t08.tw', 'index', '指數', 'tw.index', null, null, ['玻璃陶瓷指數'],           '玻璃陶瓷類指數'],
    ['M1900', 'tse_t09.tw', 'index', '指數', 'tw.index', null, null, ['造紙指數'],               '造紙類指數'],
    ['M2000', 'tse_t10.tw', 'index', '指數', 'tw.index', null, null, ['鋼鐵指數'],               '鋼鐵類指數'],
    ['M2100', 'tse_t11.tw', 'index', '指數', 'tw.index', null, null, ['橡膠指數'],               '橡膠類指數'],
    ['M2200', 'tse_t12.tw', 'index', '指數', 'tw.index', null, null, ['汽車指數'],               '汽車類指數'],
    ['M2300', 'tse_t13.tw', 'index', '指數', 'tw.index', null, null, ['電子指數'],               '電子類指數'],
    ['M2324', 'tse_t24.tw', 'index', '指數', 'tw.index', null, null, ['半導體指數'],             '半導體類指數'],
    ['M2325', 'tse_t25.tw', 'index', '指數', 'tw.index', null, null, ['電腦及週邊設備指數'],     '電腦及週邊設備類指數'],
    ['M2326', 'tse_t26.tw', 'index', '指數', 'tw.index', null, null, ['光電指數'],               '光電類指數'],
    ['M2327', 'tse_t27.tw', 'index', '指數', 'tw.index', null, null, ['通信網路指數'],           '通信網路類指數'],
    ['M2328', 'tse_t28.tw', 'index', '指數', 'tw.index', null, null, ['電子零組件指數'],         '電子零組件類指數'],
    ['M2329', 'tse_t29.tw', 'index', '指數', 'tw.index', null, null, ['電子通路指數'],           '電子通路類指數'],
    ['M2330', 'tse_t30.tw', 'index', '指數', 'tw.index', null, null, ['資訊服務指數'],           '資訊服務類指數'],
    ['M2331', 'tse_t31.tw', 'index', '指數', 'tw.index', null, null, ['其他電子指數'],           '其他電子類指數'],
    ['M2500', 'tse_t14.tw', 'index', '指數', 'tw.index', null, null, ['建材營造指數'],           '建材營造類指數'],
    ['M2600', 'tse_t15.tw', 'index', '指數', 'tw.index', null, null, ['航運指數'],               '航運業類指數'],
    ['M2700', 'tse_t16.tw', 'index', '指數', 'tw.index', null, null, ['觀光指數'],               '觀光事業類指數'],
    ['M2800', 'tse_t17.tw', 'index', '指數', 'tw.index', null, null, ['金融保險指數'],           '金融保險類指數'],
    ['M2900', 'tse_t18.tw', 'index', '指數', 'tw.index', null, null, ['貿易百貨指數'],           '貿易百貨類指數'],
    ['M9700', 'tse_t23.tw', 'index', '指數', 'tw.index', null, null, ['油電燃氣指數'],           '油電燃氣類指數'],
    ['M9900', 'tse_t20.tw', 'index', '指數', 'tw.index', null, null, ['其他類指數'],             '其他類指數']
];

var indices =  _.map(vals, function(val){
    return _.zipObject(fields, val);
});

module.exports = indices;

