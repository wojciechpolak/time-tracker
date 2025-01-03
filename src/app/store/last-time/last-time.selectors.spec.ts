/**
 * store/last-time/last-time.selectors.spec
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

import { selectAllLastTimeList, selectLastTimeLoading } from './last-time.selectors';
import { LastTimeState } from './last-time.reducer';
import { Types } from '../../models';

describe('LastTime Selectors', () => {

    it('selectAllLastTimeList should return the array of last-time', () => {
        const state: LastTimeState = {
            lastTimeList: [
                {_id: '1', type: Types.LAST_TIME, name: 'First', timestamps: [], hasMoreTs: false},
                {_id: '2', type: Types.LAST_TIME, name: 'Second', timestamps: [], hasMoreTs: false},
            ],
            loading: false,
            error: null,
        };
        const result = selectAllLastTimeList.projector(state);
        expect(result.length).toBe(2);
        expect(result[0]._id).toBe('1');
    });

    it('selectAllLoading should return the loading state', () => {
        const state: LastTimeState = {
            lastTimeList: [],
            loading: true,
            error: null,
        };
        const result = selectLastTimeLoading.projector(state);
        expect(result).toBe(true);
    });
});
