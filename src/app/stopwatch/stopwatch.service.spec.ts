/**
 * stopwatch.service.spec
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

import { Deleted, Stopwatch, StopwatchEvent, Types } from '../models';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';
import { StopwatchService } from './stopwatch.service';

describe('StopwatchService', () => {
    let service: StopwatchService;
    let dbService: {
        getItem: jasmine.Spy;
        find: jasmine.Spy;
        putItem: jasmine.Spy;
        updateItem: jasmine.Spy;
        deleteItem: jasmine.Spy;
        deleteItems: jasmine.Spy;
    };
    let loggerService: jasmine.SpyObj<LoggerService>;

    const createEvent = (
        id: string,
        ref: string,
        ts: number,
        ss: boolean,
        extras: Partial<StopwatchEvent> = {},
    ): StopwatchEvent => ({
        _id: id,
        _rev: `rev-${id}`,
        ref,
        type: Types.STOPWATCH_TS,
        ts,
        ss,
        ...extras,
    });

    const createStopwatch = (id: string, events: StopwatchEvent[] = []): Stopwatch => ({
        _id: id,
        type: Types.STOPWATCH,
        name: id,
        events,
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
                StopwatchService,
                { provide: DbService, useValue: dbService },
                { provide: LoggerService, useValue: loggerService },
            ],
        });

        service = TestBed.inject(StopwatchService);
    });

    it('fetches active stopwatches with events and archived stopwatches without them', async () => {
        const active = createStopwatch('SW-1');
        const archived = {
            ...createStopwatch('SW-2'),
            tsArch: 999,
        };
        spyOn(service, 'fetchStopwatchEvents').and.callFake(async (item: Stopwatch) => {
            item.events = [createEvent(`EV-${item._id}`, item._id, 100, true)];
        });

        dbService.getItem.and.resolveTo(active);
        await expectAsync(service.fetchStopwatch('SW-1')).toBeResolvedTo(active);
        expect(service.fetchStopwatchEvents).toHaveBeenCalledWith(active);

        dbService.getItem.and.resolveTo(archived);
        await expectAsync(service.fetchStopwatch('SW-2')).toBeResolvedTo(archived);
        expect(archived.events).toEqual([]);
    });

    it('can fetch archived stopwatch events when explicitly requested', async () => {
        const archived = {
            ...createStopwatch('SW-2'),
            tsArch: 999,
        };
        const fetchEventsSpy = spyOn(service, 'fetchStopwatchEvents').and.resolveTo();
        dbService.getItem.and.resolveTo(archived);

        await expectAsync(service.fetchStopwatch('SW-2', true)).toBeResolvedTo(archived);
        expect(fetchEventsSpy).toHaveBeenCalledWith(archived);
    });

    it('logs and rethrows when a stopwatch cannot be fetched', async () => {
        dbService.getItem.and.resolveTo(null);

        await expectAsync(service.fetchStopwatch('SW-404')).toBeRejectedWithError(
            'Stopwatch with id SW-404 not found',
        );
        expect(loggerService.log).toHaveBeenCalledWith('fetchStopwatch error', jasmine.any(Error));
    });

    it('fetches and sorts the stopwatch list while skipping archived event hydration', async () => {
        const active = createStopwatch('SW-100');
        const archived = {
            ...createStopwatch('SW-050'),
            tsArch: 500,
        };
        dbService.find.and.resolveTo([archived, active]);
        spyOn(console, 'time');
        spyOn(console, 'timeEnd');
        spyOn(service, 'fetchStopwatchEvents').and.callFake(async (item: Stopwatch) => {
            item.events = [createEvent(`EV-${item._id}`, item._id, 300, true)];
        });

        const result = await service.fetchStopwatchList();

        expect(result.map((item) => item._id)).toEqual(['SW-100', 'SW-050']);
        expect(service.fetchStopwatchEvents).toHaveBeenCalledTimes(1);
        expect(archived.events).toEqual([]);
        expect(console.time).toHaveBeenCalledWith('find-SW');
        expect(console.timeEnd).toHaveBeenCalledWith('find-SW');
    });

    it('returns an empty list when fetchStopwatchList fails', async () => {
        spyOn(console, 'time');
        spyOn(console, 'timeEnd');
        dbService.find.and.rejectWith(new Error('db failed'));

        await expectAsync(service.fetchStopwatchList()).toBeResolvedTo([]);
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchStopwatchList error',
            jasmine.any(Error),
        );
    });

    it('sorts stopwatches using the last event timestamp or the id fallback', () => {
        const withEvents = createStopwatch('SW-100', [createEvent('EV-1', 'SW-100', 250, true)]);
        const withoutEvents = createStopwatch('SW-200');

        const result = service.sortStopwatchesByEvents([withEvents, withoutEvents]);

        expect(result.map((item) => item._id)).toEqual(['SW-100', 'SW-200']);
    });

    it('fetches a single event and logs failures', async () => {
        const event = createEvent('EV-1', 'SW-1', 100, true);
        dbService.getItem.and.resolveTo(event);
        await expectAsync(service.fetchStopwatchEvent('EV-1')).toBeResolvedTo(event);

        dbService.getItem.and.resolveTo(null);
        await expectAsync(service.fetchStopwatchEvent('EV-404')).toBeRejectedWithError(
            'Stopwatch Event with id EV-404 not found',
        );
        expect(loggerService.log).toHaveBeenCalledWith(
            'fetchStopwatchEvent error',
            jasmine.any(Error),
        );
    });

    it('hydrates stopwatch events and preprocesses them', async () => {
        const item = createStopwatch('SW-1');
        const events = [createEvent('EV-1', 'SW-1', 100, true)];
        const preprocessSpy = spyOn(service, 'preprocessEvents');
        dbService.find.and.resolveTo(events);

        await service.fetchStopwatchEvents(item);

        expect(dbService.find).toHaveBeenCalledWith({
            selector: {
                type: Types.STOPWATCH_TS,
                ref: item._id,
            },
        });
        expect(item.events).toBe(events);
        expect(preprocessSpy).toHaveBeenCalledWith(item);
    });

    it('creates a new stopwatch and its initial start event', async () => {
        const created = createStopwatch('SW-123456', [
            createEvent('SW-TS-123456', 'SW-123456', 123456, true),
        ]);
        spyOn(UtilsService, 'getTimestamp').and.returnValue(123456);
        spyOn(UtilsService, 'toISOLocalString').and.returnValue('2025-01-02T03:04:05.000Z');
        spyOn(service, 'fetchStopwatch').and.resolveTo(created);

        const result = await service.addStopwatch();

        expect(dbService.putItem.calls.argsFor(0)[0]).toEqual(
            jasmine.objectContaining({
                _id: 'SW-123456',
                type: Types.STOPWATCH,
                name: 'Stopwatch #2025-01-02T03:04:05.000Z',
            }),
        );
        expect(dbService.putItem.calls.argsFor(1)[0]).toEqual({
            _id: 'SW-TS-123456',
            ref: 'SW-123456',
            type: Types.STOPWATCH_TS,
            ts: 123456,
            ss: true,
            round: true,
        });
        expect(loggerService.log).toHaveBeenCalledWith('Successfully posted a new Stopwatch!');
        expect(result).toBe(created);
    });

    it('updates stopwatches and events through the database service', async () => {
        const stopwatch = createStopwatch('SW-1');
        const event = createEvent('EV-1', 'SW-1', 100, true);
        const updatedStopwatch = createStopwatch('SW-1');
        updatedStopwatch.name = 'Updated';
        const updatedEvent = createEvent('EV-1', 'SW-1', 999, true);
        spyOn(service, 'fetchStopwatch').and.resolveTo(updatedStopwatch);
        spyOn(service, 'fetchStopwatchEvent').and.resolveTo(updatedEvent);
        dbService.updateItem.and.callFake(
            async <T extends { _id: string }>(doc: T, updateFn: (itemToUpdate: T) => void) => {
                const clone = structuredClone(doc);
                updateFn(clone);
                return { ok: true, id: clone._id, rev: '2' };
            },
        );

        await expectAsync(service.updateStopwatch(stopwatch, { name: 'Updated' })).toBeResolvedTo(
            updatedStopwatch,
        );
        await expectAsync(service.updateEvent(event, { ts: 999 })).toBeResolvedTo(updatedEvent);

        expect(dbService.updateItem).toHaveBeenCalledTimes(2);
        expect(service.fetchStopwatch).toHaveBeenCalledWith('SW-1');
        expect(service.fetchStopwatchEvent).toHaveBeenCalledWith('EV-1');
    });

    it('adds single stopwatch events and marks them as in use', async () => {
        spyOn(UtilsService, 'getTimestamp').and.returnValue(456);
        dbService.putItem.and.callFake(async (event: StopwatchEvent) => ({ ...event }));

        const [event] = await service.addEvent('SW-1', false, false);

        expect(event).toEqual({
            _id: 'SW-TS-456',
            ref: 'SW-1',
            type: Types.STOPWATCH_TS,
            ts: 456,
            ss: true,
            round: false,
            inUse: true,
        });
        expect(loggerService.log).toHaveBeenCalledWith(
            'Successfully posted a new Stopwatch Event!',
        );
    });

    it('creates stop-and-start pairs when beginning a new round', async () => {
        spyOn(UtilsService, 'getTimestamp').and.returnValues(1000, 1001);
        dbService.putItem.and.callFake(async (event: StopwatchEvent) => ({ ...event }));

        const events = await service.addEvent('SW-1', true, true);

        expect(events).toEqual([
            {
                _id: 'SW-TS-1000',
                ref: 'SW-1',
                type: Types.STOPWATCH_TS,
                ts: 1000,
                ss: false,
                inUse: true,
            },
            {
                _id: 'SW-TS-1001',
                ref: 'SW-1',
                type: Types.STOPWATCH_TS,
                ts: 1001,
                ss: true,
                round: true,
                inUse: true,
            },
        ]);
    });

    it('toggles archive state, removes events, and deletes stopwatches', async () => {
        const stopwatch = createStopwatch('SW-1', [
            createEvent('EV-1', 'SW-1', 100, true),
            {
                ...createEvent('EV-2', 'SW-1', 200, false),
                _rev: undefined,
            },
        ]);
        const deleteResponse = { ok: true, id: 'SW-1', rev: '2' };
        const archivedStopwatch = {
            ...stopwatch,
            tsArch: 555,
        };
        spyOn(service, 'fetchStopwatch').and.resolveTo(archivedStopwatch);
        dbService.updateItem.and.callFake(
            async <T extends Stopwatch>(doc: T, updateFn: (itemToUpdate: T) => void) => {
                const clone = structuredClone(doc);
                updateFn(clone);
                return { ok: true, id: clone._id, rev: '2' };
            },
        );
        dbService.deleteItem.and.resolveTo({ ok: true, id: 'EV-1', rev: '2' });
        const firstEvent = stopwatch.events[0];

        expect(firstEvent).toBeDefined();

        await expectAsync(service.removeEvent(firstEvent as StopwatchEvent)).toBeResolvedTo({
            ok: true,
            id: 'EV-1',
            rev: '2',
        });

        dbService.deleteItem.and.resolveTo(deleteResponse);
        await expectAsync(service.deleteStopwatch(stopwatch)).toBeResolvedTo(deleteResponse);
        expect(dbService.deleteItems).toHaveBeenCalledWith([
            {
                _id: 'EV-1',
                _rev: 'rev-EV-1',
                _deleted: true,
            } as Deleted,
            {
                _id: 'EV-2',
                _rev: null,
                _deleted: true,
            } as unknown as Deleted,
        ]);

        await expectAsync(service.toggleArchiveItem(stopwatch, 555)).toBeResolvedTo(
            archivedStopwatch,
        );
        expect(service.fetchStopwatch).toHaveBeenCalledWith('SW-1');
    });

    it('marks non-starters, removes duplicates, groups pairs, and preprocesses events', () => {
        const markEvents = [
            createEvent('EV-1', 'SW-1', 100, false),
            createEvent('EV-2', 'SW-1', 200, false),
            createEvent('EV-3', 'SW-1', 300, true),
            createEvent('EV-4', 'SW-1', 400, false),
        ];
        const deduped = service.removeDupes([
            createEvent('EV-1', 'SW-1', 100, true),
            createEvent('EV-2', 'SW-1', 200, true),
            createEvent('EV-3', 'SW-1', 300, false),
            createEvent('EV-4', 'SW-1', 400, false),
            createEvent('EV-5', 'SW-1', 500, true),
        ]);
        const item = createStopwatch('SW-1', [
            createEvent('EV-1', 'SW-1', 100, false),
            createEvent('EV-2', 'SW-1', 200, true),
            createEvent('EV-3', 'SW-1', 300, false),
        ]);

        const trimmed = service.markNonStarters(markEvents);
        const pairs = service.createStartEndPairs([
            createEvent('EV-1', 'SW-1', 100, true),
            createEvent('EV-2', 'SW-1', 200, false),
            createEvent('EV-3', 'SW-1', 300, true),
        ]);
        service.preprocessEvents(item);

        expect(markEvents[0]?.inUse).toBeFalse();
        expect(markEvents[1]?.inUse).toBeFalse();
        expect(trimmed.map((event) => event._id)).toEqual(['EV-3', 'EV-4']);
        expect(deduped.map((event) => event._id)).toEqual(['EV-1', 'EV-4', 'EV-5']);
        expect(deduped.every((event) => event.inUse)).toBeTrue();
        expect(pairs.map((pair) => pair.map((event) => event._id))).toEqual([
            ['EV-1', 'EV-2'],
            ['EV-3'],
        ]);
        expect(item.finished).toBeTrue();
        expect(item.events[0]?.inUse).toBeFalse();
    });
});
