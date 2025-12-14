/**
 * store/stopwatch.store
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

import { Stopwatch, StopwatchEvent } from '../models';
import { StopwatchService } from '../stopwatch/stopwatch.service';
import { environment } from '../../environments/environment';

const withDevtools = environment.storeWithDevTools;

export interface StopwatchState {
    stopwatches: Stopwatch[];
    loading: boolean;
    loadingAll: boolean;
    loaded: boolean;
    error: unknown | null;
}

const initialState: StopwatchState = {
    stopwatches: [],
    loading: false,
    loadingAll: false,
    loaded: false,
    error: null,
};

const Actions = {
    loadStopwatches: 'loadStopwatches',
    loadStopwatch: 'loadStopwatch',
    addStopwatch: 'addStopwatch',
    addStopwatchEvent: 'addStopwatchEvent',
    updateStopwatchTitle: 'updateStopwatchTitle',
    toggleArchiveStopwatch: 'toggleArchiveStopwatch',
    deleteStopwatch: 'deleteStopwatch',
    updateStopwatchEvent: 'updateStopwatchEvent',
    updateStopwatchEventLabel: 'updateStopwatchEventLabel',
    deleteStopwatchEvent: 'deleteStopwatchEvent',
} as const;

export const StopwatchStore = signalStore(
    {providedIn: 'root'},
    withDevtools('stopwatch'),
    withState(initialState),
    withMethods((store, stopwatchService = inject(StopwatchService)) => ({

        //
        // Load stopwatches
        //
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        loadStopwatches: rxMethod<void>(
            pipe(
                tap(() => {
                    if (!store.loaded()) {
                        updateState(store, Actions.loadStopwatches,
                            {loading: true, loadingAll: true, error: null});
                    }
                }),
                switchMap(() => {
                    if (store.loaded()) {
                        return [];
                    }
                    return from(stopwatchService.fetchStopwatchList()).pipe(
                        tap((stopwatches) => updateState(store, Actions.loadStopwatches, {
                            stopwatches,
                            loading: false,
                            loadingAll: false,
                            loaded: true,
                        })),
                        catchError((error) => {
                            updateState(store, Actions.loadStopwatches,
                                {loading: false, loadingAll: false, error});
                            return [];
                        })
                    );
                })
            )
        ),

        //
        // Load a single stopwatch
        //
        loadStopwatch: rxMethod<{id: string, ignoreTsArch: boolean}>(
            pipe(
                switchMap(({id, ignoreTsArch}) => from(stopwatchService.fetchStopwatch(id, ignoreTsArch)).pipe(
                    tap((stopwatch) => {
                        updateState(store, Actions.loadStopwatch, (state) => ({
                            stopwatches: state.stopwatches.map(sw => sw._id === stopwatch._id ? stopwatch : sw)
                        }));
                    }),
                    catchError((error) => {
                        updateState(store, Actions.loadStopwatch, {error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Add stopwatch
        //
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        addStopwatch: rxMethod<void>(
            pipe(
                tap(() => updateState(store, Actions.addStopwatch, {loading: true})),
                switchMap(() => from(stopwatchService.addStopwatch()).pipe(
                    tap((stopwatch) => updateState(store, Actions.addStopwatch, (state) => ({
                        loading: false,
                        stopwatches: [stopwatch, ...state.stopwatches]
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.addStopwatch, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Add stopwatch event
        //
        addStopwatchEvent: rxMethod<{stopwatchId: string, newRound: boolean, isStart: boolean}>(
            pipe(
                tap(() => updateState(store, Actions.addStopwatchEvent, {loading: true})),
                switchMap(({
                               stopwatchId,
                               newRound,
                               isStart
                           }) => from(stopwatchService.addEvent(stopwatchId, newRound, isStart)).pipe(
                    tap((events) => updateState(store, Actions.addStopwatchEvent, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw => {
                            if (sw._id === events[0].ref) {
                                return {...sw, events: [...sw.events, ...events]};
                            }
                            return sw;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.addStopwatchEvent, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update stopwatch title
        //
        updateStopwatchTitle: rxMethod<{stopwatch: Stopwatch, title: string}>(
            pipe(
                tap(() => updateState(store, Actions.updateStopwatchTitle, {loading: true})),
                switchMap(({stopwatch, title}) => from(stopwatchService.updateStopwatch(stopwatch, {name: title})).pipe(
                    tap((updatedStopwatch) => updateState(store, Actions.updateStopwatchTitle, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw =>
                            sw._id === updatedStopwatch._id ? updatedStopwatch : sw
                        )
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateStopwatchTitle,
                            {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Toggle archive stopwatch
        //
        toggleArchiveStopwatch: rxMethod<{stopwatch: Stopwatch, tsArch: number}>(
            pipe(
                tap(() => updateState(store, Actions.toggleArchiveStopwatch, {loading: true})),
                switchMap(({stopwatch, tsArch}) => from(stopwatchService.toggleArchiveItem(stopwatch, tsArch)).pipe(
                    tap((updatedStopwatch) => updateState(store, Actions.toggleArchiveStopwatch, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw =>
                            sw._id === updatedStopwatch._id ? updatedStopwatch : sw
                        )
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.toggleArchiveStopwatch,
                            {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Delete stopwatch
        //
        deleteStopwatch: rxMethod<Stopwatch>(
            pipe(
                tap(() => updateState(store, Actions.deleteStopwatch, {loading: true, error: null})),
                switchMap((stopwatch) => from(stopwatchService.deleteStopwatch(stopwatch)).pipe(
                    tap((resp) => updateState(store, Actions.deleteStopwatch, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.filter(sw => sw._id !== resp.id)
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.deleteStopwatch, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update stopwatch event
        //
        updateStopwatchEvent: rxMethod<{event: StopwatchEvent, ts: number}>(
            pipe(
                tap(() => updateState(store, Actions.updateStopwatchEvent, {loading: true})),
                switchMap(({event, ts}) => from(stopwatchService.updateEvent(event, {ts})).pipe(
                    tap((updatedEvent) => updateState(store, Actions.updateStopwatchEvent, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw => {
                            if (sw._id === updatedEvent.ref) {
                                return {
                                    ...sw,
                                    events: sw.events.map(ev => ev._id === updatedEvent._id ? updatedEvent : ev)
                                };
                            }
                            return sw;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateStopwatchEvent, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Update stopwatch event label
        //
        updateStopwatchEventLabel: rxMethod<{event: StopwatchEvent, label: string}>(
            pipe(
                tap(() => updateState(store, Actions.updateStopwatchEventLabel, {loading: true})),
                switchMap(({event, label}) => from(stopwatchService.updateEvent(event, {name: label})).pipe(
                    tap((updatedEvent) => updateState(store, Actions.updateStopwatchEventLabel, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw => {
                            if (sw._id === updatedEvent.ref) {
                                return {
                                    ...sw,
                                    events: sw.events.map(ev => ev._id === updatedEvent._id ? updatedEvent : ev)
                                };
                            }
                            return sw;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.updateStopwatchEventLabel, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),

        //
        // Delete stopwatch event
        //
        deleteStopwatchEvent: rxMethod<StopwatchEvent>(
            pipe(
                tap(() => updateState(store, Actions.deleteStopwatchEvent, {loading: true, error: null})),
                switchMap((event) => from(stopwatchService.removeEvent(event)).pipe(
                    tap((resp) => updateState(store, Actions.deleteStopwatchEvent, (state) => ({
                        loading: false,
                        stopwatches: state.stopwatches.map(sw => {
                            if (sw._id === event.ref) {
                                return {
                                    ...sw,
                                    events: sw.events.filter(ev => ev._id !== resp.id)
                                };
                            }
                            return sw;
                        })
                    }))),
                    catchError((error) => {
                        updateState(store, Actions.deleteStopwatchEvent, {loading: false, error});
                        return [];
                    })
                ))
            )
        ),
    }))
);
