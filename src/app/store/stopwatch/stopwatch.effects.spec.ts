/**
 * store/stopwatch/stopwatch.effects.spec
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

import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { DbResponse, Stopwatch } from '../../models';
import { StopwatchActions } from './stopwatch.actions';
import { StopwatchEffects } from './stopwatch.effects';
import { StopwatchService } from '../../stopwatch/stopwatch.service';


describe('StopwatchEffects', () => {

    let actions$: Observable<Action>;
    let effects: StopwatchEffects;
    let stopwatchService: jasmine.SpyObj<StopwatchService>;

    beforeEach(() => {
        const serviceSpy = jasmine.createSpyObj('StopwatchService', ['deleteStopwatch']);

        TestBed.configureTestingModule({
            providers: [
                StopwatchEffects,
                provideMockActions(() => actions$),
                {provide: StopwatchService, useValue: serviceSpy},
            ],
        });

        effects = TestBed.inject(StopwatchEffects);
        stopwatchService = TestBed.inject(StopwatchService) as jasmine.SpyObj<StopwatchService>;
    });

    it('should dispatch deleteStopwatchSuccess on success (async)', (done) => {
        const item = {_id: '123'} as Stopwatch;
        const action = StopwatchActions.deleteStopwatch({stopwatch: item});
        const completion = StopwatchActions.deleteStopwatchSuccess({
            resp: {'ok': 'true', id: '123'} as DbResponse,
        });
        stopwatchService.deleteStopwatch.and.returnValue(
            Promise.resolve({ok: 'true', id: '123'} as DbResponse)
        );

        actions$ = of(action);

        effects.deleteStopwatch$.subscribe((result) => {
            expect(result).toEqual(completion);
            done();
        });
    });

    it('should dispatch deleteStopwatchFailure on error (async)', (done) => {
        const item = {_id: '123'} as Stopwatch;
        const action = StopwatchActions.deleteStopwatch({stopwatch: item});
        const completion = StopwatchActions.deleteStopwatchFailure({
            error: new Error('fail'),
        });
        stopwatchService.deleteStopwatch.and.returnValue(
            Promise.reject(new Error('fail'))
        );

        actions$ = of(action);

        effects.deleteStopwatch$.subscribe((result) => {
            expect(result).toEqual(completion);
            done();
        });
    });
});
