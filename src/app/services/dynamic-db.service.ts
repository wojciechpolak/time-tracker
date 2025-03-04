/**
 * dynamic-db.service
 *
 * Time Tracker Copyright (C) 2025 Wojciech Polak
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

import { inject, Injectable, Injector } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

import { DbFind } from '../models';
import { DbService, DbServiceResponses } from './db.service';
import { DbEngine, SettingsService } from '../settings/settings.service';

@Injectable({
    providedIn: 'root',
})
export class DynamicDbService extends DbService {

    private injector = inject(Injector);
    private settings = inject(SettingsService);

    onDbChange: Subject<void> = new Subject<void>();
    onRemoteDbError: Subject<void> = new Subject<void>();

    private dbService!: DbService;
    private dbChangeSubscription!: Subscription;
    private remoteDbErrorSubscription!: Subscription;

    // Promise to track DB load readiness
    private dbLoadedResolver!: () => void;
    public dbLoaded = new Promise<void>(resolve => {
        this.dbLoadedResolver = resolve;
    });

    constructor() {
        super();
        this.loadDbService(this.settings.getDbEngine);
    }

    private async loadDbService(engine: DbEngine): Promise<void> {
        // Unsubscribe from any previous subscriptions
        if (this.dbChangeSubscription) {
            this.dbChangeSubscription.unsubscribe();
        }
        if (this.remoteDbErrorSubscription) {
            this.remoteDbErrorSubscription.unsubscribe();
        }

        // Dynamically import and instantiate the desired DB engine
        if (engine === 'firestore') {
            const module = await import('./firestore-db.service');
            this.dbService = this.injector.get(module.FirestoreDbService);
        }
        else if (engine === 'pouchdb') {
            const module = await import('./pouch-db.service');
            this.dbService = this.injector.get(module.PouchDbService);
        }
        else {
            throw new Error(`Unsupported DB engine: ${engine}`);
        }

        this.initDb();

        // Subscribe to the underlying service's subjects and forward events
        this.dbChangeSubscription = this.dbService.onDbChange.subscribe(() => {
            this.onDbChange.next();
        });
        this.remoteDbErrorSubscription = this.dbService.onRemoteDbError.subscribe(() => {
            this.onRemoteDbError.next();
        });

        // Mark the DB as loaded
        this.dbLoadedResolver();
    }

    get isSyncActive(): boolean {
        return this.dbService?.isSyncActive || false;
    }

    get isSyncError(): boolean {
        return this.dbService?.isSyncError || false;
    }

    override bulkDocs<T>(items: T[]): Promise<DbServiceResponses['bulkDocs']> {
        return this.dbService.bulkDocs(items);
    }

    override clearLocalDB(): Promise<void> {
        return this.dbService.clearLocalDB();
    }

    override initDb(): void {
        this.dbService.initDb();
    }

    override openDb(): void {
        this.dbService.openDb();
    }

    override closeDb(): Promise<void> {
        return this.dbService.closeDb();
    }

    override deleteAll(): void {
        this.dbService.deleteAll();
    }

    override deleteItem<T extends {_id: string}>(item: T):
        Promise<DbServiceResponses['deleteItem']> {
        return this.dbService.deleteItem(item);
    }

    override deleteItems<T extends {_id: string}>(items: T[]): Promise<void> {
        return this.dbService.deleteItems(items);
    }

    override exportDb(): void {
        this.dbService.exportDb();
    }

    override find<T>(props: DbFind): Promise<T[]> {
        return this.dbService.find(props);
    }

    override getItem<T>(id: string): Promise<T> {
        return this.dbService.getItem(id);
    }

    override importDb(file: File | undefined): Promise<void> {
        return this.dbService.importDb(file);
    }

    override putItem<T extends {_id: string}>(doc: T): Promise<T> {
        return this.dbService.putItem(doc);
    }

    override remoteSyncDisable(): void {
        this.dbService.remoteSyncDisable();
    }

    override remoteSyncEnable(): void {
        this.dbService.remoteSyncEnable();
    }

    override getStorageEstimated(): Promise<string> {
        return this.dbService.getStorageEstimated();
    }

    override updateItem<T extends {_id: string}>(item: T, updateFn: (doc: T) => void):
        Promise<DbServiceResponses['updateItem']> {
        return this.dbService.updateItem(item, updateFn);
    }
}
