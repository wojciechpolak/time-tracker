/**
 * store/last-time/last-time.reducer.spec
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

import { initialLastTimeState, lastTimeReducer } from './last-time.reducer';
import { LastTimeActions } from './last-time.actions';
import { DbResponse, LastTime, TimeStamp, Types } from '../../models';

describe('lastTimeReducer', () => {

    it('should handle Load LastTime Success', () => {
        const action = LastTimeActions.loadLastTimeListSuccess({
            lastTimeList: [
                {_id: '1', type: Types.LAST_TIME, name: 'Test'}
            ] as LastTime[]
        });
        const state = lastTimeReducer(initialLastTimeState, action);
        expect(state.lastTimeList.length).toBe(1);
        expect(state.lastTimeList[0]._id).toBe('1');
    });

    it('should handle Add LastTime Success', () => {
        const action = LastTimeActions.addLastTimeSuccess({
            lastTime: {
                _id: '1',
                type: Types.LAST_TIME,
                name: 'Test'
            } as LastTime
        });
        const state = lastTimeReducer(initialLastTimeState, action);
        expect(state.lastTimeList.length).toBe(1);
        expect(state.lastTimeList[0]._id).toBe('1');
    });

    it('should handle Touch LastTime Success', () => {
        const action1 = LastTimeActions.addLastTimeSuccess({
            lastTime: {
                _id: 'lt1',
                type: Types.LAST_TIME,
                name: 'LT1',
                hasMoreTs: false,
                timestamps: []
            } as LastTime
        });
        const state1 = lastTimeReducer(initialLastTimeState, action1);
        const action2 = LastTimeActions.touchLastTimeSuccess({
            timestamp: {
                _id: 'ts1',
                type: Types.LAST_TIME_TS,
                ref: 'lt1',
                label: 'TS1'
            } as TimeStamp
        });
        const state2 = lastTimeReducer(state1, action2);
        expect(state2.lastTimeList.length).toBe(1);
        expect(state2.lastTimeList[0].timestamps[0]._id).toBe('ts1');
    });

    it('should handle Delete LastTime Success', () => {
        const action1 = LastTimeActions.addLastTimeSuccess({
            lastTime: {
                _id: 'lt1',
                type: Types.LAST_TIME,
                name: 'LT1',
                hasMoreTs: false,
                timestamps: []
            } as LastTime
        });
        const state1 = lastTimeReducer(initialLastTimeState, action1);
        const action2 = LastTimeActions.deleteLastTimeSuccess({
            resp: {id: 'lt1'} as DbResponse,
        });
        const state2 = lastTimeReducer(state1, action2);
        expect(state2.lastTimeList.length).toBe(0);
    });

    it('should handle Delete Stopwatch Event Success', () => {
        const action1 = LastTimeActions.addLastTimeSuccess({
            lastTime: {
                _id: 'lt1',
                type: Types.LAST_TIME,
                name: 'LT1',
                timestamps: [
                    {_id: 'ts1', type: Types.LAST_TIME_TS}
                ] as TimeStamp[]
            } as LastTime
        });
        const state1 = lastTimeReducer(initialLastTimeState, action1);
        const action2 = LastTimeActions.deleteTimeStampSuccess({
            lastTimeId: 'lt1',
            resp: {id: 'ts1'} as DbResponse,
        });
        const state2 = lastTimeReducer(state1, action2);
        expect(state2.lastTimeList.length).toBe(1);
        expect(state2.lastTimeList[0].timestamps.length).toBe(0);
    });
});
