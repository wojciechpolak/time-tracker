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

import { LoggerService } from '../services/logger.service';
import { DbService } from '../services/db.service';
import { UtilsService } from '../services/utils.service';
import { Deleted, LastTime, TimeStamp, Types } from '../models';
import { LastTimeService } from './last-time.service';

describe('LastTimeService', () => {
    let service: LastTimeService;
    let dbService: {
        getItem: jasmine.Spy;
        find: jasmine.Spy;
        putItem: jasmine.Spy;
        updateItem: jasmine.Spy;
        deleteItem: jasmine.Spy;
        deleteItems: jasmine.Spy;
    };
    let loggerService: jasmine.SpyObj<LoggerService>;

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

    beforeEach(() => {
        dbService = {
            getItem: jasmine.createSpy('getItem'),
            find: jasmine.createSpy('find').and.resolveTo([]),
            putItem: jasmine.createSpy('putItem').and.callFake(async <T>(doc: T) => doc),
            updateItem: jasmine.createSpy('updateItem'),
            deleteItem: jasmine.createSpy('deleteItem'),
            deleteItems: jasmine.createSpy('deleteItems').and.resolveTo(undefined),
        };
        loggerService = jasmine.createSpyObj<LoggerService>('LoggerService', ['log']);

        TestBed.configureTestingModule({
            providers: [
                LastTimeService,
                {provide: DbService, useValue: dbService},
                {provide: LoggerService, useValue: loggerService},
            ],
        });

        service = TestBed.inject(LastTimeService);
    });

    it('fetches a single last-time item and its timestamps', async () => {
        const item = createLastTime('LT-1');
        const fetchTimestampsSpy = spyOn(service, 'fetchTimestamps').and.resolveTo();
        dbService.getItem.and.resolveTo(item);

        await expectAsync(service.fetchLastTime('LT-1', 5)).toBeResolvedTo(item);
        expect(fetchTimestampsSpy).toHaveBeenCalledWith(item, 5);
    });

    it('logs and rethrows when fetching a missing last-time item', async () => {
        dbService.getItem.and.resolveTo(null);

        await expectAsync(service.fetchLastTime('LT-404'))
            .toBeRejectedWithError('LastTime with id LT-404 not found');
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchLastTime error',
            jasmine.any(Error)
        );
    });

    it('fetches, hydrates, and sorts the last-time list', async () => {
        const older = createLastTime('LT-older');
        const newer = createLastTime('LT-newer');
        dbService.find.and.resolveTo([older, newer]);
        spyOn(console, 'time');
        spyOn(console, 'timeEnd');
        spyOn(service, 'fetchTimestamps').and.callFake(async (item: LastTime) => {
            item.timestamps = [
                createTimestamp(
                    `TS-${item._id}`,
                    item._id,
                    item._id === 'LT-older' ? 100 : 200
                )
            ];
            item.hasMoreTs = false;
        });

        const result = await service.fetchLastTimeList();

        expect(result.map(item => item._id)).toEqual(['LT-newer', 'LT-older']);
        expect(service.fetchTimestamps).toHaveBeenCalledTimes(2);
        expect(console.time).toHaveBeenCalledWith('find-LT');
        expect(console.timeEnd).toHaveBeenCalledWith('find-LT');
    });

    it('returns an empty list when fetchLastTimeList fails', async () => {
        spyOn(console, 'time');
        spyOn(console, 'timeEnd');
        dbService.find.and.rejectWith(new Error('db failed'));

        await expectAsync(service.fetchLastTimeList()).toBeResolvedTo([]);
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchLastTimeList error',
            jasmine.any(Error)
        );
    });

    it('sorts timestamps descending and flags when more timestamps are available', async () => {
        const item = createLastTime('LT-1');
        dbService.find.and.resolveTo([
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
            sort: [{_id: 'desc'}],
            limit: 3,
        });
        expect(item.timestamps.map(ts => ts.ts)).toEqual([300, 200]);
        expect(item.hasMoreTs).toBeTrue();
    });

    it('fetches all timestamps when the limit is disabled', async () => {
        const item = createLastTime('LT-1');
        dbService.find.and.resolveTo([
            createTimestamp('LT-TS-1', 'LT-1', 200),
            createTimestamp('LT-TS-2', 'LT-1', 100),
        ]);

        await service.fetchTimestamps(item, 0);

        expect(dbService.find.calls.mostRecent().args[0]).toEqual({
            selector: {
                type: Types.LAST_TIME_TS,
                ref: item._id,
            },
            sort: [{_id: 'desc'}],
        });
        expect(item.timestamps.map(ts => ts.ts)).toEqual([200, 100]);
        expect(item.hasMoreTs).toBeFalse();
    });

    it('fetches a single timestamp and logs failures', async () => {
        const timestamp = createTimestamp('LT-TS-1', 'LT-1', 100);
        dbService.getItem.and.resolveTo(timestamp);
        await expectAsync(service.fetchTimeStamp('LT-TS-1')).toBeResolvedTo(timestamp);

        dbService.getItem.and.resolveTo(null);
        await expectAsync(service.fetchTimeStamp('LT-TS-404'))
            .toBeRejectedWithError('TimeStamp with id LT-TS-404 not found');
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchTimeStamp error',
            jasmine.any(Error)
        );
    });

    it('creates a new last-time item with an initial timestamp', async () => {
        const created = createLastTime('LT-123456', [createTimestamp('LT-TS-123456', 'LT-123456', 123456)]);
        spyOn(UtilsService, 'getTimestamp').and.returnValue(123456);
        spyOn(UtilsService, 'toISOLocalString').and.returnValue('2025-01-02T03:04:05.000Z');
        spyOn(service, 'fetchLastTime').and.resolveTo(created);

        const result = await service.addLastTime();

        expect(dbService.putItem.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({
            _id: 'LT-123456',
            type: Types.LAST_TIME,
            name: 'Last #2025-01-02T03:04:05.000Z',
        }));
        expect(dbService.putItem.calls.argsFor(1)[0]).toEqual({
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
        spyOn(UtilsService, 'getTimestamp').and.returnValue(999);
        dbService.putItem.and.resolveTo(timestamp);

        await expectAsync(service.touch(item)).toBeResolvedTo(timestamp);
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
        spyOn(service, 'fetchLastTime').and.resolveTo(updatedItem);
        spyOn(service, 'fetchTimeStamp').and.resolveTo(updatedTimestamp);
        dbService.updateItem.and.callFake(async <T extends {_id: string}>(
            doc: T,
            updateFn: (itemToUpdate: T) => void
        ) => {
            const clone = structuredClone(doc);
            updateFn(clone);
            return {ok: true, id: clone._id, rev: '2'};
        });

        await expectAsync(service.updateLastTime(item, {name: 'Updated title'}))
            .toBeResolvedTo(updatedItem);
        await expectAsync(service.updateTimestamp(timestamp, {ts: 999}))
            .toBeResolvedTo(updatedTimestamp);

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
            }
        ]);
        const deleteResponse = {ok: true, id: 'LT-1', rev: '2'};
        dbService.deleteItem.and.resolveTo(deleteResponse);
        dbService.deleteItems.and.resolveTo(undefined);

        dbService.deleteItem.and.resolveTo({ok: true, id: 'LT-TS-1', rev: '2'});
        await expectAsync(service.removeTimestamp(timestamp))
            .toBeResolvedTo({ok: true, id: 'LT-TS-1', rev: '2'});

        dbService.deleteItem.and.resolveTo(deleteResponse);
        await expectAsync(service.deleteLastTime(item)).toBeResolvedTo(deleteResponse);
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
