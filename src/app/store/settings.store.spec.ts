/**
 * store/settings.store.spec
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

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Settings } from '../models';
import { LocalStorageService } from '../services/storage.service';
import { SettingsStore } from './settings.store';

const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
    dbEngine: 'pouchdb',
    user: '',
    password: '',
    lastPage: '/main/last-time',
    enableRemoteSync: false,
    firebaseConfig: '',
    redirectToHttps: false,
    showDebug: false,
    ...overrides,
});

describe('SettingsStore', () => {
    let store: InstanceType<typeof SettingsStore>;
    let mockLocalStorage: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        mockLocalStorage = {
            get: vi.fn().mockReturnValue(null),
            set: vi.fn(),
        };

        TestBed.configureTestingModule({
            providers: [
                provideZonelessChangeDetection(),
                SettingsStore,
                { provide: LocalStorageService, useValue: mockLocalStorage },
            ],
        });

        store = TestBed.inject(SettingsStore);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('starts with empty settings', () => {
        expect(store.settings()).toEqual({});
    });

    it('loads settings from localStorage', () => {
        const saved = makeSettings({ user: 'admin' });
        mockLocalStorage.get.mockReturnValue(saved);

        store.load();

        expect(mockLocalStorage.get).toHaveBeenCalledWith('settings');
        expect(store.settings()).toEqual(saved);
    });

    it('defaults to empty object when localStorage has no entry', () => {
        mockLocalStorage.get.mockReturnValue(null);
        store.load();
        expect(store.settings()).toEqual({});
    });

    it('saves settings to localStorage and updates state', () => {
        const settings = makeSettings({ user: 'admin', enableRemoteSync: true });
        store.save(settings);

        expect(mockLocalStorage.set).toHaveBeenCalledWith('settings', settings);
        expect(store.settings()).toEqual(settings);
    });

    it('merges partial settings on update without overwriting other fields', () => {
        const initial = makeSettings({ user: 'admin', showDebug: false });
        store.save(initial);

        store.update({ showDebug: true });

        expect(store.settings()).toMatchObject({ user: 'admin', showDebug: true });
        expect(mockLocalStorage.set).toHaveBeenLastCalledWith(
            'settings',
            expect.objectContaining({ user: 'admin', showDebug: true }),
        );
    });

    it('update persists the merged result not just the partial', () => {
        store.save(makeSettings({ user: 'alice', password: 'secret' }));
        store.update({ lastPage: '/main/stopwatch' });

        const saved = mockLocalStorage.set.mock.calls.at(-1)?.[1] as Settings;
        expect(saved.user).toBe('alice');
        expect(saved.password).toBe('secret');
        expect(saved.lastPage).toBe('/main/stopwatch');
    });
});
