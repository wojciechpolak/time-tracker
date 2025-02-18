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
import { debounceTime, from, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { DbService } from './db.service';
import { LastTime, Stopwatch } from '../models';
import { selectAllLastTimeList, selectLastTimeLoading, selectLastTimeLoadingAll,
    LastTimeActions } from '../store/last-time';
import { selectAllStopwatches, selectStopwatchesLoading, selectStopwatchesLoadingAll,
    StopwatchActions } from '../store/stopwatch';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    isOnline: boolean = window.navigator.onLine;
    dbLoaded$: Observable<boolean>;
    lastTimeLoading$: Observable<boolean>;
    lastTimeLoadingAll$: Observable<boolean>;
    lastTimeList$: Observable<LastTime[]>;
    stopwatchesLoading$: Observable<boolean>;
    stopwatchesLoadingAll$: Observable<boolean>;
    stopwatches$: Observable<Stopwatch[]>;

    constructor(private store: Store,
                private dbService: DbService,
                private snackBar: MatSnackBar) {

        this.lastTimeList$ = this.store.select(selectAllLastTimeList);
        this.lastTimeLoading$ = this.store.select(selectLastTimeLoading);
        this.lastTimeLoadingAll$ = this.store.select(selectLastTimeLoadingAll);
        this.stopwatches$ = this.store.select(selectAllStopwatches);
        this.stopwatchesLoading$ = this.store.select(selectStopwatchesLoading);
        this.stopwatchesLoadingAll$ = this.store.select(selectStopwatchesLoadingAll);

        this.dbLoaded$ = from(this.dbService.dbLoaded).pipe(
            map(() => true),
            startWith(false)
        );

        this.init();
    }

    init() {
        this.dbService.onDbChange
            .subscribe(() => {
                this.syncChanges();
            });

        this.dbService.onRemoteDbError
            .pipe(debounceTime(500))
            .subscribe((err: unknown) => {
                this.dbService.remoteSyncDisable();
                // @ts-expect-error  PouchDB.Core.Error
                const msg = `Remote DB: ${err.status} - ${err.message}`;
                this.snackBar.open(msg, 'Dismiss');
                this.fetchAll();
            });
    }

    // Proxy the readiness promise
    get dbLoaded(): Promise<void> {
        return this.dbService.dbLoaded;
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
