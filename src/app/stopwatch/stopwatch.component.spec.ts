/**
 * stopwatch.component.spec
 *
 * Time Tracker Copyright (C) 2023-2026 Wojciech Polak
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Stopwatch, StopwatchEvent, Types } from '../models';
import { StopwatchComponent } from './stopwatch.component';
import { LoggerService } from '../services/logger.service';
import { StopwatchStore } from '../store/stopwatch.store';
import { StopwatchService } from './stopwatch.service';
import { TimerService } from '../services/timer.service';

const makeEV = (
    id: string,
    ref: string,
    ts: number,
    ss: boolean,
    round: boolean = false,
): StopwatchEvent => ({
    _id: id,
    type: Types.STOPWATCH_TS,
    ref,
    ts,
    ss,
    round,
});

const makeSW = (id: string, events: StopwatchEvent[] = []): Stopwatch => ({
    _id: id,
    name: id,
    type: Types.STOPWATCH,
    finished: false,
    events,
});

const mockStopwatchStore = {
    loading: signal(false),
    addStopwatchEvent: vi.fn(),
    deleteStopwatchEvent: vi.fn(),
    updateStopwatchEventLabel: vi.fn(),
    updateStopwatchEvent: vi.fn(),
    deleteStopwatch: vi.fn(),
    updateStopwatchTitle: vi.fn(),
    toggleArchiveStopwatch: vi.fn(),
    loadStopwatch: vi.fn(),
};

const mockStopwatchService = {
    markNonStarters: (events: StopwatchEvent[]) => events,
    removeDupes: (events: StopwatchEvent[]) => events,
    createStartEndPairs: (events: StopwatchEvent[]) =>
        events.reduce<StopwatchEvent[][]>((pairs, ev, i) => {
            if (i % 2 === 0) {
                pairs.push([ev]);
            } else {
                pairs[pairs.length - 1]?.push(ev);
            }
            return pairs;
        }, []),
};

const mockTimerService = { timer$: of(0) };

async function createFixture(
    initialItem: Stopwatch,
): Promise<ComponentFixture<StopwatchComponent>> {
    await TestBed.configureTestingModule({
        imports: [StopwatchComponent],
        providers: [
            provideZonelessChangeDetection(),
            { provide: LoggerService, useValue: { log: vi.fn() } },
            { provide: StopwatchStore, useValue: mockStopwatchStore },
            { provide: StopwatchService, useValue: mockStopwatchService },
            { provide: TimerService, useValue: mockTimerService },
        ],
        schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(StopwatchComponent);
    fixture.componentRef.setInput('item', initialItem);
    fixture.detectChanges();
    return fixture;
}

describe('StopwatchComponent', () => {
    afterEach(() => {
        vi.clearAllMocks();
        TestBed.resetTestingModule();
    });

    it('should create', async () => {
        const fixture = await createFixture(
            makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
        );
        expect(fixture.componentInstance).toBeTruthy();
    });

    describe('init — running stopwatch', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('sets isRunning to true when the last event is a start', () => {
            expect((component as unknown as { isRunning: boolean }).isRunning).toBe(true);
        });
    });

    describe('init — stopped stopwatch', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeSW('SW-1', [
                    makeEV('EV-1', 'SW-1', Date.now() - 1000, true),
                    makeEV('EV-2', 'SW-1', Date.now(), false),
                ]),
            );
            component = fixture.componentInstance;
        });

        it('sets isRunning to false when the last event is a stop', () => {
            expect((component as unknown as { isRunning: boolean }).isRunning).toBe(false);
        });

        it('populates revertedEvents in reverse order', () => {
            const comp = component as unknown as { revertedEvents: StopwatchEvent[] };
            expect(comp.revertedEvents[0]?._id).toBe('EV-2');
            expect(comp.revertedEvents[1]?._id).toBe('EV-1');
        });
    });

    describe('calcStatsAvgDay', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            // One event so calcTimeSpan doesn't crash on empty events
            const fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('calculates time for a same-day start/stop pair', () => {
            const base = new Date('2024-01-15T10:00:00.000Z').getTime();
            const events = [
                makeEV('EV-1', 'SW-1', base, true),
                makeEV('EV-2', 'SW-1', base + 3_600_000, false),
            ];
            const result = component.calcStatsAvgDay(events);

            expect(result.combinedTimeByDay['2024-1-15']).toBeCloseTo(3600, 0);
            expect(result.sumTimeByDay).toBeCloseTo(3600, 0);
            expect(result.avgTimeByDayMinutes).toBe(60);
        });

        it('splits time across two days when the session spans midnight', () => {
            const start = new Date('2024-01-15T23:00:00.000Z').getTime();
            const stop = new Date('2024-01-16T01:00:00.000Z').getTime();
            const events = [
                makeEV('EV-1', 'SW-1', start, true),
                makeEV('EV-2', 'SW-1', stop, false),
            ];
            const result = component.calcStatsAvgDay(events);

            expect(result.combinedTimeByDay['2024-1-15']).toBeGreaterThan(0);
            expect(result.combinedTimeByDay['2024-1-16']).toBeGreaterThan(0);
        });

        it('accumulates time from multiple same-day sessions', () => {
            const base = new Date('2024-01-15T08:00:00.000Z').getTime();
            const events = [
                makeEV('EV-1', 'SW-1', base, true),
                makeEV('EV-2', 'SW-1', base + 1_800_000, false),
                makeEV('EV-3', 'SW-1', base + 3_600_000, true),
                makeEV('EV-4', 'SW-1', base + 5_400_000, false),
            ];
            const result = component.calcStatsAvgDay(events);
            expect(result.combinedTimeByDay['2024-1-15']).toBeCloseTo(3600, 0);
        });

        it('returns zero sum for empty events', () => {
            const result = component.calcStatsAvgDay([]);
            expect(result.sumTimeByDay).toBe(0);
        });

        it('includes multi-day intermediate days at full 24h', () => {
            const start = new Date('2024-01-14T23:30:00.000Z').getTime();
            const stop = new Date('2024-01-16T00:30:00.000Z').getTime();
            const events = [
                makeEV('EV-1', 'SW-1', start, true),
                makeEV('EV-2', 'SW-1', stop, false),
            ];
            const result = component.calcStatsAvgDay(events);
            expect(result.combinedTimeByDay['2024-1-15']).toBe(86400);
        });
    });

    describe('title editing', () => {
        let fixture: ComponentFixture<StopwatchComponent>;
        let component: StopwatchComponent;
        const initialItem = makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]);

        beforeEach(async () => {
            fixture = await createFixture(initialItem);
            component = fixture.componentInstance;
        });

        it('editTitle captures the current name and shows the edit form', () => {
            const comp = component as unknown as {
                editedTitle: string;
                isEditTitle: boolean;
                editTitle(e: Event): void;
            };
            comp.editTitle(new Event('click'));
            expect(comp.isEditTitle).toBe(true);
            expect(comp.editedTitle).toBe('SW-1');
        });

        it('cancelEditTitle hides the edit form', () => {
            const comp = component as unknown as {
                isEditTitle: boolean;
                cancelEditTitle(): void;
            };
            comp.isEditTitle = true;
            comp.cancelEditTitle();
            expect(comp.isEditTitle).toBe(false);
        });

        it('finishEditTitle dispatches the rename and closes the form', () => {
            const comp = component as unknown as {
                editedTitle: string;
                isEditTitle: boolean;
                finishEditTitle(): void;
            };
            comp.editedTitle = 'Renamed';
            comp.isEditTitle = true;
            comp.finishEditTitle();

            expect(mockStopwatchStore.updateStopwatchTitle).toHaveBeenCalledWith({
                stopwatch: initialItem,
                title: 'Renamed',
            });
            expect(comp.isEditTitle).toBe(false);
        });
    });

    describe('addEvent', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('dispatches addStopwatchEvent with the correct start/stop flag', () => {
            component.addEvent();
            expect(mockStopwatchStore.addStopwatchEvent).toHaveBeenCalledWith({
                stopwatchId: 'SW-1',
                newRound: false,
                isStart: true,
            });
        });
    });

    describe('toggleArchiveItem', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('dispatches toggleArchiveStopwatch', () => {
            component.toggleArchiveItem();
            expect(mockStopwatchStore.toggleArchiveStopwatch).toHaveBeenCalledOnce();
        });
    });

    describe('removeEvent', () => {
        let component: StopwatchComponent;
        const event = makeEV('EV-1', 'SW-1', Date.now(), true);

        beforeEach(async () => {
            const fixture = await createFixture(makeSW('SW-1', [event]));
            component = fixture.componentInstance;
        });

        it('calls deleteStopwatchEvent when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const comp = component as unknown as {
                removeEvent(ev: StopwatchEvent, idx: number): void;
            };
            comp.removeEvent(event, 0);
            expect(mockStopwatchStore.deleteStopwatchEvent).toHaveBeenCalledWith(event);
        });

        it('does nothing when confirm is cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const comp = component as unknown as {
                removeEvent(ev: StopwatchEvent, idx: number): void;
            };
            comp.removeEvent(event, 0);
            expect(mockStopwatchStore.deleteStopwatchEvent).not.toHaveBeenCalled();
        });
    });

    describe('editEvent', () => {
        let component: StopwatchComponent;
        const event = makeEV('EV-1', 'SW-1', Date.now(), true);

        beforeEach(async () => {
            const fixture = await createFixture(makeSW('SW-1', [event]));
            component = fixture.componentInstance;
        });

        it('calls updateStopwatchEventLabel when prompt returns a value', () => {
            vi.spyOn(window, 'prompt').mockReturnValue('new label');
            const comp = component as unknown as {
                editEvent(ev: StopwatchEvent, idx: number): void;
            };
            comp.editEvent(event, 0);
            expect(mockStopwatchStore.updateStopwatchEventLabel).toHaveBeenCalledWith({
                event,
                label: 'new label',
            });
        });

        it('does nothing when prompt is cancelled', () => {
            vi.spyOn(window, 'prompt').mockReturnValue(null);
            const comp = component as unknown as {
                editEvent(ev: StopwatchEvent, idx: number): void;
            };
            comp.editEvent(event, 0);
            expect(mockStopwatchStore.updateStopwatchEventLabel).not.toHaveBeenCalled();
        });
    });

    describe('modifyEvent', () => {
        let component: StopwatchComponent;
        const event = makeEV('EV-1', 'SW-1', Date.now(), true);

        beforeEach(async () => {
            const fixture = await createFixture(makeSW('SW-1', [event]));
            component = fixture.componentInstance;
        });

        it('calls updateStopwatchEvent when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const comp = component as unknown as {
                modifyEvent(evt: { value: Date | null }, ev: StopwatchEvent, idx: number): void;
            };
            const newDate = new Date('2024-01-15T12:00:00.000Z');
            comp.modifyEvent({ value: newDate }, event, 0);
            expect(mockStopwatchStore.updateStopwatchEvent).toHaveBeenCalledWith({
                event,
                ts: newDate.valueOf(),
            });
        });

        it('does nothing when confirm is cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const comp = component as unknown as {
                modifyEvent(evt: { value: Date | null }, ev: StopwatchEvent, idx: number): void;
            };
            comp.modifyEvent({ value: new Date() }, event, 0);
            expect(mockStopwatchStore.updateStopwatchEvent).not.toHaveBeenCalled();
        });
    });

    describe('deleteItem', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('calls deleteStopwatch when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            component.deleteItem();
            expect(mockStopwatchStore.deleteStopwatch).toHaveBeenCalled();
        });

        it('does nothing when confirm is cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            component.deleteItem();
            expect(mockStopwatchStore.deleteStopwatch).not.toHaveBeenCalled();
        });
    });

    describe('toggleStats', () => {
        let component: StopwatchComponent;

        beforeEach(async () => {
            const base = Date.now() - 3_600_000;
            const fixture = await createFixture(
                makeSW('SW-1', [
                    makeEV('EV-1', 'SW-1', base, true),
                    makeEV('EV-2', 'SW-1', base + 3_600_000, false),
                ]),
            );
            component = fixture.componentInstance;
        });

        it('populates statsContent on first call', async () => {
            const comp = component as unknown as {
                statsContent: unknown;
                toggleStats(): Promise<void>;
            };
            await comp.toggleStats();
            expect(Array.isArray(comp.statsContent)).toBe(true);
        });

        it('clears statsContent on the second call', async () => {
            const comp = component as unknown as {
                statsContent: unknown;
                toggleStats(): Promise<void>;
            };
            await comp.toggleStats();
            await comp.toggleStats();
            expect(comp.statsContent).toBeNull();
        });
    });

    describe('switchDisplayRoundsEvents', () => {
        let fixture: ComponentFixture<StopwatchComponent>;
        let component: StopwatchComponent;

        beforeEach(async () => {
            fixture = await createFixture(
                makeSW('SW-1', [makeEV('EV-1', 'SW-1', Date.now(), true)]),
            );
            component = fixture.componentInstance;
        });

        it('toggles displayEvents', () => {
            const comp = component as unknown as { displayEvents: boolean };
            expect(comp.displayEvents).toBe(false);
            component.switchDisplayRoundsEvents();
            expect(comp.displayEvents).toBe(true);
            component.switchDisplayRoundsEvents();
            expect(comp.displayEvents).toBe(false);
        });

        it('does not load stopwatch when events already exist', () => {
            component.switchDisplayRoundsEvents();
            expect(mockStopwatchStore.loadStopwatch).not.toHaveBeenCalled();
        });

        it('loads stopwatch events when the item has none', () => {
            // After the first detectChanges with 1 event, cacheLastNumberOfItems=1.
            // Switching to 0 events won't hit the calcTimeSpan crash (cache ≠ 0).
            fixture.componentRef.setInput('item', makeSW('SW-1', []));
            fixture.detectChanges();
            vi.clearAllMocks();

            component.switchDisplayRoundsEvents();

            expect(mockStopwatchStore.loadStopwatch).toHaveBeenCalledWith({
                id: 'SW-1',
                ignoreTsArch: true,
            });
        });
    });
});
