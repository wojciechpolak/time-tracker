/**
 * data.service
 *
 * Time Tracker Copyright (C) 2023 Wojciech Polak
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

import { EventEmitter, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';

import { DbService } from './db.service';
import { LastTimeService } from '../last-time/last-time.service';
import { RefreshType } from '../models';
import { SettingsService } from '../settings/settings.service';
import { StopwatchService } from '../stopwatch/stopwatch.service';


@Injectable({
    providedIn: 'root'
})
export class DataService {

    isOnline: boolean = window.navigator.onLine;
    onRefresh: EventEmitter<RefreshType> = new EventEmitter();

    constructor(private dbService: DbService,
                private lastTimeService: LastTimeService,
                private stopwatchService: StopwatchService,
                private snackBar: MatSnackBar,
                private settingsService: SettingsService) {

        this.init();
    }

    init() {
        this.dbService.onDbChange
            .pipe(debounceTime(500))
            .subscribe((info: any) => {
                this.showChanges(info);
            });

        this.dbService.onRemoteDbError
            .pipe(debounceTime(500))
            .subscribe((err: any) => {
                this.dbService.remoteSyncDisable();
                let msg = `Remote DB: ${err.status} - ${err.message}`;
                this.snackBar.open(msg, 'Dismiss');
                this.fetchAll();
            });

        if (!this.settingsService.hasEnabledRemoteSync() || !this.isOnline) {
            this.fetchAll();
        }
    }

    async fetchAll(): Promise<void> {
        await this.lastTimeService.fetchLastTime();
        await this.stopwatchService.fetchStopwatchList();
        this.onRefresh.emit(RefreshType.ALL);
    }

    async fetchLastTime(): Promise<void> {
        await this.lastTimeService.fetchLastTime();
        this.onRefresh.emit(RefreshType.LT);
    }

    async fetchStopwatchList(): Promise<void> {
        await this.stopwatchService.fetchStopwatchList();
        this.onRefresh.emit(RefreshType.SW);
    }

    async showChanges(info: any): Promise<void> {
        if (!this.dbService.isSyncActive) {
            if (info?.id?.startsWith('LT')) {
                await this.fetchLastTime()
            }
            else if (info?.id?.startsWith('SW')) {
                await this.fetchStopwatchList();
            }
            else {
                await this.fetchAll();
            }
        }
    }
}
