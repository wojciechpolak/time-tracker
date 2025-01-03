/**
 * store/last-time/last-time.actions
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
import { DbResponse, LastTime, TimeStamp } from '../../models';

export const LastTimeActions = createActionGroup({
    source: 'LastTime',
    events: {
        'Load LastTime': props<{id: string, limit: number}>(),
        'Load LastTime List': emptyProps(),
        'Load LastTime List Success': props<{lastTimeList: LastTime[]}>(),
        'Load LastTime List Failure': props<{error: any}>(),
        'Add LastTime': emptyProps(),
        'Add LastTime Success': props<{lastTime: LastTime}>(),
        'Add LastTime Failure': props<{error: any}>(),
        'Update LastTime Title': props<{lastTime: LastTime, title: string}>(),
        'Update LastTime Success': props<{lastTime: LastTime}>(),
        'Update LastTime Failure': props<{error: any}>(),
        'Delete LastTime': props<{lastTime: LastTime}>(),
        'Delete LastTime Success': props<{resp: DbResponse}>(),
        'Delete LastTime Failure': props<{error: any}>(),
        'Touch LastTime': props<{lastTime: LastTime}>(),
        'Touch LastTime Success': props<{timestamp: TimeStamp}>(),
        'Touch LastTime Failure': props<{error: any}>(),
        'Update TimeStamp': props<{timestamp: TimeStamp, newTs: number}>(),
        'Update TimeStamp Label': props<{timestamp: TimeStamp, label: string}>(),
        'Update TimeStamp Success': props<{timestamp: TimeStamp}>(),
        'Update TimeStamp Failure': props<{error: any}>(),
        'Delete TimeStamp': props<{timestamp: TimeStamp}>(),
        'Delete TimeStamp Success': props<{lastTimeId: string, resp: DbResponse}>(),
        'Delete TimeStamp Failure': props<{error: any}>(),
    },
});
