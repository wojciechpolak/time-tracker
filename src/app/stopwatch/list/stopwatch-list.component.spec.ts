/**
 * stopwatch-list.component.spec
 *
 * Time Tracker Copyright (C) 2026 Wojciech Polak
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

import {
    Component,
    Input,
    NO_ERRORS_SCHEMA,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppTitle, Stopwatch, Types } from '../../models';
import { DataService } from '../../services/data.service';
import { SettingsService } from '../../settings/settings.service';
import { StopwatchComponent } from '../stopwatch.component';
import { StopwatchStore } from '../../store/stopwatch.store';
import { StopwatchListComponent } from './stopwatch-list.component';

// Replace real StopwatchComponent so the list tests don't need to provide
// all of StopwatchComponent's transitive dependencies.
@Component({ selector: 'app-stopwatch', template: '' })
class StubStopwatchComponent {
    @Input() item: unknown;
}

const makeSW = (id: string, ssLast: boolean = false): Stopwatch => ({
    _id: id,
    type: Types.STOPWATCH,
    name: id,
    events: ssLast
        ? [
              {
                  _id: 'EV-1',
                  type: Types.STOPWATCH_TS,
                  ref: id,
                  ts: Date.now(),
                  ss: true,
                  round: false,
              },
          ]
        : [],
    finished: false,
});

describe('StopwatchListComponent', () => {
    let fixture: ComponentFixture<StopwatchListComponent>;
    let component: StopwatchListComponent;
    let mockStopwatchStore: { addStopwatch: ReturnType<typeof vi.fn> };
    let mockSettingsService: { update: ReturnType<typeof vi.fn> };
    let stopwatchesSignal: ReturnType<typeof signal<Stopwatch[]>>;

    beforeEach(async () => {
        mockStopwatchStore = { addStopwatch: vi.fn() };
        mockSettingsService = { update: vi.fn() };
        stopwatchesSignal = signal<Stopwatch[]>([]);

        await TestBed.configureTestingModule({
            imports: [StopwatchListComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: StopwatchStore, useValue: mockStopwatchStore },
                {
                    provide: DataService,
                    useValue: {
                        stopwatches: stopwatchesSignal,
                        stopwatchesLoading: signal(false),
                        stopwatchesLoadingAll: signal(false),
                    },
                },
                { provide: SettingsService, useValue: mockSettingsService },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
            .overrideComponent(StopwatchListComponent, {
                remove: { imports: [StopwatchComponent] },
                add: { imports: [StubStopwatchComponent] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(StopwatchListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        document.title = AppTitle;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('records the current page in settings on init', () => {
        expect(mockSettingsService.update).toHaveBeenCalledWith({
            lastPage: '/main/stopwatch',
        });
    });

    it('delegates addStopwatch to the store', () => {
        component.addStopwatch();
        expect(mockStopwatchStore.addStopwatch).toHaveBeenCalledOnce();
    });

    it('sets title to AppTitle when no stopwatch is running', () => {
        stopwatchesSignal.set([makeSW('SW-1', false)]);
        fixture.detectChanges();
        expect(document.title).toBe(AppTitle);
    });

    it('prefixes title with running indicator when a stopwatch is running', () => {
        stopwatchesSignal.set([makeSW('SW-1', true)]);
        fixture.detectChanges();
        expect(document.title).toBe('🟢 ' + AppTitle);
    });
});
