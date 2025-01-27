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

import { Injectable } from '@angular/core';
import { LocalStorageService } from '../services/storage.service';
import { LoggerService } from '../services/logger.service';

const STORAGE_SETTINGS = 'settings';

export interface Settings {
    dbName?: string;
    endpoint?: string;
    user: string;
    password: string;
    lastPage: string;
    enableRemoteSync: boolean;
    redirectToHttps: boolean;
    showDebug: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    settings: Settings = {} as Settings;

    constructor(private localStorage: LocalStorageService,
                private loggerService: LoggerService) {
        this.load();
    }

    load() {
        this.settings = this.localStorage.get(STORAGE_SETTINGS) ?? {};
    }

    save(settings: Settings): void {
        this.settings = settings;
        this.localStorage.set(STORAGE_SETTINGS, this.settings);
    }

    update(settings: Partial<Settings>): void {
        this.settings = {...this.settings, ...settings};
        this.localStorage.set(STORAGE_SETTINGS, this.settings);
    }

    get(): Settings {
        return this.settings;
    }

    hasEndpoint(): boolean {
        return !!this.settings.endpoint;
    }

    hasEnabledRemoteSync(): boolean {
        return this.settings.enableRemoteSync;
    }

    getEndpoint(creds: boolean = true): string | undefined {
        const defaultPort = '5984';
        let ret = this.settings.endpoint ||
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
        return this.settings.user;
    }

    get getPassword(): string {
        return this.settings.password;
    }

    get getDbName(): string {
        return this.settings.dbName || 'time-tracker';
    }
}
