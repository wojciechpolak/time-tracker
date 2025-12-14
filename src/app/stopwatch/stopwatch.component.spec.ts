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

import { Component, NO_ERRORS_SCHEMA, signal, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { Stopwatch, StopwatchEvent, Types } from '../models';
import { StopwatchComponent } from './stopwatch.component';
import { provideCore } from '../core/core';
import { StopwatchStore } from '../store/stopwatch.store';
import { StopwatchService } from './stopwatch.service';
import { TimerService } from '../services/timer.service';

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

    const mockStopwatchStore = {
        loading: signal(false),
        addStopwatchEvent: () => { },
        deleteStopwatchEvent: () => { },
        updateStopwatchEventLabel: () => { },
        updateStopwatchEvent: () => { },
        deleteStopwatch: () => { },
        updateStopwatchTitle: () => { },
        toggleArchiveStopwatch: () => { },
        loadStopwatch: () => { },
    };

    const mockStopwatchService = {
        markNonStarters: (events: StopwatchEvent[]) => events,
        removeDupes: (events: StopwatchEvent[]) => events,
        createStartEndPairs: () => [],
    };
    const mockTimerService = {
        timer$: of('00:00:00')
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                StopwatchComponent,
            ],
            providers: [
                provideZonelessChangeDetection(),
                provideCore(),
                {provide: StopwatchStore, useValue: mockStopwatchStore},
                {provide: StopwatchService, useValue: mockStopwatchService},
                {provide: TimerService, useValue: mockTimerService},
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
