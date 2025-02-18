/**
 * db.service
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
import { Subject } from 'rxjs';
import { DbError, DbFind, DbResponse } from '../models';

export interface DbServiceResponses {
    bulkDocs: (DbResponse | DbError)[];
    deleteItem: DbResponse;
    updateItem: DbResponse;
}

@Injectable({
    providedIn: 'root'
})
export abstract class DbService<TDB extends DbServiceResponses = DbServiceResponses> {

    abstract dbLoaded: Promise<void>;
    abstract onDbChange: Subject<void>;
    abstract onRemoteDbError: Subject<void>;
    abstract isSyncActive: boolean;
    abstract isSyncError: boolean;

    abstract initDb(): void;
    abstract openDb(): void;
    abstract closeDb(): Promise<void>;

    abstract remoteSyncEnable(): void;
    abstract remoteSyncDisable(): void;

    abstract getItem<T>(id: string): Promise<T>;
    abstract putItem<T extends {_id: string}>(doc: T): Promise<T>;
    abstract updateItem<T extends {_id: string}>(
        item: T, updateFn: (doc: T) => void): Promise<TDB['updateItem']>;

    abstract find<T>(props: DbFind): Promise<T[]>;

    abstract bulkDocs<T>(items: T[]): Promise<TDB['bulkDocs']>;

    abstract deleteItem<T extends {_id: string}>(item: T): Promise<TDB['deleteItem']>
    abstract deleteItems<T extends {_id: string}>(items: T[]): Promise<void>;
    abstract deleteAll(): void;

    abstract clearLocalDB(): Promise<void>;
    abstract getStorageEstimated(): Promise<string>;

    abstract exportDb(): void;
    abstract importDb(file?: File): Promise<void>;
}
