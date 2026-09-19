/**
 * dynamic-db.service.spec
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

import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DynamicDbService } from './dynamic-db.service';
import { Types } from '../models';
import { SettingsService } from '../settings/settings.service';

class FakeDbService {
    onDbChange = new Subject<void>();
    onRemoteDbError = new Subject<void>();
    isSyncActive = false;
    isSyncError = false;
    initDb = vi.fn();
    getItem = vi.fn(async (id: string) => ({ _id: id }));
    find = vi.fn(async () => [{ _id: 'found' }]);
    closeDb = vi.fn(async () => undefined);
}

describe('DynamicDbService', () => {
    let fake: FakeDbService;
    let injector: { get: ReturnType<typeof vi.fn> };

    const engineTokenName = () =>
        (injector.get.mock.calls[0][0] as { name: string } | undefined)?.name;

    const configure = (engine: string) => {
        fake = new FakeDbService();
        injector = { get: vi.fn(() => fake) };
        TestBed.configureTestingModule({
            providers: [
                DynamicDbService,
                { provide: Injector, useValue: injector },
                { provide: SettingsService, useValue: { getDbEngine: engine } },
            ],
        });
        return TestBed.inject(DynamicDbService);
    };

    beforeEach(() => {
        TestBed.resetTestingModule();
    });

    it('resolves the pouchdb engine and initialises it', async () => {
        const service = configure('pouchdb');
        await service.dbLoaded;
        // loadDbService resolves the engine class itself; the faked Injector
        // means the real implementation is never constructed.
        expect(engineTokenName()).toContain('PouchDbService');
        expect(fake.initDb).toHaveBeenCalledOnce();
    });

    it('resolves the firestore engine', async () => {
        const service = configure('firestore');
        await service.dbLoaded;
        expect(engineTokenName()).toContain('FirestoreDbService');
    });

    it('rejects an unsupported engine', async () => {
        // Driven directly rather than through the constructor, which would
        // leave the rejection unhandled and fail the run.
        const service = configure('pouchdb');
        await service.dbLoaded;
        const reload = service as unknown as { loadDbService(engine: string): Promise<void> };
        await expect(reload.loadDbService('sqlite')).rejects.toThrow(
            'Unsupported DB engine: sqlite',
        );
    });

    it('forwards change and error events from the active engine', async () => {
        const service = configure('pouchdb');
        await service.dbLoaded;

        const changes: number[] = [];
        const failures: number[] = [];
        service.onDbChange.subscribe(() => changes.push(1));
        service.onRemoteDbError.subscribe(() => failures.push(1));

        fake.onDbChange.next();
        fake.onRemoteDbError.next();

        expect(changes).toHaveLength(1);
        expect(failures).toHaveLength(1);
    });

    it('reports sync flags from the active engine and false before it loads', async () => {
        const service = configure('pouchdb');
        await service.dbLoaded;
        expect(service.isSyncActive).toBe(false);

        fake.isSyncActive = true;
        fake.isSyncError = true;
        expect(service.isSyncActive).toBe(true);
        expect(service.isSyncError).toBe(true);
    });

    it('delegates reads to the engine once it has loaded', async () => {
        const service = configure('pouchdb');
        await expect(service.getItem('LT-1')).resolves.toEqual({ _id: 'LT-1' });
        await expect(
            service.find({ selector: { type: Types.LAST_TIME, ref: { $exists: false } } }),
        ).resolves.toEqual([{ _id: 'found' }]);
        expect(fake.getItem).toHaveBeenCalledWith('LT-1');
    });
});
