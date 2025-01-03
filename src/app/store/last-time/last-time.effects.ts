/**
 * store/last-time/last-time.effects
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

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { mergeMap, map, catchError, switchMap } from 'rxjs/operators';

import { DbResponse, LastTime, TimeStamp } from '../../models';
import { LastTimeActions } from './';
import { LastTimeService } from '../../last-time/last-time.service';

@Injectable()
export class LastTimeEffects {

    constructor(private actions$: Actions,
                private lastTimeService: LastTimeService) {
    }

    /**
     * Effect to load a single last-time
     */
    loadLastTime$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.loadLastTime),
            switchMap(({id, limit}) =>
                from(this.lastTimeService.fetchLastTime(id, limit)).pipe(
                    map((lastTime: LastTime) => LastTimeActions.updateLastTimeSuccess({lastTime})),
                    catchError((error) => of(LastTimeActions.updateLastTimeFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to load last-time list
     */
    loadLastTimeList$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.loadLastTimeList),
            switchMap(() =>
                from(this.lastTimeService.fetchLastTimeList()).pipe(
                    map((lastTimeList: LastTime[]) => LastTimeActions.loadLastTimeListSuccess({lastTimeList})),
                    catchError((error) => of(LastTimeActions.loadLastTimeListFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to add a last-time
     */
    addLastTime$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.addLastTime),
            switchMap(() =>
                from(this.lastTimeService.addLastTime()).pipe(
                    map((lastTime: LastTime) => LastTimeActions.addLastTimeSuccess({lastTime})),
                    catchError(error => of(LastTimeActions.addLastTimeFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to add a last-time timestamp
     */
    touchLastTime$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.touchLastTime),
            switchMap(({lastTime}) =>
                from(this.lastTimeService.touch(lastTime)).pipe(
                    map((timestamp: TimeStamp) => LastTimeActions.touchLastTimeSuccess({timestamp})),
                    catchError(error => of(LastTimeActions.touchLastTimeFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update a last-time title
     */
    updateLastTimeTitle$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.updateLastTimeTitle),
            switchMap(({lastTime, title}) =>
                from(this.lastTimeService.updateLastTime(lastTime, {name: title})).pipe(
                    map((lastTime: LastTime) => LastTimeActions.updateLastTimeSuccess({lastTime})),
                    catchError(error => of(LastTimeActions.updateLastTimeFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update timestamp
     */
    updateTimestamp$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.updateTimeStamp),
            switchMap(({timestamp, newTs}) =>
                from(this.lastTimeService.updateTimestamp(timestamp, {ts: newTs})).pipe(
                    map((timestamp: TimeStamp) => LastTimeActions.updateTimeStampSuccess({timestamp})),
                    catchError(error => of(LastTimeActions.updateTimeStampFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update timestamp label
     */
    updateTimestampLabel$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.updateTimeStampLabel),
            switchMap(({timestamp, label}) =>
                from(this.lastTimeService.updateTimestamp(timestamp, {label})).pipe(
                    map((timestamp: TimeStamp) => LastTimeActions.updateTimeStampSuccess({timestamp})),
                    catchError(error => of(LastTimeActions.updateTimeStampFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to delete a last-time
     */
    deleteLastTime$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.deleteLastTime),
            mergeMap(({lastTime}) =>
                from(this.lastTimeService.deleteLastTime(lastTime)).pipe(
                    map((resp: DbResponse) => LastTimeActions.deleteLastTimeSuccess({resp})),
                    catchError(error => of(LastTimeActions.deleteLastTimeFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to delete a timestamp
     */
    deleteTimeStamp$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LastTimeActions.deleteTimeStamp),
            mergeMap(({timestamp}) =>
                from(this.lastTimeService.removeTimestamp(timestamp)).pipe(
                    map((resp: DbResponse) => LastTimeActions.deleteTimeStampSuccess(
                        {lastTimeId: timestamp.ref, resp})),
                    catchError(error => of(LastTimeActions.deleteTimeStampFailure({error})))
                )
            )
        )
    );
}
