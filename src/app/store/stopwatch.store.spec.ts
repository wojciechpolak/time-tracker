/**
 * store/stopwatch.store.spec
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

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Stopwatch, StopwatchEvent, Types } from '../models';
import { StopwatchService } from '../stopwatch/stopwatch.service';
import { StopwatchStore } from './stopwatch.store';

const makeSW = (id: string, events: StopwatchEvent[] = []): Stopwatch => ({
    _id: id,
    type: Types.STOPWATCH,
    name: id,
    events,
    finished: false,
});

const makeEV = (id: string, ref: string, ss: boolean = true): StopwatchEvent => ({
    _id: id,
    type: Types.STOPWATCH_TS,
    ref,
    ts: Date.now(),
    ss,
    round: false,
});

describe('StopwatchStore', () => {
    let store: InstanceType<typeof StopwatchStore>;
    let mockService: {
        fetchStopwatchList: ReturnType<typeof vi.fn>;
        fetchStopwatch: ReturnType<typeof vi.fn>;
        addStopwatch: ReturnType<typeof vi.fn>;
        addEvent: ReturnType<typeof vi.fn>;
        updateStopwatch: ReturnType<typeof vi.fn>;
        toggleArchiveItem: ReturnType<typeof vi.fn>;
        deleteStopwatch: ReturnType<typeof vi.fn>;
        updateEvent: ReturnType<typeof vi.fn>;
        removeEvent: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockService = {
            fetchStopwatchList: vi.fn().mockResolvedValue([]),
            fetchStopwatch: vi.fn().mockResolvedValue(makeSW('SW-1')),
            addStopwatch: vi.fn().mockResolvedValue(makeSW('SW-new')),
            addEvent: vi.fn().mockResolvedValue([makeEV('EV-new', 'SW-1')]),
            updateStopwatch: vi.fn().mockResolvedValue(makeSW('SW-1')),
            toggleArchiveItem: vi.fn().mockResolvedValue(makeSW('SW-1')),
            deleteStopwatch: vi.fn().mockResolvedValue({ id: 'SW-1' }),
            updateEvent: vi.fn().mockResolvedValue(makeEV('EV-1', 'SW-1')),
            removeEvent: vi.fn().mockResolvedValue({ id: 'EV-1' }),
        };

        TestBed.configureTestingModule({
            providers: [
                provideZonelessChangeDetection(),
                StopwatchStore,
                { provide: StopwatchService, useValue: mockService },
            ],
        });

        store = TestBed.inject(StopwatchStore);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('starts with empty state', () => {
        expect(store.stopwatches()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.loadingAll()).toBe(false);
        expect(store.loaded()).toBe(false);
        expect(store.error()).toBeNull();
    });

    describe('loadStopwatches', () => {
        it('fetches and stores the list', async () => {
            const items = [makeSW('SW-1'), makeSW('SW-2')];
            mockService.fetchStopwatchList.mockResolvedValue(items);

            store.loadStopwatches();
            expect(store.loading()).toBe(true);

            await vi.waitFor(() => expect(store.loaded()).toBe(true));
            expect(store.stopwatches()).toEqual(items);
            expect(store.loading()).toBe(false);
        });

        it('skips the fetch when already loaded', async () => {
            mockService.fetchStopwatchList.mockResolvedValue([makeSW('SW-1')]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.fetchStopwatchList.mockClear();
            store.loadStopwatches();
            await Promise.resolve();

            expect(mockService.fetchStopwatchList).not.toHaveBeenCalled();
        });

        it('records error and clears loading on failure', async () => {
            const error = new Error('fetch failed');
            mockService.fetchStopwatchList.mockRejectedValue(error);

            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loading()).toBe(false));

            expect(store.error()).toBe(error);
            expect(store.loaded()).toBe(false);
        });
    });

    describe('loadStopwatch', () => {
        it('replaces the matching stopwatch in the list', async () => {
            const original = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([original]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...makeSW('SW-1'), name: 'Renamed' };
            mockService.fetchStopwatch.mockResolvedValue(updated);
            store.loadStopwatch({ id: 'SW-1', ignoreTsArch: false });
            await vi.waitFor(() => expect(store.stopwatches()[0]?.name).toBe('Renamed'));
        });
    });

    describe('addStopwatch', () => {
        it('prepends the new stopwatch to the list', async () => {
            const existing = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([existing]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const newItem = makeSW('SW-new');
            mockService.addStopwatch.mockResolvedValue(newItem);
            store.addStopwatch();
            await vi.waitFor(() => expect(store.stopwatches()[0]).toEqual(newItem));
            expect(store.stopwatches()).toHaveLength(2);
        });
    });

    describe('addStopwatchEvent', () => {
        it('appends new events to the matching stopwatch', async () => {
            const sw = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const newEvent = makeEV('EV-new', 'SW-1');
            mockService.addEvent.mockResolvedValue([newEvent]);
            store.addStopwatchEvent({ stopwatchId: 'SW-1', newRound: false, isStart: false });
            await vi.waitFor(() => expect(store.stopwatches()[0]?.events).toHaveLength(1));
            expect(store.stopwatches()[0]?.events[0]).toEqual(newEvent);
        });
    });

    describe('updateStopwatchTitle', () => {
        it('replaces the updated stopwatch in the list', async () => {
            const sw = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...sw, name: 'New Title' };
            mockService.updateStopwatch.mockResolvedValue(updated);
            store.updateStopwatchTitle({ stopwatch: sw, title: 'New Title' });
            await vi.waitFor(() => expect(store.stopwatches()[0]?.name).toBe('New Title'));
        });
    });

    describe('toggleArchiveStopwatch', () => {
        it('replaces the archived stopwatch in the list', async () => {
            const sw = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const archived = { ...sw, tsArch: 12345 };
            mockService.toggleArchiveItem.mockResolvedValue(archived);
            store.toggleArchiveStopwatch({ stopwatch: sw, tsArch: 12345 });
            await vi.waitFor(() => expect(store.stopwatches()[0]?.tsArch).toBe(12345));
        });
    });

    describe('deleteStopwatch', () => {
        it('removes the deleted stopwatch from the list', async () => {
            const sw = makeSW('SW-1');
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.deleteStopwatch.mockResolvedValue({ id: 'SW-1' });
            store.deleteStopwatch(sw);
            await vi.waitFor(() => expect(store.stopwatches()).toHaveLength(0));
        });
    });

    describe('updateStopwatchEvent', () => {
        it('replaces the event within the correct stopwatch', async () => {
            const ev = makeEV('EV-1', 'SW-1');
            const sw = makeSW('SW-1', [ev]);
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...ev, ts: 9999 };
            mockService.updateEvent.mockResolvedValue(updated);
            store.updateStopwatchEvent({ event: ev, ts: 9999 });
            await vi.waitFor(() => expect(store.stopwatches()[0]?.events[0]?.ts).toBe(9999));
        });
    });

    describe('updateStopwatchEventLabel', () => {
        it('replaces the event label within the correct stopwatch', async () => {
            const ev = makeEV('EV-1', 'SW-1');
            const sw = makeSW('SW-1', [ev]);
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...ev, name: 'my label' };
            mockService.updateEvent.mockResolvedValue(updated);
            store.updateStopwatchEventLabel({ event: ev, label: 'my label' });
            await vi.waitFor(() =>
                expect(store.stopwatches()[0]?.events[0]?.name).toBe('my label'),
            );
        });
    });

    describe('deleteStopwatchEvent', () => {
        it('removes the event from the correct stopwatch', async () => {
            const ev = makeEV('EV-1', 'SW-1');
            const sw = makeSW('SW-1', [ev]);
            mockService.fetchStopwatchList.mockResolvedValue([sw]);
            store.loadStopwatches();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.removeEvent.mockResolvedValue({ id: 'EV-1' });
            store.deleteStopwatchEvent(ev);
            await vi.waitFor(() => expect(store.stopwatches()[0]?.events).toHaveLength(0));
        });
    });
});

describe('StopwatchStore — error handling', () => {
    let store: InstanceType<typeof StopwatchStore>;
    let mockService: {
        fetchStopwatchList: ReturnType<typeof vi.fn>;
        fetchStopwatch: ReturnType<typeof vi.fn>;
        addStopwatch: ReturnType<typeof vi.fn>;
        addEvent: ReturnType<typeof vi.fn>;
        updateStopwatch: ReturnType<typeof vi.fn>;
        toggleArchiveItem: ReturnType<typeof vi.fn>;
        deleteStopwatch: ReturnType<typeof vi.fn>;
        updateEvent: ReturnType<typeof vi.fn>;
        removeEvent: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockService = {
            fetchStopwatchList: vi.fn().mockResolvedValue([]),
            fetchStopwatch: vi.fn().mockRejectedValue(new Error('fetch error')),
            addStopwatch: vi.fn().mockRejectedValue(new Error('add error')),
            addEvent: vi.fn().mockRejectedValue(new Error('event error')),
            updateStopwatch: vi.fn().mockRejectedValue(new Error('update error')),
            toggleArchiveItem: vi.fn().mockRejectedValue(new Error('archive error')),
            deleteStopwatch: vi.fn().mockRejectedValue(new Error('delete error')),
            updateEvent: vi.fn().mockRejectedValue(new Error('ev update error')),
            removeEvent: vi.fn().mockRejectedValue(new Error('ev remove error')),
        };

        TestBed.configureTestingModule({
            providers: [
                provideZonelessChangeDetection(),
                StopwatchStore,
                { provide: StopwatchService, useValue: mockService },
            ],
        });
        store = TestBed.inject(StopwatchStore);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('loadStopwatch records error on failure', async () => {
        store.loadStopwatch({ id: 'SW-1', ignoreTsArch: false });
        await vi.waitFor(() => expect(store.error()).toBeTruthy());
    });

    it('addStopwatch records error and clears loading on failure', async () => {
        store.addStopwatch();
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('addStopwatchEvent records error on failure', async () => {
        store.addStopwatchEvent({ stopwatchId: 'SW-1', newRound: false, isStart: false });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateStopwatchTitle records error on failure', async () => {
        store.updateStopwatchTitle({ stopwatch: makeSW('SW-1'), title: 'X' });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('toggleArchiveStopwatch records error on failure', async () => {
        store.toggleArchiveStopwatch({ stopwatch: makeSW('SW-1'), tsArch: 0 });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('deleteStopwatch records error on failure', async () => {
        store.deleteStopwatch(makeSW('SW-1'));
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateStopwatchEvent records error on failure', async () => {
        store.updateStopwatchEvent({ event: makeEV('EV-1', 'SW-1'), ts: 999 });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateStopwatchEventLabel records error on failure', async () => {
        store.updateStopwatchEventLabel({ event: makeEV('EV-1', 'SW-1'), label: 'X' });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('deleteStopwatchEvent records error on failure', async () => {
        store.deleteStopwatchEvent(makeEV('EV-1', 'SW-1'));
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });
});
