/**
 * db.service
 *
 * Time Tracker Copyright (C) 2023 Wojciech Polak
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

import { LoggerService } from './logger.service';
import { SettingsService } from '../settings/settings.service';
import { UtilsService } from './utils.service';

PouchDB.plugin(PouchDbFind);


@Injectable({
    providedIn: 'root'
})
export class DbService {

    changesListener!: any;
    db: any;
    est!: StorageEstimate;
    remoteDb: any;
    isSyncActive: boolean = false;
    isSyncError: boolean = false;
    isOnline: boolean = window.navigator.onLine;
    isOnline$ = new BehaviorSubject<boolean>(window.navigator.onLine);
    onDbChange: Subject<void> = new Subject<void>();
    onRemoteDbError: Subject<void> = new Subject<void>();

    constructor(private loggerService: LoggerService,
                private snackBar: MatSnackBar,
                private settingsService: SettingsService) {

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
        this.db = new PouchDB(this.settingsService.getDbName,
            {auto_compaction: true});
        this.enableChangesListener();
    }

    enableChangesListener() {
        this.changesListener = this.db
            .changes({
                since: 'now',
                live: true,
                retry: true,
            })
            .on('change', (info: any) => this.onDbChange.next(info))
            .on('error', (err: any) => {
                this.loggerService.log('changes error', err);
            });
    }

    disableChangesListener() {
        if (this.changesListener) {
            this.changesListener.cancel();
            this.changesListener = null;
        }
    }

    async closeDb(): Promise<void> {
        if (this.db) {
            await this.db.close();
        }
    }

    createIndex() {
        this.db.createIndex({
            index: {
                name: 'index1',
                fields: ['_id', 'ref', 'type']
            }
        }).catch((err: any) => {
            if (err) {
                this.loggerService.log('createIndex', err);
            }
        });

        this.db.createIndex({
            index: {
                name: 'index2',
                fields: ['ref', 'type']
            }
        }).catch((err: any) => {
            if (err) {
                this.loggerService.log('createIndex', err);
            }
        });
    }

    remoteSyncEnable() {
        this.isSyncError = false;
        this.isSyncActive = false;

        let remoteCouch = this.settingsService.hasEndpoint() &&
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
                this.onDbChange.next();
            })
            .on('active', (info: any) => {
                this.isSyncActive = true;
            })
            .on('denied', (err: any) => {
                this.isSyncActive = false;
                this.loggerService.log('sync denied', err);
            })
            .on('complete', (info: any) => {
                this.isSyncActive = false;
            })
            .on('error', (err: any) => {
                this.isSyncActive = false;
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

    async getItem<T extends {_id: string}>(item: T): Promise<T> {
        return await this.db.get(item._id);
    }

    async putItem<T extends {_id: string}>(doc: T): Promise<any> {
        try {
            return await this.db.put(doc);
        }
        catch (err: any) {
            this.loggerService.log('putItem error', err);
            const msg = `DB putItem: ${err.status} - ${err.message}`;
            this.snackBar.open(msg, 'Dismiss');
            throw err;
        }
    }

    async updateItem<T extends {_id: string}>(
        item: T,
        updateFn: (doc: T) => void
    ): Promise<any> {
        const doc = await this.db.get(item._id);
        updateFn && updateFn(doc);
        this.loggerService.log('Updating item', doc);
        return this.db.put(doc);
    }

    bulkDocs(items: any[]): Promise<any> {
        return this.db.bulkDocs(items);
    }

    deleteItem(item: any): Promise<any> {
        return this.db.get(item._id).then((doc: any) => {
            this.loggerService.log('Removing item', doc);
            return this.db.remove(doc);
        });
    }

    deleteAll() {
        this.db.allDocs({include_docs: true}, (err: any, doc: any) => {
            for (let d of doc.rows) {
                this.loggerService.log('Removing', d.doc._id);
                this.db.remove(d.doc);
            }
        });
    }

    async clearLocalDB(): Promise<void> {
        this.remoteSyncDisable();
        await this.closeDb();
        window.indexedDB.databases().then((r) => {
            for (let i = 0; i < r.length; i++) {
                let dbName = r[i].name;
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
        let usage = this.est.usage ?? 0;
        let quota = this.est.quota ?? 0;
        let ret = '';
        ret += ' Usage: ' + UtilsService.size2human(usage);
        ret += ', Quota: ' + UtilsService.size2human(quota);
        ret += ', ' + (usage / quota * 100).toFixed(2) + '%';
        return ret;
    }

    exportDb() {
        this.db.allDocs({include_docs: true}, (err: any, doc: any) => {
            if (err) {
                this.loggerService.log('export error', err);
            }
            else {
                let date = new Date().toISOString().split('T')[0].replace(/-/g, '');
                this.download(
                    JSON.stringify(doc.rows.map((doc: any) => doc.doc), undefined, 4),
                    `time-tracker-${date}.json`,
                    'text/plain'
                );
            }
        });
    }

    async importDb(file?: File): Promise<void> {
        if (!file) {
            return;
        }
        let result = await file.text();
        if (result) {
            await this.db.bulkDocs(
                JSON.parse(result),
                {new_edits: false},
                (...args: any) => this.loggerService.log('import done', args)
            );
        }
    }

    private download(data: any, name: string, type: string) {
        let a = document.createElement('a');
        let file = new Blob([data], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }
}
