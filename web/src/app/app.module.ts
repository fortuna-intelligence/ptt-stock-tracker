import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { nvD3 } from './ng2-nvd3';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard.component';
import { BriefChartComponent } from './brief-chart.component';
import { TrackService } from './services/track.service';
import { routing } from './app.routing';

import './rxjs-extensions';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        routing
    ],
    declarations: [
        nvD3,
        AppComponent,
        BriefChartComponent,
        DashboardComponent,
    ],
    providers: [
        TrackService,
    ],
    exports: [
        nvD3
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}
