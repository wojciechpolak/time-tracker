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
import { DbResponse } from '../models';

@Injectable({
    providedIn: 'root'
})
export abstract class DbService {

    abstract onDbChange: Subject<void>;
    abstract onRemoteDbError: Subject<void>;
    abstract isSyncActive: boolean;
    abstract isSyncError: boolean;

    abstract openDb(): void;
    abstract closeDb(): Promise<void>;

    abstract remoteSyncEnable(): void;
    abstract remoteSyncDisable(): void;

    abstract getItem<T>(id: string): Promise<T>;
    abstract putItem<T extends {_id: string}>(doc: T): Promise<T>;
    abstract updateItem<T extends {_id: string}>(
        item: T, updateFn: (doc: T) => void): Promise<DbResponse>;

    abstract find<T>(props: any): Promise<T[]>;

    abstract bulkDocs(items: any[]): Promise<DbResponse[]>;

    abstract deleteItem<T extends {_id: string}>(item: T): Promise<DbResponse>
    abstract deleteAll(): void;

    abstract clearLocalDB(): Promise<void>;
    abstract estimateStorage(): void;
    abstract get storageEstimated(): string;

    abstract exportDb(): void;
    abstract importDb(file?: File): Promise<void>;
}
