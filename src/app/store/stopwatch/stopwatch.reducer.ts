/**
 * store/stopwatch/stopwatch.reducer
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

import { createReducer, on } from '@ngrx/store';
import { StopwatchActions } from './';
import { Stopwatch } from '../../models';

export interface StopwatchState {
    stopwatches: Stopwatch[];
    loading: boolean;
    loadingAll: boolean;
    error?: unknown;
}

export const initialStopwatchState: StopwatchState = {
    stopwatches: [],
    loading: false,
    loadingAll: false,
};

export const stopwatchReducer = createReducer(
    initialStopwatchState,

    //
    // Load stopwatches
    //

    on(StopwatchActions.loadStopwatches, (state) => ({
        ...state,
        loading: true,
        loadingAll: true,
        error: null,
    })),
    on(StopwatchActions.loadStopwatchesSuccess, (state, {stopwatches}) => ({
        ...state,
        loading: false,
        loadingAll: false,
        stopwatches: stopwatches,
        error: null,
    })),
    on(StopwatchActions.loadStopwatchesFailure, (state, {error}) => ({
        ...state,
        loading: false,
        loadingAll: false,
        error: error,
    })),

    //
    // Add Stopwatch
    //

    on(StopwatchActions.addStopwatch, (state) => ({
        ...state,
        loading: true,
    })),
    on(StopwatchActions.addStopwatchSuccess, (state, {stopwatch}) => ({
        ...state,
        loading: false,
        stopwatches: [stopwatch, ...state.stopwatches],
    })),
    on(StopwatchActions.addStopwatchFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Add event
    //

    on(StopwatchActions.addStopwatchEvent, (state) => ({
        ...state,
        loading: true,
    })),
    on(StopwatchActions.addStopwatchEventSuccess, (state, {events}) => {
        // update the correct stopwatch’s events
        const newStopwatches = state.stopwatches.map((sw) => {
            if (sw._id === events[0].ref) {
                return {
                    ...sw,
                    events: [...sw.events, ...events],
                };
            }
            return sw;
        });
        return {
            ...state,
            loading: false,
            stopwatches: newStopwatches,
        };
    }),
    on(StopwatchActions.addStopwatchEventFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Update stopwatch
    //

    on(StopwatchActions.updateStopwatchTitle, (state) => ({
        ...state,
        loading: true,
    })),
    on(StopwatchActions.updateStopwatchSuccess, (state, {stopwatch}) => {
        const newStopwatches = state.stopwatches.map(sw =>
            sw._id === stopwatch._id ? {...stopwatch} : sw
        );
        return {
            ...state,
            loading: false,
            stopwatches: newStopwatches,
        };
    }),
    on(StopwatchActions.updateStopwatchFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Toggle archive
    //

    on(StopwatchActions.toggleArchiveStopwatch, (state) => ({
        ...state,
        loading: true,
    })),

    //
    // Delete stopwatch
    //

    on(StopwatchActions.deleteStopwatch, state => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(StopwatchActions.deleteStopwatchSuccess, (state, {resp}) => ({
        ...state,
        loading: false,
        stopwatches: state.stopwatches.filter(sw => sw._id !== resp.id),
    })),
    on(StopwatchActions.deleteStopwatchFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Update a stopwatch event item
    //

    on(StopwatchActions.updateStopwatchEvent, (state) => ({
        ...state,
        loading: true,
    })),
    on(StopwatchActions.updateStopwatchEventLabel, (state) => ({
        ...state,
        loading: true,
    })),
    on(StopwatchActions.updateStopwatchEventSuccess, (state, {event}) => {
        const newList = state.stopwatches.map((stopwatch) => {
            if (stopwatch._id === event.ref) {
                return {
                    ...stopwatch,
                    events: stopwatch.events.map((ev) => (
                        ev._id === event._id ? {...event} : ev
                    )),
                };
            }
            return stopwatch;
        });
        return {
            ...state,
            loading: false,
            stopwatches: newList,
        };
    }),
    on(StopwatchActions.updateStopwatchEventFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Delete a stopwatch event
    //

    on(StopwatchActions.deleteStopwatchEvent, state => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(StopwatchActions.deleteStopwatchEventSuccess, (state, {stopwatchId, resp}) => {
        const newList = state.stopwatches.map((stopwatch) => {
            if (stopwatch._id === stopwatchId) {
                return {
                    ...stopwatch,
                    events: stopwatch.events.filter(ev => ev._id !== resp.id),
                };
            }
            return stopwatch;
        });
        return {
            ...state,
            loading: false,
            stopwatches: newList,
        };
    }),
    on(StopwatchActions.deleteStopwatchEventFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),
);
