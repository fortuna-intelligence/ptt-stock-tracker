import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';

import { TrackService } from './services/track.service';
import { Track } from './models/track.model';

@Component({
    selector: 'my-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

    page;
    size;
    userId;
    symbolId;
    subscription;
    ranking;
    noMoreData = false;
    tracks: void | Track[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private trackService: TrackService) {
    }

    ngOnInit(): void {
        this.subscription = this.route.queryParams.subscribe(params => {
            // clean up
            this.tracks = [];
            this.noMoreData = false;
            this.page = params['page'] || 0;
            this.size = params['size'] || 20;
            this.userId = params['user_id'];
            this.symbolId = params['symbol_id'];
            this.ranking = params['ranking'] || false;
            if (this.userId) {
                this.trackService.getUserTracks(this.userId, this.page, this.size).then((tracks) => {
                    //console.log(tracks);
                    this.tracks = tracks;
                    if (!this.tracks || !this.tracks.length) {
                      this.noMoreData = true;
                    }
                });
            } else if (this.symbolId) {
                this.trackService.getSymbolTracks(this.symbolId, this.page, this.size).then((tracks) => {
                    //console.log(tracks);
                    this.tracks = tracks;
                    if (!this.tracks || !this.tracks.length) {
                      this.noMoreData = true;
                    }
                });
            } else if (this.ranking) {
                this.trackService.getRankingTracks(this.page, this.size).then((tracks) => {
                    //console.log(tracks);
                    this.tracks = tracks;
                    if (!this.tracks || !this.tracks.length) {
                      this.noMoreData = true;
                    }
                });
            } else {
                this.trackService.getLatestTracks(this.page, this.size).then((tracks) => {
                    //console.log(tracks);
                    this.tracks = tracks;
                    if (!this.tracks || !this.tracks.length) {
                      this.noMoreData = true;
                    }
                });
            }
        });
    }

    prevPage(): void {
        var queryParams = {
            page: +this.page-1,
            size: +this.size
        };
        if (this.userId) { queryParams['user_id'] = this.userId; }
        if (this.symbolId) { queryParams['symbol_id'] = this.symbolId; }
        if (this.ranking) { queryParams['ranking'] = this.ranking; }
        this.router.navigate(['/dashboard'], {
            queryParams: queryParams
        });
    }

    nextPage(): void {
        var queryParams = {
            page: +this.page+1,
            size: +this.size
        };
        if (this.userId) { queryParams['user_id'] = this.userId; }
        if (this.symbolId) { queryParams['symbol_id'] = this.symbolId; }
        if (this.ranking) { queryParams['ranking'] = this.ranking; }
        this.router.navigate(['/dashboard'], {
            queryParams: queryParams
        });
    }

}

