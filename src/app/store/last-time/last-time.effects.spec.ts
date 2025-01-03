/**
 * store/last-time/last-time.effects.spec
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

import { DbResponse } from '../../models';
import { LastTimeActions } from './last-time.actions';
import { LastTimeEffects } from './last-time.effects';
import { LastTimeService } from '../../last-time/last-time.service';


describe('LastTimeEffects', () => {

    let actions$: Observable<Action>;
    let effects: LastTimeEffects;
    let lastTimeService: jasmine.SpyObj<LastTimeService>;

    beforeEach(() => {
        const serviceSpy = jasmine.createSpyObj('LastTimeService', ['deleteLastTime']);

        TestBed.configureTestingModule({
            providers: [
                LastTimeEffects,
                provideMockActions(() => actions$),
                {provide: LastTimeService, useValue: serviceSpy},
            ],
        });

        effects = TestBed.inject(LastTimeEffects);
        lastTimeService = TestBed.inject(LastTimeService) as jasmine.SpyObj<LastTimeService>;
    });

    it('should dispatch deleteLastTimeSuccess on success (async)', (done) => {
        const item = {_id: '123'} as any;
        const action = LastTimeActions.deleteLastTime({lastTime: item});
        const completion = LastTimeActions.deleteLastTimeSuccess({
            resp: {'ok': 'true', id: '123'} as DbResponse,
        });
        lastTimeService.deleteLastTime.and.returnValue(
            Promise.resolve({ok: 'true', id: '123'} as DbResponse)
        );

        actions$ = of(action);

        effects.deleteLastTime$.subscribe((result) => {
            expect(result).toEqual(completion);
            done();
        });
    });

    it('should dispatch deleteLastTimeFailure on error (async)', (done) => {
        const item = {_id: '123'} as any;
        const action = LastTimeActions.deleteLastTime({lastTime: item});
        const completion = LastTimeActions.deleteLastTimeFailure({
            error: new Error('fail'),
        });
        lastTimeService.deleteLastTime.and.returnValue(
            Promise.reject(new Error('fail'))
        );

        actions$ = of(action);

        effects.deleteLastTime$.subscribe((result) => {
            expect(result).toEqual(completion);
            done();
        });
    });
});
