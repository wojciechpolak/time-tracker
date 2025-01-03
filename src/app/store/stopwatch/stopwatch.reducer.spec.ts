/**
 * store/stopwatch/stopwatch.reducer.spec
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

import { initialStopwatchState, stopwatchReducer } from './stopwatch.reducer';
import { StopwatchActions } from './stopwatch.actions';
import { DbResponse, Stopwatch, StopwatchEvent, Types } from '../../models';

describe('stopwatchReducer', () => {

    it('should handle Load Stopwatches Success', () => {
        const action = StopwatchActions.loadStopwatchesSuccess({
            stopwatches: [
                {_id: '1', type: Types.STOPWATCH, name: 'Test'}
            ] as Stopwatch[]
        });
        const state = stopwatchReducer(initialStopwatchState, action);
        expect(state.stopwatches.length).toBe(1);
        expect(state.stopwatches[0]._id).toBe('1');
    });

    it('should handle Add Stopwatch Success', () => {
        const action = StopwatchActions.addStopwatchSuccess({
            stopwatch: {
                _id: '1',
                type: Types.STOPWATCH,
                name: 'Test'
            } as Stopwatch
        });
        const state = stopwatchReducer(initialStopwatchState, action);
        expect(state.stopwatches.length).toBe(1);
        expect(state.stopwatches[0]._id).toBe('1');
    });

    it('should handle Add Stopwatch Event Success', () => {
        const action1 = StopwatchActions.addStopwatchSuccess({
            stopwatch: {
                _id: 'sw1',
                type: Types.STOPWATCH,
                name: 'SW1',
                events: []
            } as Stopwatch
        });
        const state1 = stopwatchReducer(initialStopwatchState, action1);
        const action2 = StopwatchActions.addStopwatchEventSuccess({
            events: [
                {_id: 'ev1', type: Types.STOPWATCH_TS, ref: 'sw1', name: 'EV1'}
            ] as StopwatchEvent[]
        });
        const state2 = stopwatchReducer(state1, action2);
        expect(state2.stopwatches.length).toBe(1);
        expect(state2.stopwatches[0].events[0]._id).toBe('ev1');
    });

    it('should handle Delete Stopwatch Success', () => {
        const action1 = StopwatchActions.addStopwatchSuccess({
            stopwatch: {
                _id: 'sw1',
                type: Types.STOPWATCH,
                name: 'SW1',
                events: []
            } as Stopwatch
        });
        const state1 = stopwatchReducer(initialStopwatchState, action1);
        const action2 = StopwatchActions.deleteStopwatchSuccess({
            resp: {id: 'sw1'} as DbResponse,
        });
        const state2 = stopwatchReducer(state1, action2);
        expect(state2.stopwatches.length).toBe(0);
    });

    it('should handle Delete Stopwatch Event Success', () => {
        const action1 = StopwatchActions.addStopwatchSuccess({
            stopwatch: {
                _id: 'sw1',
                type: Types.STOPWATCH,
                name: 'SW1',
                events: [
                    {_id: 'ev1', type: Types.STOPWATCH_TS}
                ] as StopwatchEvent[]
            } as Stopwatch
        });
        const state1 = stopwatchReducer(initialStopwatchState, action1);
        const action2 = StopwatchActions.deleteStopwatchEventSuccess({
            stopwatchId: 'sw1',
            resp: {id: 'ev1'} as DbResponse,
        });
        const state2 = stopwatchReducer(state1, action2);
        expect(state2.stopwatches.length).toBe(1);
        expect(state2.stopwatches[0].events.length).toBe(0);
    });
});
