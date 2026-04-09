/**
 * store/last-time.store.spec
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

import { LastTime, TimeStamp, Types } from '../models';
import { LastTimeService } from '../last-time/last-time.service';
import { LastTimeStore } from './last-time.store';

const makeLT = (id: string, timestamps: TimeStamp[] = []): LastTime => ({
    _id: id,
    type: Types.LAST_TIME,
    name: id,
    timestamps,
    hasMoreTs: false,
});

const makeTS = (id: string, ref: string, ts: number = Date.now()): TimeStamp => ({
    _id: id,
    type: Types.LAST_TIME_TS,
    ref,
    ts,
});

describe('LastTimeStore', () => {
    let store: InstanceType<typeof LastTimeStore>;
    let mockService: {
        fetchLastTimeList: ReturnType<typeof vi.fn>;
        fetchLastTime: ReturnType<typeof vi.fn>;
        addLastTime: ReturnType<typeof vi.fn>;
        touch: ReturnType<typeof vi.fn>;
        updateLastTime: ReturnType<typeof vi.fn>;
        deleteLastTime: ReturnType<typeof vi.fn>;
        updateTimestamp: ReturnType<typeof vi.fn>;
        removeTimestamp: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockService = {
            fetchLastTimeList: vi.fn().mockResolvedValue([]),
            fetchLastTime: vi.fn().mockResolvedValue(makeLT('LT-1')),
            addLastTime: vi.fn().mockResolvedValue(makeLT('LT-new')),
            touch: vi.fn().mockResolvedValue(makeTS('TS-new', 'LT-1')),
            updateLastTime: vi.fn().mockResolvedValue(makeLT('LT-1')),
            deleteLastTime: vi.fn().mockResolvedValue({ id: 'LT-1' }),
            updateTimestamp: vi.fn().mockResolvedValue(makeTS('TS-1', 'LT-1')),
            removeTimestamp: vi.fn().mockResolvedValue({ id: 'TS-1' }),
        };

        TestBed.configureTestingModule({
            providers: [
                provideZonelessChangeDetection(),
                LastTimeStore,
                { provide: LastTimeService, useValue: mockService },
            ],
        });

        store = TestBed.inject(LastTimeStore);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('starts with empty state', () => {
        expect(store.lastTimeList()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.loadingAll()).toBe(false);
        expect(store.loaded()).toBe(false);
        expect(store.error()).toBeNull();
    });

    describe('loadLastTimeList', () => {
        it('fetches and stores the list', async () => {
            const items = [makeLT('LT-1'), makeLT('LT-2')];
            mockService.fetchLastTimeList.mockResolvedValue(items);

            store.loadLastTimeList();
            expect(store.loading()).toBe(true);

            await vi.waitFor(() => expect(store.loaded()).toBe(true));
            expect(store.lastTimeList()).toEqual(items);
            expect(store.loading()).toBe(false);
        });

        it('skips the fetch when already loaded', async () => {
            mockService.fetchLastTimeList.mockResolvedValue([makeLT('LT-1')]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.fetchLastTimeList.mockClear();
            store.loadLastTimeList();
            await Promise.resolve();

            expect(mockService.fetchLastTimeList).not.toHaveBeenCalled();
        });

        it('records error and clears loading on failure', async () => {
            const error = new Error('Network error');
            mockService.fetchLastTimeList.mockRejectedValue(error);

            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loading()).toBe(false));

            expect(store.error()).toBe(error);
            expect(store.loaded()).toBe(false);
        });
    });

    describe('loadLastTime', () => {
        it('replaces the matching item in the list', async () => {
            const original = makeLT('LT-1');
            const updated = { ...makeLT('LT-1'), name: 'Updated' };
            mockService.fetchLastTimeList.mockResolvedValue([original]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.fetchLastTime.mockResolvedValue(updated);
            store.loadLastTime({ id: 'LT-1', limit: 0 });
            await vi.waitFor(() => expect(store.lastTimeList()[0]?.name).toBe('Updated'));
        });
    });

    describe('addLastTime', () => {
        it('prepends the new item to the list', async () => {
            const existing = makeLT('LT-1');
            mockService.fetchLastTimeList.mockResolvedValue([existing]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const newItem = makeLT('LT-new');
            mockService.addLastTime.mockResolvedValue(newItem);
            store.addLastTime();
            await vi.waitFor(() => expect(store.lastTimeList()[0]).toEqual(newItem));

            expect(store.lastTimeList()).toHaveLength(2);
        });
    });

    describe('touchLastTime', () => {
        it('prepends the new timestamp to the matching item', async () => {
            const item = makeLT('LT-1');
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const newTs = makeTS('TS-new', 'LT-1', 9999);
            mockService.touch.mockResolvedValue(newTs);
            store.touchLastTime(item);
            await vi.waitFor(() => expect(store.lastTimeList()[0]?.timestamps).toHaveLength(1));
            expect(store.lastTimeList()[0]?.timestamps[0]).toEqual(newTs);
        });
    });

    describe('updateLastTimeTitle', () => {
        it('replaces the updated item in the list', async () => {
            const item = makeLT('LT-1');
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...item, name: 'Renamed' };
            mockService.updateLastTime.mockResolvedValue(updated);
            store.updateLastTimeTitle({ lastTime: item, title: 'Renamed' });
            await vi.waitFor(() => expect(store.lastTimeList()[0]?.name).toBe('Renamed'));
        });
    });

    describe('deleteLastTime', () => {
        it('removes the deleted item from the list', async () => {
            const item = makeLT('LT-1');
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.deleteLastTime.mockResolvedValue({ id: 'LT-1' });
            store.deleteLastTime(item);
            await vi.waitFor(() => expect(store.lastTimeList()).toHaveLength(0));
        });
    });

    describe('updateTimeStamp', () => {
        it('replaces the matching timestamp within its parent item', async () => {
            const ts = makeTS('TS-1', 'LT-1', 1000);
            const item = makeLT('LT-1', [ts]);
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...ts, ts: 9999 };
            mockService.updateTimestamp.mockResolvedValue(updated);
            store.updateTimeStamp({ timestamp: ts, newTs: 9999 });
            await vi.waitFor(() => expect(store.lastTimeList()[0]?.timestamps[0]?.ts).toBe(9999));
        });
    });

    describe('updateTimeStampLabel', () => {
        it('replaces the matching timestamp within its parent item', async () => {
            const ts = makeTS('TS-1', 'LT-1', 1000);
            const item = makeLT('LT-1', [ts]);
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            const updated = { ...ts, label: 'test label' };
            mockService.updateTimestamp.mockResolvedValue(updated);
            store.updateTimeStampLabel({ timestamp: ts, label: 'test label' });
            await vi.waitFor(() =>
                expect(store.lastTimeList()[0]?.timestamps[0]?.label).toBe('test label'),
            );
        });
    });

    describe('deleteTimeStamp', () => {
        it('removes the timestamp from the correct parent item', async () => {
            const ts = makeTS('TS-1', 'LT-1', 1000);
            const item = makeLT('LT-1', [ts]);
            mockService.fetchLastTimeList.mockResolvedValue([item]);
            store.loadLastTimeList();
            await vi.waitFor(() => expect(store.loaded()).toBe(true));

            mockService.removeTimestamp.mockResolvedValue({ id: 'TS-1' });
            store.deleteTimeStamp(ts);
            await vi.waitFor(() => expect(store.lastTimeList()[0]?.timestamps).toHaveLength(0));
        });
    });
});

describe('LastTimeStore — error handling', () => {
    let store: InstanceType<typeof LastTimeStore>;
    let mockService: {
        fetchLastTimeList: ReturnType<typeof vi.fn>;
        fetchLastTime: ReturnType<typeof vi.fn>;
        addLastTime: ReturnType<typeof vi.fn>;
        touch: ReturnType<typeof vi.fn>;
        updateLastTime: ReturnType<typeof vi.fn>;
        deleteLastTime: ReturnType<typeof vi.fn>;
        updateTimestamp: ReturnType<typeof vi.fn>;
        removeTimestamp: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockService = {
            fetchLastTimeList: vi.fn().mockResolvedValue([]),
            fetchLastTime: vi.fn().mockRejectedValue(new Error('fetch error')),
            addLastTime: vi.fn().mockRejectedValue(new Error('add error')),
            touch: vi.fn().mockRejectedValue(new Error('touch error')),
            updateLastTime: vi.fn().mockRejectedValue(new Error('update error')),
            deleteLastTime: vi.fn().mockRejectedValue(new Error('delete error')),
            updateTimestamp: vi.fn().mockRejectedValue(new Error('ts error')),
            removeTimestamp: vi.fn().mockRejectedValue(new Error('remove error')),
        };

        TestBed.configureTestingModule({
            providers: [
                provideZonelessChangeDetection(),
                LastTimeStore,
                { provide: LastTimeService, useValue: mockService },
            ],
        });
        store = TestBed.inject(LastTimeStore);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('loadLastTime records error on failure', async () => {
        store.loadLastTime({ id: 'LT-1', limit: 10 });
        await vi.waitFor(() => expect(store.error()).toBeTruthy());
    });

    it('addLastTime records error and clears loading on failure', async () => {
        store.addLastTime();
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('touchLastTime records error on failure', async () => {
        store.touchLastTime(makeLT('LT-1'));
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateLastTimeTitle records error on failure', async () => {
        store.updateLastTimeTitle({ lastTime: makeLT('LT-1'), title: 'X' });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('deleteLastTime records error on failure', async () => {
        store.deleteLastTime(makeLT('LT-1'));
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateTimeStamp records error on failure', async () => {
        store.updateTimeStamp({ timestamp: makeTS('TS-1', 'LT-1'), newTs: 999 });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('updateTimeStampLabel records error on failure', async () => {
        store.updateTimeStampLabel({ timestamp: makeTS('TS-1', 'LT-1'), label: 'X' });
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });

    it('deleteTimeStamp records error on failure', async () => {
        store.deleteTimeStamp(makeTS('TS-1', 'LT-1'));
        await vi.waitFor(() => expect(store.loading()).toBe(false));
        expect(store.error()).toBeTruthy();
    });
});
