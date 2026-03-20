/**
 * storage.service.spec
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

import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageService, SessionStorageService, StorageService } from './storage.service';
import { WINDOW_TOKEN } from '../core/core';

class FakeStorage implements Storage {
    [key: string]: unknown;

    get length() {
        return Object.keys(this.entries()).length;
    }

    clear(): void {
        for (const key of Object.keys(this.entries())) {
            Reflect.deleteProperty(this, key);
        }
    }

    getItem(key: string): string | null {
        const value = this[key];
        return typeof value === 'string' ? value : null;
    }

    key(index: number): string | null {
        return Object.keys(this.entries())[index] ?? null;
    }

    removeItem(key: string): void {
        Reflect.deleteProperty(this, key);
    }

    setItem(key: string, value: string): void {
        this[key] = value;
    }

    private entries(): Record<string, string> {
        const values: Record<string, string> = {};
        for (const [key, value] of Object.entries(this)) {
            if (typeof value === 'string') {
                values[key] = value;
            }
        }
        return values;
    }
}

class TestStorageService extends StorageService {
    protected override $s: Storage;

    constructor(storage: Storage) {
        super();
        this.$s = storage;
    }
}

describe('StorageService', () => {
    let storage: FakeStorage;
    let service: TestStorageService;

    beforeEach(() => {
        storage = new FakeStorage();
        service = new TestStorageService(storage);
    });

    it('serializes and deserializes JSON values by default', () => {
        service.set('settings', { theme: 'light' });

        expect(storage.getItem('settings')).toBe('{"theme":"light"}');
        expect(service.get('settings')).toEqual({ theme: 'light' });
    });

    it('stores plain strings when JSON handling is disabled', () => {
        service.set('token', 'plain-text', false);

        expect(service.get('token', false)).toBe('plain-text');
    });

    it('removes matching keys by prefix only', () => {
        service.set('sw-1', { value: 1 });
        service.set('sw-2', { value: 2 });
        service.set('lt-1', { value: 3 });

        service.removeByKeyPrefix('sw-');

        expect(storage.getItem('sw-1')).toBeNull();
        expect(storage.getItem('sw-2')).toBeNull();
        expect(service.get('lt-1')).toEqual({ value: 3 });
    });

    it('removes individual keys and clears the whole storage', () => {
        service.set('first', 1);
        service.set('second', 2);

        service.remove('first');
        expect(storage.getItem('first')).toBeNull();

        service.clear();
        expect(storage.length).toBe(0);
    });
});

describe('Browser storage services', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('uses window.localStorage when local storage is available', () => {
        const localStorage = new FakeStorage();
        TestBed.configureTestingModule({
            providers: [
                LocalStorageService,
                { provide: WINDOW_TOKEN, useValue: { localStorage } as Partial<Window> },
            ],
        });

        const service = TestBed.inject(LocalStorageService);
        service.set('key', { value: true });

        expect(service.get('key')).toEqual({ value: true });
    });

    it('uses window.sessionStorage when session storage is available', () => {
        const sessionStorage = new FakeStorage();
        TestBed.configureTestingModule({
            providers: [
                SessionStorageService,
                { provide: WINDOW_TOKEN, useValue: { sessionStorage } as Partial<Window> },
            ],
        });

        const service = TestBed.inject(SessionStorageService);
        service.set('key', 'value', false);

        expect(service.get('key', false)).toBe('value');
    });

    it('throws when the provided storage backend is unavailable', () => {
        const localStorage = new FakeStorage();
        vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        TestBed.configureTestingModule({
            providers: [
                LocalStorageService,
                { provide: WINDOW_TOKEN, useValue: { localStorage } as Partial<Window> },
            ],
        });

        expect(() => TestBed.inject(LocalStorageService)).toThrow('Storage Not Available!');
    });
});
