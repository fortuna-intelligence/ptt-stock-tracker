import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { environment } from '../../environments/environment';
import { Track } from '../models/track.model';
import { TRACKS } from './mock-tracks';

@Injectable()
export class TrackService {

    constructor(private http: Http) { }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }

    getLatestTracks(page: number, size: number): Promise<Track[]> {
        var url = `${environment.apiHost}/latest?page=${page}&size=${size}`;
        return this.http.get(url).toPromise().then((response) => {
            return response.json() as Track[];
        }).catch((error) => {
            this.handleError(error);
        });
    }

    getUserTracks(userId: string, page: number, size: number): Promise<Track[]> {
        var url = `${environment.apiHost}/user?user_id=${userId}&page=${page}&size=${size}`;
        return this.http.get(url).toPromise().then((response) => {
            return response.json() as Track[];
        }).catch((error) => {
            this.handleError(error);
        });
    }

    getRankingTracks(page: number, size: number): Promise<Track[]> {
        var url = `${environment.apiHost}/ranking?page=${page}&size=${size}`;
        return this.http.get(url).toPromise().then((response) => {
            return response.json() as Track[];
        }).catch((error) => {
            this.handleError(error);
        });
    }

    getSymbolTracks(symbolId: string, page: number, size: number): Promise<Track[]> {
        var url = `${environment.apiHost}/symbol?symbol_id=${symbolId}&page=${page}&size=${size}`;
        return this.http.get(url).toPromise().then((response) => {
            return response.json() as Track[];
        }).catch((error) => {
            this.handleError(error);
        });
    }

}
