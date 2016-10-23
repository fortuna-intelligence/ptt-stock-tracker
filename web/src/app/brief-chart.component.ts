import { Component, OnInit, Input } from '@angular/core';
import { nvD3 } from './ng2-nvd3';
declare let d3: any;

@Component({
    selector: 'my-brief-chart',
    template: `
        <div>
            <nvd3 [options]="options" [data]="data"></nvd3>
        </div>
    `
})

export class BriefChartComponent implements OnInit {

    @Input()
    rawData;

    data;
    options;

    ngOnInit() {
        this.options = {
            chart: {
                type: 'lineChart',
                width: 400,
                height: 80,
                margin: {
                    top: 5,
                    right: 20,
                    bottom: 20,
                    left: 35
                },
                x: function (d) { return new Date(d.date); },
                y: function (d) { return d.price; },
                showValues: true,
                showLegend: false,
                valueFormat: function (d) {
                    return d3.format(',.2f')(d);
                },
                duration: 500,
                xAxis: {
                    axisLabel: '',
                    tickFormat: function(d) {
                        return d3.time.format('%m/%d')(new Date(d));
                    }
                },
                yAxis: {
                    axisLabel: '',
                    axisLabelDistance: -10,
                    tickFormat: function(d) {
                        return Number(d).toFixed(1);
                    },
                }
            }
        }
        this.data = [
            {
                key: "",
                values: this.rawData
            }
        ];
    }

}
