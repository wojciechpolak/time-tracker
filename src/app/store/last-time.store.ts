/**
 * store/last-time.store
 *
 * Time Tracker Copyright (C) 2025 Wojciech Polak
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

import { inject } from '@angular/core';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, from } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { LastTime, TimeStamp } from '../models';
import { LastTimeService } from '../last-time/last-time.service';
import { environment } from '../../environments/environment';

const withDevtools = environment.storeWithDevTools;

export interface LastTimeState {
    lastTimeList: LastTime[];
    loading: boolean;
    loadingAll: boolean;
    loaded: boolean;
    error: unknown | null;
}

const initialState: LastTimeState = {
    lastTimeList: [],
    loading: false,
    loadingAll: false,
    loaded: false,
    error: null,
};

const Actions = {
    loadLastTimeList: 'loadLastTimeList',
    loadLastTime: 'loadLastTime',
    addLastTime: 'addLastTime',
    touchLastTime: 'touchLastTime',
    updateLastTimeTitle: 'updateLastTimeTitle',
    deleteLastTime: 'deleteLastTime',
    updateTimeStamp: 'updateTimeStamp',
    updateTimeStampLabel: 'updateTimeStampLabel',
    deleteTimeStamp: 'deleteTimeStamp',
} as const;

export const LastTimeStore = signalStore(
    {providedIn: 'root'},
    withDevtools('lastTime'),
    withState(initialState),
    withMethods((store, lastTimeService = inject(LastTimeService)) => ({

        //
        // Load last-time list
        //
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        loadLastTimeList: rxMethod<void>(
            pipe(
                tap(() => {
                    if (!store.loaded()) {
                        updateState(store, Actions.loadLastTimeList,
                            {loading: true, loadingAll: true, error: null});
                    }
                }),
                switchMap(() => {
                    if (store.loaded()) {
                        return [];
                    }
                    return from(lastTimeService.fetchLastTimeList()).pipe(
                        tap((lastTimeList) => updateState(store, Actions.loadLastTimeList, {
                            lastTimeList,
                            loading: false,
                            loadingAll: false,
                            loaded: true,
                        })),
                        catchError((error) => {
                            updateState(store, Actions.loadLastTimeList,
                                {loading: false, loadingAll: false, error});
                            return [];
                        })
                    );
                })
            )
        ),

        //
        // Load a single last-time
        //
        loadLastTime: rxMethod<{id: string, limit: number}>(
            pipe(
                switchMap(({id, limit}) => from(lastTimeService.fetchLastTime(id, limit)).pipe(
                    tap((lastTime) => {
                        updateState(store, Actions.loadLastTime, (state) => ({
                            lastTimeList: state.lastTimeList.map(lt => lt._id === lastTime._id ? lastTime : lt)
                        }));
                    }),
                    catchError((error) => {
                        updateState(store, Actions.loadLastTime, {error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Add last-time
        //
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        addLastTime: rxMethod<void>(
            pipe(
                tap(() => updateState(store, Actions.addLastTime, {loading: true})),
                switchMap(() => from(lastTimeService.addLastTime()).pipe(
                    tap((lastTime) => updateState(store, Actions.addLastTime, (state) => ({
                        loading: false,
                        lastTimeList: [lastTime, ...state.lastTimeList]
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.addLastTime, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Touch last-time
        //
        touchLastTime: rxMethod<LastTime>(
            pipe(
                tap(() => updateState(store, Actions.touchLastTime, {loading: true})),
                switchMap((lastTime) => from(lastTimeService.touch(lastTime)).pipe(
                    tap((timestamp) => updateState(store, Actions.touchLastTime, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.map(lt => {
                            if (lt._id === timestamp.ref) {
                                return {...lt, timestamps: [timestamp, ...lt.timestamps]};
                            }
                            return lt;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.touchLastTime, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update last-time title
        //
        updateLastTimeTitle: rxMethod<{lastTime: LastTime, title: string}>(
            pipe(
                tap(() => updateState(store, Actions.updateLastTimeTitle, {loading: true})),
                switchMap(({lastTime, title}) => from(lastTimeService.updateLastTime(lastTime, {name: title})).pipe(
                    tap((updatedLastTime) => updateState(store, Actions.updateLastTimeTitle, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.map(lt =>
                            lt._id === updatedLastTime._id ? updatedLastTime : lt
                        )
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateLastTimeTitle, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Delete last-time
        //
        deleteLastTime: rxMethod<LastTime>(
            pipe(
                tap(() => updateState(store, Actions.deleteLastTime, {loading: true, error: null})),
                switchMap((lastTime) => from(lastTimeService.deleteLastTime(lastTime)).pipe(
                    tap((resp) => updateState(store, Actions.deleteLastTime, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.filter(lt => lt._id !== resp.id)
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.deleteLastTime, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update timestamp
        //
        updateTimeStamp: rxMethod<{timestamp: TimeStamp, newTs: number}>(
            pipe(
                tap(() => updateState(store, Actions.updateTimeStamp, {loading: true})),
                switchMap(({timestamp, newTs}) => from(lastTimeService.updateTimestamp(timestamp, {ts: newTs})).pipe(
                    tap((updatedTs) => updateState(store, Actions.updateTimeStamp, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.map(lt => {
                            if (lt._id === updatedTs.ref) {
                                return {
                                    ...lt,
                                    timestamps: lt.timestamps.map(ts => ts._id === updatedTs._id ? updatedTs : ts)
                                };
                            }
                            return lt;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateTimeStamp, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update timestamp label
        //
        updateTimeStampLabel: rxMethod<{timestamp: TimeStamp, label: string}>(
            pipe(
                tap(() => updateState(store, Actions.updateTimeStampLabel, {loading: true})),
                switchMap(({timestamp, label}) => from(lastTimeService.updateTimestamp(timestamp, {label})).pipe(
                    tap((updatedTs) => updateState(store, Actions.updateTimeStampLabel, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.map(lt => {
                            if (lt._id === updatedTs.ref) {
                                return {
                                    ...lt,
                                    timestamps: lt.timestamps.map(ts => ts._id === updatedTs._id ? updatedTs : ts)
                                };
                            }
                            return lt;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateTimeStampLabel, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Delete timestamp
        //
        deleteTimeStamp: rxMethod<TimeStamp>(
            pipe(
                tap(() => updateState(store, Actions.deleteTimeStamp, {loading: true, error: null})),
                switchMap((timestamp) => from(lastTimeService.removeTimestamp(timestamp)).pipe(
                    tap((resp) => updateState(store, Actions.deleteTimeStamp, (state) => ({
                        loading: false,
                        lastTimeList: state.lastTimeList.map(lt => {
                            if (lt._id === timestamp.ref) {
                                return {
                                    ...lt,
                                    timestamps: lt.timestamps.filter(ts => ts._id !== resp.id)
                                };
                            }
                            return lt;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.deleteTimeStamp, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),
    }))
);
