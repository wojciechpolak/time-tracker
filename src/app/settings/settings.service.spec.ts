/**
 * settings.service.spec
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

import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Settings } from '../models';
import { LoggerService } from '../services/logger.service';
import { SettingsStore } from '../store/settings.store';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
    let service: SettingsService;
    let settingsSignal: WritableSignal<Settings>;
    let settingsStore: {
        settings: WritableSignal<Settings>;
        load: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };
    let loggerService: {
        log: ReturnType<typeof vi.fn>;
    };

    const baseSettings: Settings = {
        dbEngine: 'pouchdb',
        dbName: 'time-tracker',
        endpoint: 'db.example.com',
        user: 'alice',
        password: 'secret',
        lastPage: '/main',
        enableRemoteSync: true,
        firebaseConfig: '{"projectId":"demo"}',
        redirectToHttps: false,
        showDebug: false,
    };

    beforeEach(() => {
        settingsSignal = signal({ ...baseSettings });
        settingsStore = {
            settings: settingsSignal,
            load: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
        };
        loggerService = {
            log: vi.fn(),
        };

        TestBed.configureTestingModule({
            providers: [
                SettingsService,
                { provide: LoggerService, useValue: loggerService },
                { provide: SettingsStore, useValue: settingsStore },
            ],
        });

        service = TestBed.inject(SettingsService);
    });

    it('loads settings on construction and proxies load/save/update/get to the store', () => {
        expect(settingsStore.load).toHaveBeenCalledTimes(1);

        service.load();
        service.save(baseSettings);
        service.update({ endpoint: 'updated.example.com' });

        expect(settingsStore.load).toHaveBeenCalledTimes(2);
        expect(settingsStore.save).toHaveBeenCalledWith(baseSettings);
        expect(settingsStore.update).toHaveBeenCalledWith({ endpoint: 'updated.example.com' });
        expect(service.get()).toEqual(baseSettings);
    });

    it('emits settings changes when the signal store updates', () => {
        const emitSpy = vi.spyOn(service.settingsChanged, 'emit');

        settingsSignal.set({
            ...baseSettings,
            endpoint: 'next.example.com',
        });
        TestBed.flushEffects();

        expect(emitSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                endpoint: 'next.example.com',
            }),
        );
    });

    it('reports whether endpoint and remote sync are enabled', () => {
        expect(service.hasEndpoint()).toBe(true);
        expect(service.hasEnabledRemoteSync()).toBe(true);

        settingsSignal.set({
            ...baseSettings,
            endpoint: '',
            enableRemoteSync: false,
        });

        expect(service.hasEndpoint()).toBe(false);
        expect(service.hasEnabledRemoteSync()).toBe(false);
    });

    it('builds an authenticated endpoint, defaults the port, and logs a redacted URL', () => {
        const endpoint = service.getEndpoint();

        expect(endpoint).toBe('http://alice:secret@db.example.com:5984/time-tracker');
        expect(loggerService.log).toHaveBeenCalledWith(
            'getEndpoint',
            'http://alice:***@db.example.com:5984/time-tracker',
        );
    });

    it('keeps https endpoints on their original port and can omit credentials', () => {
        settingsSignal.set({
            ...baseSettings,
            endpoint: 'https://secure.example.com',
        });

        expect(service.getEndpoint(false)).toBe('https://secure.example.com/');
    });

    it('returns undefined when credentials are required but missing', () => {
        settingsSignal.set({
            ...baseSettings,
            user: '',
            password: '',
        });

        expect(service.getEndpoint()).toBeUndefined();
        expect(loggerService.log).not.toHaveBeenCalled();
    });

    it('exposes convenience getters and parses firebase config', () => {
        settingsSignal.set({
            ...baseSettings,
            dbEngine: 'firestore',
            dbName: '',
            firebaseConfig: '{"apiKey":"abc"}',
        });

        expect(service.getUser).toBe('alice');
        expect(service.getPassword).toBe('secret');
        expect(service.getDbEngine).toBe('firestore');
        expect(service.getDbName).toBe('time-tracker');
        expect(service.getFirebaseOptions).toEqual({ apiKey: 'abc' });
    });
});
