/**
 * firestore-db.service
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

import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { FirebaseOptions, FirebaseError, initializeApp } from 'firebase/app';
import {
    CollectionReference,
    Firestore,
    collection,
    deleteDoc,
    disableNetwork,
    doc,
    enableNetwork,
    getDoc,
    getDocs,
    initializeFirestore,
    limit,
    orderBy,
    persistentLocalCache,
    persistentMultipleTabManager,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

import { Db, DbFind, DbResponse } from '../models';
import { DbService } from './db.service';
import { LoggerService } from './logger.service';
import { SettingsService } from '../settings/settings.service';
import { AppDialogComponent } from '../main/dialog.component';

@Injectable({
    providedIn: 'root'
})
export class FirestoreDbService extends DbService {

    private dialog = inject(MatDialog);
    private loggerService = inject(LoggerService);
    private settingsService = inject(SettingsService);
    private snackBar = inject(MatSnackBar);

    dbLoaded: Promise<void> = Promise.resolve();
    isSyncActive: boolean = false;
    isSyncError: boolean = false;
    onDbChange: Subject<void> = new Subject<void>();
    onRemoteDbError: Subject<void> = new Subject<void>();

    private db!: Firestore;
    private config!: FirebaseOptions;
    private collection!: CollectionReference;

    constructor() {
        super();
        this.listenToOnlineStatus();
    }

    initDb() {
        this.config = this.settingsService.getFirebaseOptions;
        if (this.settingsService.getDbEngine === 'firestore') {
            this.openDb();
        }
    }

    openDb() {
        try {
            const app = initializeApp(this.config);
            this.db = initializeFirestore(app, {
                localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
            });
            this.collection = collection(this.db, this.settingsService.getDbName);
        }
        catch (error: unknown) {
            this.loggerService.log('Error initializing Firestore DB', error);
        }
    }

    async closeDb(): Promise<void> {
    }

    remoteSyncEnable() {
    }

    remoteSyncDisable() {
    }

    listenToOnlineStatus() {
        window.addEventListener('online', () => {
            enableNetwork(this.db);
        });
        window.addEventListener('offline', () => {
            disableNetwork(this.db);
        });
    }

    async getItem<T>(id: string): Promise<T> {
        this.isSyncActive = true;
        const docRef = doc(this.collection, id);
        const docSnap = await getDoc(docRef);
        this.isSyncActive = false;
        return <T>docSnap.data();
    }

    async putItem<T extends {_id: string, ref?: string | null}>(myDoc: T): Promise<T> {
        this.isSyncActive = true;
        try {
            if (myDoc.ref === undefined) {
                myDoc.ref = null;
            }
            const docRef = doc(this.collection, myDoc._id);
            await setDoc(docRef, myDoc);
            return await this.getItem<T>(myDoc._id);
        }
        catch (err: unknown) {
            this.loggerService.log('putItem error', err);
            const msg = `DB putItem: ${err}`;
            this.snackBar.open(msg, 'Dismiss');
            throw err;
        }
        finally {
            this.isSyncActive = false;
        }
    }

    async updateItem<T extends {_id: string}>(
        item: T,
        updateFn: (doc: T) => void
    ): Promise<DbResponse> {
        this.isSyncActive = true;
        const docRes = await this.getItem<T>(item._id);
        if (updateFn) {
            updateFn(docRes);
        }
        this.loggerService.log('Updating item', docRes._id);
        const docRef = doc(this.collection, item._id);
        await updateDoc(docRef, docRes);
        this.isSyncActive = false;
        return {
            ok: true,
            id: docRes._id,
            rev: null,
        }
    }

    async find<T>(props: DbFind): Promise<T[]> {
        this.isSyncActive = true;
        const queryConstraints = [];
        if (props.selector.type) {
            queryConstraints.push(where('type', '==', props.selector.type));
        }
        if (typeof props.selector.ref === 'object' && !props.selector.ref.$exists) {
            queryConstraints.push(where('ref', '==', null));
        }
        else if (props.selector.ref && props.selector.ref) {
            queryConstraints.push(where('ref', '==', props.selector.ref));
        }
        if (props.sort) {
            const sortObj = props.sort[0];
            for (const key in sortObj) {
                const sortKey = key as keyof typeof sortObj;
                queryConstraints.push(orderBy(key, sortObj[sortKey]));
            }
        }
        if (props.limit) {
            queryConstraints.push(limit(props.limit));
        }
        const q = query(this.collection, ...queryConstraints);
        try {
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => doc.data()) as T[];
        }
        catch (err: unknown) {
            if (err instanceof FirebaseError) {
                this.loggerService.log(err.message);
                if (this.dialog.openDialogs.length === 0) {
                    this.dialog.open(AppDialogComponent, {
                        data: {title: 'Google Firebase Error', message: err.message}
                    });
                }
            }
            else {
                this.loggerService.log(err);
            }
        }
        finally {
            this.isSyncActive = false;
        }
        return [];
    }

    async bulkDocs<T>(items: (Db & T)[]): Promise<DbResponse[]> {
        this.isSyncActive = true;
        for (const item of items) {
            const docRef = doc(this.collection, item._id);
            await setDoc(docRef, item, {merge: false});
        }
        this.isSyncActive = false;
        return [];
    }

    async deleteItem<T extends {_id: string}>(item: T): Promise<DbResponse> {
        this.isSyncActive = true;
        const docRef = doc(this.collection, item._id);
        this.loggerService.log('Removing item', item._id);
        await deleteDoc(docRef);
        this.isSyncActive = false;
        return {
            ok: true,
            id: item._id,
            rev: null,
        }
    }

    async deleteItems<T extends {_id: string}>(items: T[]): Promise<void> {
        this.isSyncActive = true;
        for (const item of items) {
            const docRef = doc(this.collection, item._id);
            this.loggerService.log('Removing item', item._id);
            await deleteDoc(docRef);
        }
        this.isSyncActive = false;
    }

    async deleteAll() {
        this.isSyncActive = true;
        try {
            const query = await getDocs(this.collection);
            for (const d of query.docs) {
                const docRef = doc(this.collection, d.data()['_id']);
                await deleteDoc(docRef);
            }
        }
        catch (err) {
            this.loggerService.log('deleteAll error', err);
        }
        finally {
            this.isSyncActive = false;
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

    async getStorageEstimated(): Promise<string> {
        return 'Google\'s Firestore';
    }

    async exportDb() {
        try {
            const query = await getDocs(this.collection);
            const allDocs = query.docs.map((d) => d.data());
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            this.download(
                JSON.stringify(allDocs, undefined, 4),
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
            let parsed = JSON.parse(result);
            parsed = parsed.map((doc: {ref: unknown}) => {
                if (doc.ref === undefined) {
                    doc.ref = null;
                }
                return doc;
            });
            await this.bulkDocs(parsed);
            this.loggerService.log('import done');
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
