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

import { Component, NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMockStore } from '@ngrx/store/testing';

import { Stopwatch, Types } from '../models';
import { StopwatchComponent } from './stopwatch.component';
import { initialStopwatchState, selectStopwatchesLoading } from '../store/stopwatch';
import { provideCore } from '../core/core';

@Component({
    imports: [
        StopwatchComponent
    ],
    template: `
        <app-stopwatch [item]="testItem"></app-stopwatch>
    `
})
class TestHostComponent {
  testItem: Stopwatch = {
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
}

describe('StopwatchComponent', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let component: StopwatchComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                StopwatchComponent,
            ],
            providers: [
                provideZonelessChangeDetection(),
                provideCore(),
                provideMockStore({
                    initialState: initialStopwatchState,
                    selectors: [
                        {
                            selector: selectStopwatchesLoading,
                            value: false
                        }
                    ]
                }),
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostFixture.detectChanges();

        // Grab the child component instance
        const lastTimeDebugEl = hostFixture.debugElement.query(
            By.directive(StopwatchComponent)
        );
        component = lastTimeDebugEl.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
