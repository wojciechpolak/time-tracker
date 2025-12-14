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

import { inject, Injectable, Signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, from, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';

import { DbService } from './db.service';
import { LastTime, Stopwatch } from '../models';
import { LastTimeStore } from '../store/last-time.store';
import { StopwatchStore } from '../store/stopwatch.store';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private dbService = inject(DbService);
    private snackBar = inject(MatSnackBar);
    private lastTimeStore = inject(LastTimeStore);
    private stopwatchStore = inject(StopwatchStore);

    isOnline: boolean = window.navigator.onLine;
    dbLoaded$: Observable<boolean>;

    // LastTime Signals
    lastTimeLoading: Signal<boolean> = this.lastTimeStore.loading;
    lastTimeLoadingAll: Signal<boolean> = this.lastTimeStore.loadingAll;
    lastTimeList: Signal<LastTime[]> = this.lastTimeStore.lastTimeList;

    // Stopwatch Signals
    stopwatchesLoading: Signal<boolean> = this.stopwatchStore.loading;
    stopwatchesLoadingAll: Signal<boolean> = this.stopwatchStore.loadingAll;
    stopwatches: Signal<Stopwatch[]> = this.stopwatchStore.stopwatches;

    constructor() {
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
        this.lastTimeStore.loadLastTimeList();
    }

    fetchStopwatchList() {
        this.stopwatchStore.loadStopwatches();
    }

    syncChanges() {
        if (!this.dbService.isSyncActive) {
            this.fetchAll();
        }
    }
}
