/**
 * last-time.service.spec
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

import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoggerService } from '../services/logger.service';
import { DbService } from '../services/db.service';
import { UtilsService } from '../services/utils.service';
import { Deleted, LastTime, TimeStamp, Types } from '../models';
import { LastTimeService } from './last-time.service';

describe('LastTimeService', () => {
    let service: LastTimeService;
    let dbService: {
        getItem: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
        putItem: ReturnType<typeof vi.fn>;
        updateItem: ReturnType<typeof vi.fn>;
        deleteItem: ReturnType<typeof vi.fn>;
        deleteItems: ReturnType<typeof vi.fn>;
    };
    let loggerService: {
        log: ReturnType<typeof vi.fn>;
    };

    const createLastTime = (id: string, timestamps: TimeStamp[] = []): LastTime => ({
        _id: id,
        type: Types.LAST_TIME,
        name: id,
        timestamps,
        hasMoreTs: false,
    });

    const createTimestamp = (id: string, ref: string, ts: number): TimeStamp => ({
        _id: id,
        _rev: `rev-${id}`,
        ref,
        type: Types.LAST_TIME_TS,
        ts,
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    beforeEach(() => {
        dbService = {
            getItem: vi.fn(),
            find: vi.fn().mockResolvedValue([]),
            putItem: vi.fn().mockImplementation(async <T>(doc: T) => doc),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            deleteItems: vi.fn().mockResolvedValue(undefined),
        };
        loggerService = {
            log: vi.fn(),
        };

        TestBed.configureTestingModule({
            providers: [
                LastTimeService,
                { provide: DbService, useValue: dbService },
                { provide: LoggerService, useValue: loggerService },
            ],
        });

        service = TestBed.inject(LastTimeService);
    });

    it('fetches a single last-time item and its timestamps', async () => {
        const item = createLastTime('LT-1');
        const fetchTimestampsSpy = vi
            .spyOn(service, 'fetchTimestamps')
            .mockResolvedValue(undefined);
        dbService.getItem.mockResolvedValue(item);

        await expect(service.fetchLastTime('LT-1', 5)).resolves.toBe(item);
        expect(fetchTimestampsSpy).toHaveBeenCalledWith(item, 5);
    });

    it('logs and rethrows when fetching a missing last-time item', async () => {
        dbService.getItem.mockResolvedValue(null);

        await expect(service.fetchLastTime('LT-404')).rejects.toThrowError(
            'LastTime with id LT-404 not found',
        );
        expect(loggerService.log).toHaveBeenCalledWith('fetchLastTime error', expect.any(Error));
    });

    it('fetches, hydrates, and sorts the last-time list', async () => {
        const older = createLastTime('LT-older');
        const newer = createLastTime('LT-newer');
        dbService.find.mockResolvedValue([older, newer]);
        vi.spyOn(console, 'time').mockImplementation(() => undefined);
        vi.spyOn(console, 'timeEnd').mockImplementation(() => undefined);
        vi.spyOn(service, 'fetchTimestamps').mockImplementation(async (item: LastTime) => {
            item.timestamps = [
                createTimestamp(`TS-${item._id}`, item._id, item._id === 'LT-older' ? 100 : 200),
            ];
            item.hasMoreTs = false;
        });

        const result = await service.fetchLastTimeList();

        expect(result.map((item) => item._id)).toEqual(['LT-newer', 'LT-older']);
        expect(service.fetchTimestamps).toHaveBeenCalledTimes(2);
        expect(console.time).toHaveBeenCalledWith('find-LT');
        expect(console.timeEnd).toHaveBeenCalledWith('find-LT');
    });

    it('returns an empty list when fetchLastTimeList fails', async () => {
        vi.spyOn(console, 'time').mockImplementation(() => undefined);
        vi.spyOn(console, 'timeEnd').mockImplementation(() => undefined);
        dbService.find.mockRejectedValue(new Error('db failed'));

        await expect(service.fetchLastTimeList()).resolves.toEqual([]);
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchLastTimeList error',
            expect.any(Error),
        );
    });

    it('sorts timestamps descending and flags when more timestamps are available', async () => {
        const item = createLastTime('LT-1');
        dbService.find.mockResolvedValue([
            createTimestamp('LT-TS-1', 'LT-1', 200),
            createTimestamp('LT-TS-2', 'LT-1', 300),
            createTimestamp('LT-TS-3', 'LT-1', 100),
        ]);

        await service.fetchTimestamps(item, 2);

        expect(dbService.find).toHaveBeenCalledWith({
            selector: {
                type: Types.LAST_TIME_TS,
                ref: item._id,
            },
            sort: [{ _id: 'desc' }],
            limit: 3,
        });
        expect(item.timestamps.map((ts) => ts.ts)).toEqual([300, 200]);
        expect(item.hasMoreTs).toBe(true);
    });

    it('fetches all timestamps when the limit is disabled', async () => {
        const item = createLastTime('LT-1');
        dbService.find.mockResolvedValue([
            createTimestamp('LT-TS-1', 'LT-1', 200),
            createTimestamp('LT-TS-2', 'LT-1', 100),
        ]);

        await service.fetchTimestamps(item, 0);

        expect(dbService.find.mock.calls.at(-1)?.[0]).toEqual({
            selector: {
                type: Types.LAST_TIME_TS,
                ref: item._id,
            },
            sort: [{ _id: 'desc' }],
        });
        expect(item.timestamps.map((ts) => ts.ts)).toEqual([200, 100]);
        expect(item.hasMoreTs).toBe(false);
    });

    it('fetches a single timestamp and logs failures', async () => {
        const timestamp = createTimestamp('LT-TS-1', 'LT-1', 100);
        dbService.getItem.mockResolvedValue(timestamp);
        await expect(service.fetchTimeStamp('LT-TS-1')).resolves.toBe(timestamp);

        dbService.getItem.mockResolvedValue(null);
        await expect(service.fetchTimeStamp('LT-TS-404')).rejects.toThrowError(
            'TimeStamp with id LT-TS-404 not found',
        );
        expect(loggerService.log).toHaveBeenCalledWith('fetchTimeStamp error', expect.any(Error));
    });

    it('creates a new last-time item with an initial timestamp', async () => {
        const created = createLastTime('LT-123456', [
            createTimestamp('LT-TS-123456', 'LT-123456', 123456),
        ]);
        vi.spyOn(UtilsService, 'getTimestamp').mockReturnValue(123456);
        vi.spyOn(UtilsService, 'toISOLocalString').mockReturnValue('2025-01-02T03:04:05.000Z');
        vi.spyOn(service, 'fetchLastTime').mockResolvedValue(created);

        const result = await service.addLastTime();

        expect(dbService.putItem.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({
                _id: 'LT-123456',
                type: Types.LAST_TIME,
                name: 'Last #2025-01-02T03:04:05.000Z',
            }),
        );
        expect(dbService.putItem.mock.calls[1]?.[0]).toEqual({
            _id: 'LT-TS-123456',
            ref: 'LT-123456',
            type: Types.LAST_TIME_TS,
            ts: 123456,
        });
        expect(loggerService.log).toHaveBeenCalledWith('Successfully posted a new LastTime!');
        expect(result).toBe(created);
    });

    it('touches a last-time item by creating a timestamp', async () => {
        const item = createLastTime('LT-1');
        const timestamp = createTimestamp('LT-TS-999', 'LT-1', 999);
        vi.spyOn(UtilsService, 'getTimestamp').mockReturnValue(999);
        dbService.putItem.mockResolvedValue(timestamp);

        await expect(service.touch(item)).resolves.toBe(timestamp);
        expect(dbService.putItem).toHaveBeenCalledWith({
            _id: 'LT-TS-999',
            ref: 'LT-1',
            type: Types.LAST_TIME_TS,
            ts: 999,
        });
        expect(loggerService.log).toHaveBeenCalledWith('Successfully posted a new LastTime-TS!');
    });

    it('updates last-time items and timestamps through the database service', async () => {
        const item = createLastTime('LT-1');
        const timestamp = createTimestamp('LT-TS-1', 'LT-1', 100);
        const updatedItem = createLastTime('LT-1');
        updatedItem.name = 'Updated title';
        const updatedTimestamp = createTimestamp('LT-TS-1', 'LT-1', 999);
        vi.spyOn(service, 'fetchLastTime').mockResolvedValue(updatedItem);
        vi.spyOn(service, 'fetchTimeStamp').mockResolvedValue(updatedTimestamp);
        dbService.updateItem.mockImplementation(
            async <T extends { _id: string }>(doc: T, updateFn: (itemToUpdate: T) => void) => {
                const clone = structuredClone(doc);
                updateFn(clone);
                return { ok: true, id: clone._id, rev: '2' };
            },
        );

        await expect(service.updateLastTime(item, { name: 'Updated title' })).resolves.toBe(
            updatedItem,
        );
        await expect(service.updateTimestamp(timestamp, { ts: 999 })).resolves.toBe(
            updatedTimestamp,
        );

        expect(dbService.updateItem).toHaveBeenCalledTimes(2);
        expect(service.fetchLastTime).toHaveBeenCalledWith('LT-1');
        expect(service.fetchTimeStamp).toHaveBeenCalledWith('LT-TS-1');
    });

    it('removes timestamps and last-time items', async () => {
        const timestamp = createTimestamp('LT-TS-1', 'LT-1', 100);
        const item = createLastTime('LT-1', [
            timestamp,
            {
                ...createTimestamp('LT-TS-2', 'LT-1', 200),
                _rev: undefined,
            },
        ]);
        const deleteResponse = { ok: true, id: 'LT-1', rev: '2' };
        dbService.deleteItem.mockResolvedValue(deleteResponse);
        dbService.deleteItems.mockResolvedValue(undefined);

        dbService.deleteItem.mockResolvedValue({ ok: true, id: 'LT-TS-1', rev: '2' });
        await expect(service.removeTimestamp(timestamp)).resolves.toEqual({
            ok: true,
            id: 'LT-TS-1',
            rev: '2',
        });

        dbService.deleteItem.mockResolvedValue(deleteResponse);
        await expect(service.deleteLastTime(item)).resolves.toBe(deleteResponse);
        expect(dbService.deleteItems).toHaveBeenCalledWith([
            {
                _id: 'LT-TS-1',
                _rev: 'rev-LT-TS-1',
                _deleted: true,
            } as Deleted,
            {
                _id: 'LT-TS-2',
                _rev: null,
                _deleted: true,
            } as unknown as Deleted,
        ]);
    });
});
