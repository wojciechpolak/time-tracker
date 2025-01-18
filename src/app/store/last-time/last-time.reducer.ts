/**
 * store/last-time/last-time.reducer
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
import { LastTime } from '../../models';
import { LastTimeActions } from './';

export interface LastTimeState {
    lastTimeList: LastTime[];
    loading: boolean;
    loadingAll: boolean;
    error?: any;
}

export const initialLastTimeState: LastTimeState = {
    lastTimeList: [],
    loading: false,
    loadingAll: false,
};

export const lastTimeReducer = createReducer(
    initialLastTimeState,

    //
    // Load last-time list
    //

    on(LastTimeActions.loadLastTimeList, (state) => ({
        ...state,
        loading: true,
        loadingAll: true,
        error: null,
    })),
    on(LastTimeActions.loadLastTimeListSuccess, (state, {lastTimeList}) => ({
        ...state,
        loading: false,
        loadingAll: false,
        lastTimeList: lastTimeList,
        error: null,
    })),
    on(LastTimeActions.loadLastTimeListFailure, (state, {error}) => ({
        ...state,
        loading: false,
        loadingAll: false,
        error: error,
    })),

    //
    // Add last-time
    //

    on(LastTimeActions.addLastTime, (state) => ({
        ...state,
        loading: true,
    })),
    on(LastTimeActions.addLastTimeSuccess, (state, {lastTime}) => ({
        ...state,
        loading: false,
        lastTimeList: [lastTime, ...state.lastTimeList],
    })),
    on(LastTimeActions.addLastTimeFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Touch last-time
    //

    on(LastTimeActions.touchLastTime, (state) => ({
        ...state,
        loading: true,
    })),
    on(LastTimeActions.touchLastTimeSuccess, (state, {timestamp}) => {
        // update the correct last-time’s timestamps
        const newList = state.lastTimeList.map((lastTime) => {
            if (lastTime._id === timestamp.ref) {
                return {
                    ...lastTime,
                    timestamps: [timestamp, ...lastTime.timestamps],
                };
            }
            return lastTime;
        });
        return {
            ...state,
            loading: false,
            lastTimeList: newList,
        };
    }),
    on(LastTimeActions.touchLastTimeFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Update last-time item
    //

    on(LastTimeActions.updateLastTimeTitle, (state) => ({
        ...state,
        loading: true,
    })),
    on(LastTimeActions.updateLastTimeSuccess, (state, {lastTime}) => {
        const newList = state.lastTimeList.map(lt =>
            lt._id === lastTime._id ? {...lastTime} : lt
        );
        return {
            ...state,
            loading: false,
            lastTimeList: newList,
        };
    }),
    on(LastTimeActions.updateLastTimeFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Delete last-time
    //

    on(LastTimeActions.deleteLastTime, state => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(LastTimeActions.deleteLastTimeSuccess, (state, {resp}) => ({
        ...state,
        loading: false,
        lastTimeList: state.lastTimeList.filter(lt => lt._id !== resp.id),
    })),
    on(LastTimeActions.deleteLastTimeFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Update timestamp item
    //

    on(LastTimeActions.updateTimeStamp, (state) => ({
        ...state,
        loading: true,
    })),
    on(LastTimeActions.updateTimeStampLabel, (state) => ({
        ...state,
        loading: true,
    })),
    on(LastTimeActions.updateTimeStampSuccess, (state, {timestamp}) => {
        const newList = state.lastTimeList.map((lastTime) => {
            if (lastTime._id === timestamp.ref) {
                return {
                    ...lastTime,
                    timestamps: lastTime.timestamps.map((ts) => (
                        ts._id === timestamp._id ? {...timestamp} : ts
                    )),
                };
            }
            return lastTime;
        });
        return {
            ...state,
            loading: false,
            lastTimeList: newList,
        };
    }),
    on(LastTimeActions.updateTimeStampFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    //
    // Delete timestamp
    //

    on(LastTimeActions.deleteTimeStamp, state => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(LastTimeActions.deleteTimeStampSuccess, (state, {lastTimeId, resp}) => {
        const newList = state.lastTimeList.map((lastTime) => {
            if (lastTime._id === lastTimeId) {
                return {
                    ...lastTime,
                    timestamps: lastTime.timestamps.filter(ts => ts._id !== resp.id),
                };
            }
            return lastTime;
        });
        return {
            ...state,
            loading: false,
            lastTimeList: newList,
        };
    }),
    on(LastTimeActions.deleteTimeStampFailure, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),
);
