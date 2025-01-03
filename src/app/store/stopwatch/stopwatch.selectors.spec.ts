/**
 * store/stopwatch/stopwatch.selectors.spec
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

import { selectAllStopwatches, selectStopwatchesLoading } from './stopwatch.selectors';
import { StopwatchState } from './stopwatch.reducer';
import { Types } from '../../models';

describe('Stopwatch Selectors', () => {

    it('selectAllStopwatches should return the array of stopwatches', () => {
        const state: StopwatchState = {
            stopwatches: [
                {_id: '1', type: Types.STOPWATCH, name: 'First', events: []},
                {_id: '2', type: Types.STOPWATCH, name: 'Second', events: []},
            ],
            loading: false,
            error: null,
        };
        const result = selectAllStopwatches.projector(state);
        expect(result.length).toBe(2);
        expect(result[0]._id).toBe('1');
    });

    it('selectAllLoading should return the loading state', () => {
        const state: StopwatchState = {
            stopwatches: [],
            loading: true,
            error: null,
        };
        const result = selectStopwatchesLoading.projector(state);
        expect(result).toBe(true);
    });
});
