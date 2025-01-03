/**
 * data.service
 *
 * Time Tracker Copyright (C) 2023-2025 Wojciech Polak
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { DbService } from './db.service';
import { LastTime, Stopwatch } from '../models';
import { selectAllLastTimeList, selectLastTimeLoading, LastTimeActions } from '../store/last-time';
import { selectAllStopwatches, selectStopwatchesLoading, StopwatchActions } from '../store/stopwatch';


@Injectable({
    providedIn: 'root'
})
export class DataService {

    isOnline: boolean = window.navigator.onLine;
    lastTimeLoading$: Observable<boolean>;
    lastTimeList$: Observable<LastTime[]>;
    stopwatchesLoading$: Observable<boolean>;
    stopwatches$: Observable<Stopwatch[]>;

    constructor(private store: Store,
                private dbService: DbService,
                private snackBar: MatSnackBar) {

        this.lastTimeList$ = this.store.select(selectAllLastTimeList);
        this.lastTimeLoading$ = this.store.select(selectLastTimeLoading);
        this.stopwatches$ = this.store.select(selectAllStopwatches);
        this.stopwatchesLoading$ = this.store.select(selectStopwatchesLoading);
        this.init();
    }

    init() {
        this.dbService.onDbChange
            .pipe(debounceTime(500))
            .subscribe(() => {
                this.syncChanges();
            });

        this.dbService.onRemoteDbError
            .pipe(debounceTime(500))
            .subscribe((err: any) => {
                this.dbService.remoteSyncDisable();
                let msg = `Remote DB: ${err.status} - ${err.message}`;
                this.snackBar.open(msg, 'Dismiss');
                this.fetchAll();
            });

        this.fetchAll();
    }

    fetchAll() {
        this.fetchLastTime();
        this.fetchStopwatchList();
    }

    fetchLastTime() {
        this.store.dispatch(LastTimeActions.loadLastTimeList());
    }

    fetchStopwatchList() {
        this.store.dispatch(StopwatchActions.loadStopwatches());
    }

    syncChanges() {
        if (!this.dbService.isSyncActive) {
            this.fetchAll();
        }
    }
}
