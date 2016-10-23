/*
    This is a time scheduler for crawler,
    - promise based
    - with logger
    - ....
 */
var _ = require('lodash');
var moment = require('moment');
var Promise = require("bluebird");

function TimeScheduler(in_options){
    var option = _.extend({
        start: moment('20070101','YYYYMMDD'),
        end: moment(),
        step : function(momentDate){  return momentDate.add(1, 'months')},
        work : function(){ return Promise.delay(1) },
        taskName : 'Loop',
        finalCallback : function(){}
    },in_options);

    function loop(current,end){
        if(current <= end) {
            console.log("NOW:"+current.format('YYYYMMDD')+ " END:"+end.format('YYYYMMDD'));
            return option.work(current)
            .then(function(){
                current = option.step(current);
                return loop(current, end);
            })
        }else{
            console.log(option.taskName + ' done');
            return Promise.resolve();
        }
    }
    function start(){
        console.log(option.taskName + ' start');
        return loop(option.start, option.end).then(function(){
            option.finalCallback()
        })
    }
    return {start:start}
}
module.exports = TimeScheduler;
