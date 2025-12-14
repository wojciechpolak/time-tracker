/**
 * last-time.component.spec
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

import { LastTimeComponent } from './last-time.component';
import { LastTime, Types } from '../models';
import { provideCore } from '../core/core';
import { LastTimeStore } from '../store/last-time.store';
import { LastTimeService } from './last-time.service';

@Component({
    imports: [
        LastTimeComponent
    ],
    template: `
        <app-last-time [item]="testItem"></app-last-time>
    `
})
class TestHostComponent {
    testItem: LastTime = {
        _id: 'LT-1',
        type: Types.LAST_TIME,
        name: 'LT-1',
        hasMoreTs: false,
        timestamps: [
            {
                _id: 'LT-TS-1',
                ref: 'LT-1',
                type: Types.LAST_TIME_TS,
                ts: new Date().getTime(),
            },
        ],
    };
}

describe('LastTimeComponent', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let component: LastTimeComponent;

    const mockLastTimeStore = {
        addLastTimeTimestamp: () => { },
        deleteLastTimeTimestamp: () => { },
        updateLastTimeTimestampLabel: () => { },
        updateLastTimeTimestamp: () => { },
        deleteLastTime: () => { },
        updateLastTimeTitle: () => { },
        loadLastTime: () => { },
    };

    const mockLastTimeService = {
        // Add methods if needed by LastTimeComponent
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                LastTimeComponent,
            ],
            providers: [
                provideZonelessChangeDetection(),
                provideCore(),
                {provide: LastTimeStore, useValue: mockLastTimeStore},
                {provide: LastTimeService, useValue: mockLastTimeService},
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostFixture.detectChanges();

        // Grab the child component instance
        const lastTimeDebugEl = hostFixture.debugElement.query(
            By.directive(LastTimeComponent)
        );
        component = lastTimeDebugEl.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
