/**
 * storage.service
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

import { inject, Injectable } from '@angular/core';
import { WINDOW_TOKEN } from '../core/core';


export abstract class StorageService {

    protected abstract $s: Storage;

    get(key: string, isJson: boolean = true) {
        const item = this.$s.getItem(key);
        return isJson ? item && this._deserialize(item):item;
    }

    set(key: string, value: unknown, isJson: boolean = true) {
        this.$s.setItem(key, isJson ? this._serialize(value) : value as string);
    }

    remove(key: string) {
        this.$s.removeItem(key);
    }

    removeByKeyPrefix(key_prefix: string) {
        for (const key in this.$s) {
            if (key.startsWith(key_prefix)) {
                this.remove(key);
            }
        }
    }

    clear() {
        this.$s.clear();
    }

    protected isStorageAvailable() {
        try {
            const x = '__storage_test__';
            this.$s.setItem(x, x);
            this.$s.removeItem(x);
            return true;
        }
        catch {
            return false;
        }
    }

    private _serialize(data: unknown): string {
        return JSON.stringify(data);
    }

    private _deserialize(x: string) {
        return JSON.parse(x || '') || {};
    }
}


@Injectable()
export class LocalStorageService extends StorageService {
    protected $window: Window = inject(WINDOW_TOKEN);
    protected $s;
    constructor() {
        super();
        this.$s = this.$window.localStorage;
        if (!this.isStorageAvailable()) {
            throw 'Storage Not Available!';
        }
    }
}


@Injectable()
export class SessionStorageService extends StorageService {
    protected $window: Window = inject(WINDOW_TOKEN);
    protected $s;
    constructor() {
        super();
        this.$s = this.$window.sessionStorage;
        if (!this.isStorageAvailable()) {
            throw 'Storage Not Available!';
        }
    }
}
