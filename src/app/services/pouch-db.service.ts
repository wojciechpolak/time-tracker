/**
 * pouch-db.service
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

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject } from 'rxjs';
import PouchDB from 'pouchdb-browser';
import PouchDbFind from 'pouchdb-find';

import { Db } from '../models';
import { DbService, DbServiceResponses } from './db.service';
import { LoggerService } from './logger.service';
import { SettingsService } from '../settings/settings.service';
import { UtilsService } from './utils.service';

PouchDB.plugin(PouchDbFind);

export interface PouchDbResponses extends DbServiceResponses {
    bulkDocs: (PouchDB.Core.Response | PouchDB.Core.Error)[];
    deleteItem: PouchDB.Core.Response;
    updateItem: PouchDB.Core.Response;
}

@Injectable({
    providedIn: 'root'
})
export class PouchDbService extends DbService<PouchDbResponses> {

    est!: StorageEstimate;
    isSyncActive: boolean = false;
    isSyncPullActive: boolean = false;
    isSyncError: boolean = false;
    isOnline: boolean = window.navigator.onLine;
    isOnline$ = new BehaviorSubject<boolean>(window.navigator.onLine);
    onDbChange: Subject<void> = new Subject<void>();
    onRemoteDbError: Subject<void> = new Subject<void>();

    private db!: PouchDB.Database<Db>;
    private remoteDb!: PouchDB.Replication.Sync<object>;

    constructor(private loggerService: LoggerService,
                private snackBar: MatSnackBar,
                private settingsService: SettingsService) {
        super();
        this.listenToOnlineStatus();
        this.initDb();
    }

    initDb() {
        this.openDb();

        if (this.isOnline) {
            this.remoteSyncEnable();
        }

        this.createIndex();
    }

    openDb() {
        this.db = new PouchDB<Db>(this.settingsService.getDbName,
            {auto_compaction: true});
        this.db.on('error', (err: unknown) => {
            this.loggerService.log('DB error', err);
        });
    }

    async closeDb(): Promise<void> {
        if (this.db) {
            await this.db.close();
        }
    }

    createIndex() {
        try {
            this.db.createIndex({
                index: {
                    name: 'index1',
                    fields: ['_id', 'ref', 'type']
                }
            });
        }
        catch (err: unknown) {
            if (err) {
                this.loggerService.log('createIndex', err);
            }
        }

        try {
            this.db.createIndex({
                index: {
                    name: 'index2',
                    fields: ['ref', 'type']
                }
            });
        }
        catch (err: unknown) {
            if (err) {
                this.loggerService.log('createIndex', err);
            }
        }
    }

    remoteSyncEnable() {
        this.isSyncError = false;
        this.isSyncActive = false;
        this.isSyncPullActive = false;

        const remoteCouch = this.settingsService.hasEndpoint() &&
            this.settingsService.getEndpoint();
        if (!remoteCouch || !this.settingsService.hasEnabledRemoteSync()) {
            return;
        }

        this.loggerService.log('Enabling remote sync');
        this.remoteDb = this.db
            .sync(remoteCouch, {
                live: true,
                retry: true,
            })
            .on('paused', () => {
                this.isSyncActive = false;
                if (this.isSyncPullActive) {
                    this.isSyncPullActive = false;
                    this.loggerService.log('Remote pull sync paused');
                    this.onDbChange.next();
                }
            })
            // @ts-expect-error  active is missing in @types/pouchdb
            .on('active', (info: PouchDB.Replication.SyncResult<object>) => {
                this.isSyncActive = true;
                if (info?.direction === 'pull') {
                    this.isSyncPullActive = true;
                    this.loggerService.log('Remote pull sync active');
                }
            })
            .on('denied', (err: object) => {
                this.isSyncActive = false;
                this.isSyncPullActive = false;
                this.loggerService.log('sync denied', err);
            })
            .on('complete', () => {
                this.isSyncActive = false;
                this.isSyncPullActive = false;
            })
            // eslint-disable-next-line
            .on('error', (err: any) => {
                this.isSyncActive = false;
                this.isSyncPullActive = false;
                this.onRemoteDbError.next(err);
                if (err.status === 401) {
                    this.isSyncError = true;
                }
                this.loggerService.log('sync error', err);
            });
    }

    remoteSyncDisable() {
        if (this.remoteDb) {
            this.loggerService.log('Disabling remote sync');
            this.remoteDb.cancel();
        }
    }

    listenToOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.isOnline$.next(true);
            this.remoteSyncEnable();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.isOnline$.next(false);
            this.remoteSyncDisable();
        });
        if (UtilsService.isMobile()) {
            window.addEventListener('visibilitychange', () => {
                const state = document.visibilityState;
                if (state === 'hidden') {
                    this.remoteSyncDisable();
                }
                else if (state === 'visible') {
                    this.remoteSyncEnable();
                }
            });
        }
    }

    async getItem<T>(id: string): Promise<T> {
        return await this.db.get<T>(id);
    }

    async putItem<T extends {_id: string}>(doc: T): Promise<T> {
        try {
            // @ts-expect-error  put() signature mismatch
            const dbResp: PouchDB.Core.Response = await this.db.put<T>(doc);
            return await this.getItem<T>(dbResp.id);
        }
        catch (err: unknown) {
            this.loggerService.log('putItem error', err);
            // @ts-expect-error  PouchDB.Core.Error
            const msg = `DB putItem: ${err.status} - ${err.message}`;
            this.snackBar.open(msg, 'Dismiss');
            throw err;
        }
    }

    async updateItem<T extends {_id: string}>(
        item: T,
        updateFn: (doc: T) => void
    ): Promise<PouchDB.Core.Response> {
        const doc = await this.db.get<T>(item._id);
        if (updateFn) {
            updateFn(doc);
        }
        this.loggerService.log('Updating item', doc._id);
        return this.db.put(doc);
    }

    async find<T>(props: PouchDB.Find.FindRequest<Db>): Promise<T[]> {
        const res = await this.db.find(props);
        return res.docs as T[];
    }

    bulkDocs<T>(items: PouchDB.Core.PutDocument<Db & T>[]):
        Promise<(PouchDB.Core.Response | PouchDB.Core.Error)[]> {
        return this.db.bulkDocs(items);
    }

    async deleteItem<T extends {_id: string}>(item: T): Promise<PouchDB.Core.Response> {
        const doc = await this.db.get<T>(item._id);
        this.loggerService.log('Removing item', doc._id);
        return this.db.remove(doc);
    }

    async deleteAll() {
        try {
            const doc = await this.db.allDocs({include_docs: true});
            if (doc) {
                for (const d of doc.rows) {
                    if (d.doc) {
                        this.loggerService.log('Removing', d.doc._id);
                        this.db.remove(d.doc);
                    }
                }
            }
        }
        catch (err) {
            this.loggerService.log('deleteAll error', err);
        }
    }

    async clearLocalDB(): Promise<void> {
        this.remoteSyncDisable();
        await this.closeDb();
        window.indexedDB.databases().then((r) => {
            for (let i = 0; i < r.length; i++) {
                const dbName = r[i].name;
                if (dbName) {
                    this.loggerService.log('Clearing DB ' + dbName);
                    window.indexedDB.deleteDatabase(dbName);
                }
            }
        }).then(() => {
            this.loggerService.log('All DB data cleared.');
        });
    }

    estimateStorage() {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then((est: StorageEstimate) => {
                this.est = est;
            });
        }
    }

    get storageEstimated() {
        if (!this.est) {
            return 'Unknown';
        }
        const usage = this.est.usage ?? 0;
        const quota = this.est.quota ?? 0;
        let ret = '';
        ret += ' Usage: ' + UtilsService.size2human(usage);
        ret += ', Quota: ' + UtilsService.size2human(quota);
        ret += ', ' + (usage / quota * 100).toFixed(2) + '%';
        return ret;
    }

    async exportDb() {
        try {
            const doc = await this.db.allDocs({include_docs: true});
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            this.download(
                JSON.stringify(doc.rows.map((doc) => doc.doc), undefined, 4),
                `time-tracker-${date}.json`,
                'text/plain'
            );
        }
        catch (err) {
            this.loggerService.log('export error', err);
        }
    }

    async importDb(file?: File): Promise<void> {
        if (!file) {
            return;
        }
        const result = await file.text();
        if (result) {
            const args = await this.db.bulkDocs(
                JSON.parse(result),
                {new_edits: false});
            this.loggerService.log('import done', args);
        }
    }

    private download(data: string, name: string, type: string) {
        const a = document.createElement('a');
        const file = new Blob([data], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }
}
