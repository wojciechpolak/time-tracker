/**
 * settings.service
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

import { EventEmitter, inject, Injectable, effect } from '@angular/core';
import { LoggerService } from '../services/logger.service';

import { Databases, DbEngine, Settings } from '../models';
import { SettingsStore } from '../store/settings.store';

export { Databases, DbEngine, Settings };

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private loggerService = inject(LoggerService);
    private settingsStore = inject(SettingsStore);

    settingsChanged: EventEmitter<Settings> = new EventEmitter<Settings>();

    constructor() {
        this.settingsStore.load();
        effect(() => {
            this.settingsChanged.emit(this.settingsStore.settings());
        });
    }

    load() {
        this.settingsStore.load();
    }

    save(settings: Settings): void {
        this.settingsStore.save(settings);
    }

    update(settings: Partial<Settings>): void {
        this.settingsStore.update(settings);
    }

    get(): Settings {
        return this.settingsStore.settings();
    }

    hasEndpoint(): boolean {
        return !!this.get().endpoint;
    }

    hasEnabledRemoteSync(): boolean {
        return this.get().enableRemoteSync;
    }

    getEndpoint(creds: boolean = true): string | undefined {
        const defaultPort = '5984';
        let ret = this.get().endpoint ||
            `${window.location.protocol}//${window.location.hostname}`;
        if (!ret.startsWith('http')) {
            ret = 'http://' + ret;
        }
        const url = new URL(ret);
        if (!url.port && url.protocol !== 'https:') {
            url.port = defaultPort;
        }
        url.pathname = creds ? this.getDbName : '/';
        if (creds && this.getUser && this.getPassword) {
            url.username = this.getUser;
            url.password = this.getPassword;
        }
        else if (creds) {
            return undefined;
        }
        ret = url.toString();
        url.password = '***';
        this.loggerService.log('getEndpoint', url.toString());
        return ret;
    }

    get getUser(): string {
        return this.get().user;
    }

    get getPassword(): string {
        return this.get().password;
    }

    get getDbEngine(): DbEngine {
        return this.get().dbEngine || 'pouchdb';
    }

    get getDbName(): string {
        return this.get().dbName || 'time-tracker';
    }

    get getFirebaseOptions(): object {
        return JSON.parse(this.get().firebaseConfig ?? '{}') || {};
    }
}
