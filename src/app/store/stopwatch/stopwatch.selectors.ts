/**
 * store/stopwatch/stopwatch.selectors
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

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StopwatchState } from './stopwatch.reducer';

export const selectStopwatchState = createFeatureSelector<StopwatchState>('stopwatch');

export const selectAllStopwatches = createSelector(
    selectStopwatchState,
    (state) => state.stopwatches
);

export const selectStopwatchesLoading = createSelector(
    selectStopwatchState,
    (state) => state.loading
);

export const selectStopwatchError = createSelector(
    selectStopwatchState,
    (state) => state.error
);
