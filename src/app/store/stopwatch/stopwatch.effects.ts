/**
 * store/stopwatch/stopwatch.effects
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

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { mergeMap, map, catchError, switchMap } from 'rxjs/operators';

import { DbResponse, Stopwatch, StopwatchEvent } from '../../models';
import { StopwatchActions } from './';
import { StopwatchService } from '../../stopwatch/stopwatch.service';

@Injectable()
export class StopwatchEffects {

    private actions$ = inject(Actions);
    private stopwatchService = inject(StopwatchService);

    /**
     * Effect to load a single stopwatch
     */
    loadStopwatch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.loadStopwatch),
            switchMap(({id, ignoreTsArch}) =>
                from(this.stopwatchService.fetchStopwatch(id, ignoreTsArch)).pipe(
                    map((stopwatch: Stopwatch) => StopwatchActions.updateStopwatchSuccess({stopwatch})),
                    catchError((error) => of(StopwatchActions.updateStopwatchFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to load stopwatches
     */
    loadStopwatches$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.loadStopwatches),
            switchMap(() =>
                from(this.stopwatchService.fetchStopwatchList()).pipe(
                    map((stopwatches: Stopwatch[]) => StopwatchActions.loadStopwatchesSuccess({stopwatches})),
                    catchError((error) => of(StopwatchActions.loadStopwatchesFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to add a stopwatch
     */
    addStopwatch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.addStopwatch),
            switchMap(() =>
                from(this.stopwatchService.addStopwatch()).pipe(
                    map((stopwatch: Stopwatch) => StopwatchActions.addStopwatchSuccess({stopwatch})),
                    catchError(error => of(StopwatchActions.addStopwatchFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update stopwatch title
     */
    updateStopwatchTitle$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.updateStopwatchTitle),
            switchMap(({stopwatch, title}) =>
                from(this.stopwatchService.updateStopwatch(stopwatch, {name: title})).pipe(
                    map((stopwatch: Stopwatch) => StopwatchActions.updateStopwatchSuccess({stopwatch})),
                    catchError(error => of(StopwatchActions.updateStopwatchFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to delete a stopwatch
     */
    deleteStopwatch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.deleteStopwatch),
            mergeMap(({stopwatch}) =>
                from(this.stopwatchService.deleteStopwatch(stopwatch)).pipe(
                    map((resp: DbResponse) => StopwatchActions.deleteStopwatchSuccess({resp})),
                    catchError(error => of(StopwatchActions.deleteStopwatchFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to toggle archive
     */
    toggleArchiveStopwatch$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.toggleArchiveStopwatch),
            switchMap(({stopwatch, tsArch}) =>
                from(this.stopwatchService.toggleArchiveItem(stopwatch, tsArch)).pipe(
                    map((stopwatch: Stopwatch) => StopwatchActions.updateStopwatchSuccess({stopwatch})),
                    catchError(error => of(StopwatchActions.updateStopwatchFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to add a stopwatch event
     */
    addStopwatchEvent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.addStopwatchEvent),
            switchMap(({stopwatchId, newRound, isStart}) =>
                from(this.stopwatchService.addEvent(stopwatchId, newRound, isStart)).pipe(
                    map((events: StopwatchEvent[]) => StopwatchActions.addStopwatchEventSuccess({events})),
                    catchError(error => of(StopwatchActions.addStopwatchEventFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update stopwatch event
     */
    updateStopwatchEvent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.updateStopwatchEvent),
            switchMap(({event, ts}) =>
                from(this.stopwatchService.updateEvent(event, {ts})).pipe(
                    map((event: StopwatchEvent) => StopwatchActions.updateStopwatchEventSuccess({event})),
                    catchError(error => of(StopwatchActions.updateStopwatchEventFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to update stopwatch event label
     */
    updateStopwatchEventLabel$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.updateStopwatchEventLabel),
            switchMap(({event, label}) =>
                from(this.stopwatchService.updateEvent(event, {name: label})).pipe(
                    map((event: StopwatchEvent) => StopwatchActions.updateStopwatchEventSuccess({event})),
                    catchError(error => of(StopwatchActions.updateStopwatchEventFailure({error})))
                )
            )
        )
    );

    /**
     * Effect to delete a stopwatch event
     */
    deleteStopwatchEvent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(StopwatchActions.deleteStopwatchEvent),
            mergeMap(({event}) =>
                from(this.stopwatchService.removeEvent(event)).pipe(
                    map((resp: DbResponse) => StopwatchActions.deleteStopwatchEventSuccess(
                        {stopwatchId: event.ref, resp})),
                    catchError(error => of(StopwatchActions.deleteStopwatchEventFailure({error})))
                )
            )
        )
    );
}
