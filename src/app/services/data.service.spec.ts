/**
 * data.service.spec
 *
 * Time Tracker Copyright (C) 2026 Wojciech Polak
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

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import { LastTime, Stopwatch, Types } from '../models';
import { LastTimeStore } from '../store/last-time.store';
import { StopwatchStore } from '../store/stopwatch.store';
import { DbService } from './db.service';
import { DataService } from './data.service';

describe('DataService', () => {
    let service: DataService;
    let onDbChange: Subject<void>;
    let onRemoteDbError: Subject<unknown>;
    let dbService: {
        dbLoaded: Promise<void>;
        onDbChange: Subject<void>;
        onRemoteDbError: Subject<unknown>;
        isSyncActive: boolean;
        remoteSyncDisable: jasmine.Spy;
    };
    let snackBar: jasmine.SpyObj<MatSnackBar>;
    let lastTimeStore: {
        loading: ReturnType<typeof signal<boolean>>;
        loadingAll: ReturnType<typeof signal<boolean>>;
        lastTimeList: ReturnType<typeof signal<LastTime[]>>;
        loadLastTimeList: jasmine.Spy;
    };
    let stopwatchStore: {
        loading: ReturnType<typeof signal<boolean>>;
        loadingAll: ReturnType<typeof signal<boolean>>;
        stopwatches: ReturnType<typeof signal<Stopwatch[]>>;
        loadStopwatches: jasmine.Spy;
    };

    beforeEach(() => {
        onDbChange = new Subject<void>();
        onRemoteDbError = new Subject<unknown>();
        dbService = {
            dbLoaded: Promise.resolve(),
            onDbChange,
            onRemoteDbError,
            isSyncActive: false,
            remoteSyncDisable: jasmine.createSpy('remoteSyncDisable'),
        };
        snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
        lastTimeStore = {
            loading: signal(false),
            loadingAll: signal(false),
            lastTimeList: signal([
                {
                    _id: 'LT-1',
                    type: Types.LAST_TIME,
                    name: 'Last time',
                    timestamps: [],
                    hasMoreTs: false,
                }
            ]),
            loadLastTimeList: jasmine.createSpy('loadLastTimeList'),
        };
        stopwatchStore = {
            loading: signal(false),
            loadingAll: signal(false),
            stopwatches: signal([
                {
                    _id: 'SW-1',
                    type: Types.STOPWATCH,
                    name: 'Stopwatch',
                    events: [],
                }
            ]),
            loadStopwatches: jasmine.createSpy('loadStopwatches'),
        };

        TestBed.configureTestingModule({
            providers: [
                DataService,
                {provide: DbService, useValue: dbService},
                {provide: MatSnackBar, useValue: snackBar},
                {provide: LastTimeStore, useValue: lastTimeStore},
                {provide: StopwatchStore, useValue: stopwatchStore},
            ],
        });

        service = TestBed.inject(DataService);
    });

    it('exposes loading signals from the stores and tracks the online flag', () => {
        expect(service.lastTimeLoading()).toBeFalse();
        expect(service.stopwatchesLoading()).toBeFalse();
        expect(service.lastTimeList()[0]?._id).toBe('LT-1');
        expect(service.stopwatches()[0]?._id).toBe('SW-1');
        expect(service.isOnline).toBe(window.navigator.onLine);
    });

    it('emits db readiness from false to true', async () => {
        const values: boolean[] = [];
        const subscription = service.dbLoaded$.subscribe(value => values.push(value));

        await service.dbLoaded;

        expect(values).toEqual([false, true]);
        subscription.unsubscribe();
    });

    it('fetches both lists through the stores', () => {
        service.fetchAll();
        service.fetchLastTime();
        service.fetchStopwatchList();

        expect(lastTimeStore.loadLastTimeList).toHaveBeenCalledTimes(2);
        expect(stopwatchStore.loadStopwatches).toHaveBeenCalledTimes(2);
    });

    it('refreshes data on database changes only when sync is inactive', () => {
        const fetchAllSpy = spyOn(service, 'fetchAll');

        service.syncChanges();
        expect(fetchAllSpy).toHaveBeenCalledTimes(1);

        fetchAllSpy.calls.reset();
        dbService.isSyncActive = true;
        service.syncChanges();

        expect(fetchAllSpy).not.toHaveBeenCalled();
    });

    it('subscribes to database change notifications', () => {
        const syncSpy = spyOn(service, 'syncChanges');

        onDbChange.next();

        expect(syncSpy).toHaveBeenCalled();
    });

    it('disables remote sync, shows a snack bar, and refetches on debounced remote errors', async () => {
        const fetchAllSpy = spyOn(service, 'fetchAll');

        onRemoteDbError.next({status: 401, message: 'Unauthorized'});
        await new Promise(resolve => window.setTimeout(resolve, 550));

        expect(dbService.remoteSyncDisable).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith('Remote DB: 401 - Unauthorized', 'Dismiss');
        expect(fetchAllSpy).toHaveBeenCalled();
    });
});
