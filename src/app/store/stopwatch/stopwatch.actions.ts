/**
 * store/stopwatch/stopwatch.actions
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

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DbResponse, Stopwatch, StopwatchEvent } from '../../models';

export const StopwatchActions = createActionGroup({
    source: 'Stopwatch',
    events: {
        'Load Stopwatch': props<{id: string, ignoreTsArch: boolean}>(),
        'Load Stopwatches': emptyProps(),
        'Load Stopwatches Success': props<{stopwatches: Stopwatch[]}>(),
        'Load Stopwatches Failure': props<{error: unknown}>(),
        'Add Stopwatch': emptyProps(),
        'Add Stopwatch Success': props<{stopwatch: Stopwatch}>(),
        'Add Stopwatch Failure': props<{error: unknown}>(),
        'Add Stopwatch Event': props<{stopwatchId: string; newRound: boolean; isStart: boolean}>(),
        'Add Stopwatch Event Success': props<{events: StopwatchEvent[]}>(),
        'Add Stopwatch Event Failure': props<{error: unknown}>(),
        'Update Stopwatch Title': props<{stopwatch: Stopwatch, title: string}>(),
        'Update Stopwatch Success': props<{stopwatch: Stopwatch}>(),
        'Update Stopwatch Failure': props<{error: unknown}>(),
        'Delete Stopwatch': props<{stopwatch: Stopwatch}>(),
        'Delete Stopwatch Success': props<{resp: DbResponse}>(),
        'Delete Stopwatch Failure': props<{error: unknown}>(),
        'Toggle Archive Stopwatch': props<{stopwatch: Stopwatch, tsArch: number}>(),
        'Update Stopwatch Event': props<{event: StopwatchEvent, ts: number}>(),
        'Update Stopwatch Event Label': props<{event: StopwatchEvent, label: string}>(),
        'Update Stopwatch Event Success': props<{event: StopwatchEvent}>(),
        'Update Stopwatch Event Failure': props<{error: unknown}>(),
        'Delete Stopwatch Event': props<{event: StopwatchEvent}>(),
        'Delete Stopwatch Event Success': props<{stopwatchId: string, resp: DbResponse}>(),
        'Delete Stopwatch Event Failure': props<{error: unknown}>(),
    },
});
