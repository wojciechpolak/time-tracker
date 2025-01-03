/**
 * stopwatch.component.spec
 *
 * Time Tracker Copyright (C) 2023-2025 Wojciech Polak
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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { CoreModule } from '../core/core.module';
import { StopwatchComponent } from './stopwatch.component';
import { Types } from '../models';

describe('StopwatchComponent', () => {
    let component: StopwatchComponent;
    let fixture: ComponentFixture<StopwatchComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CoreModule,
                StopwatchComponent,
            ],
            providers: [
                provideMockStore(),
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(StopwatchComponent);
        component = fixture.componentInstance;
        component.item = {
            _id: 'EV-1',
            name: 'EV-1',
            type: Types.STOPWATCH,
            finished: false,
            events: [{
                _id: 'EV-TS-1',
                ref: 'EV-1',
                type: Types.STOPWATCH_TS,
                ts: new Date().getTime(),
                round: false,
                ss: true,
            }]
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
