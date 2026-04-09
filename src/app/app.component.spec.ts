/**
 * app.component.spec
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';
import { DbService } from './services/db.service';
import { DataService } from './services/data.service';
import { LoggerService } from './services/logger.service';
import { SettingsService } from './settings/settings.service';

function makeProviders(overrides: {
    settings?: object;
    swUpdate?: object;
    router?: object;
    dataService?: object;
    dbService?: object;
}) {
    const versionUpdates$ = overrides.swUpdate
        ? (overrides.swUpdate as { versionUpdates: Subject<unknown> }).versionUpdates
        : new Subject<unknown>();

    return [
        provideZonelessChangeDetection(),
        {
            provide: DataService,
            useValue: overrides.dataService ?? { isOnline: false },
        },
        {
            provide: DbService,
            useValue: overrides.dbService ?? { isSyncActive: false, isSyncError: false },
        },
        {
            provide: LoggerService,
            useValue: { log: vi.fn() },
        },
        {
            provide: SettingsService,
            useValue: {
                get: vi.fn().mockReturnValue(
                    overrides.settings ?? {
                        showDebug: false,
                        redirectToHttps: false,
                        lastPage: '',
                    },
                ),
            },
        },
        {
            provide: SwUpdate,
            useValue: overrides.swUpdate ?? {
                isEnabled: false,
                versionUpdates: versionUpdates$,
                unrecoverable: of(),
                checkForUpdate: vi.fn(),
                activateUpdate: vi.fn().mockResolvedValue(undefined),
            },
        },
        {
            provide: Router,
            useValue: overrides.router ?? { navigate: vi.fn() },
        },
        {
            provide: MatSnackBar,
            useValue: {
                open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
            },
        },
    ];
}

describe('AppComponent', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
    });

    it('should create the app', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({}),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('navigates to lastPage on init when lastPage is set', async () => {
        const navigate = vi.fn();
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({
                settings: { redirectToHttps: false, lastPage: '/main/last-time' },
                router: { navigate },
            }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        expect(navigate).toHaveBeenCalledWith(['/main/last-time']);
    });

    it('does not navigate when lastPage is empty', async () => {
        const navigate = vi.fn();
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({
                settings: { redirectToHttps: false, lastPage: '' },
                router: { navigate },
            }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        expect(navigate).not.toHaveBeenCalled();
    });

    it('logs VERSION_DETECTED events', async () => {
        const versionUpdates = new Subject<unknown>();
        const logger = { log: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: { isOnline: false } },
                { provide: DbService, useValue: { isSyncActive: false, isSyncError: false } },
                { provide: LoggerService, useValue: logger },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({
                            redirectToHttps: false,
                            lastPage: '',
                        }),
                    },
                },
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled: false,
                        versionUpdates: versionUpdates.asObservable(),
                        unrecoverable: of(),
                        checkForUpdate: vi.fn(),
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                { provide: Router, useValue: { navigate: vi.fn() } },
                {
                    provide: MatSnackBar,
                    useValue: {
                        open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'abc123' } });

        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    });

    it('shows snackbar and logs VERSION_READY events', async () => {
        const versionUpdates = new Subject<unknown>();
        const snackOpen = vi.fn().mockReturnValue({ onAction: () => of(undefined) });

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: { isOnline: false } },
                { provide: DbService, useValue: { isSyncActive: false, isSyncError: false } },
                { provide: LoggerService, useValue: { log: vi.fn() } },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({ redirectToHttps: false, lastPage: '' }),
                    },
                },
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled: false,
                        versionUpdates: versionUpdates.asObservable(),
                        unrecoverable: of(),
                        checkForUpdate: vi.fn(),
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                { provide: Router, useValue: { navigate: vi.fn() } },
                { provide: MatSnackBar, useValue: { open: snackOpen } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        versionUpdates.next({
            type: 'VERSION_READY',
            currentVersion: { hash: 'old' },
            latestVersion: { hash: 'new' },
        });

        expect(snackOpen).toHaveBeenCalledWith('New app version is available.', 'Reload');
    });

    it('logs VERSION_INSTALLATION_FAILED events', async () => {
        const versionUpdates = new Subject<unknown>();
        const logger = { log: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: { isOnline: false } },
                { provide: DbService, useValue: { isSyncActive: false, isSyncError: false } },
                { provide: LoggerService, useValue: logger },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({ redirectToHttps: false, lastPage: '' }),
                    },
                },
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled: false,
                        versionUpdates: versionUpdates.asObservable(),
                        unrecoverable: of(),
                        checkForUpdate: vi.fn(),
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                { provide: Router, useValue: { navigate: vi.fn() } },
                {
                    provide: MatSnackBar,
                    useValue: {
                        open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        versionUpdates.next({
            type: 'VERSION_INSTALLATION_FAILED',
            version: { hash: 'bad' },
            error: 'network failure',
        });

        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('bad'));
    });

    it('shows snackbar for unrecoverable errors', async () => {
        const unrecoverable = new Subject<unknown>();
        const snackOpen = vi.fn().mockReturnValue({ onAction: () => of(undefined) });

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: { isOnline: false } },
                { provide: DbService, useValue: { isSyncActive: false, isSyncError: false } },
                { provide: LoggerService, useValue: { log: vi.fn() } },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({ redirectToHttps: false, lastPage: '' }),
                    },
                },
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled: false,
                        versionUpdates: of(),
                        unrecoverable: unrecoverable.asObservable(),
                        checkForUpdate: vi.fn(),
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                { provide: Router, useValue: { navigate: vi.fn() } },
                { provide: MatSnackBar, useValue: { open: snackOpen } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        unrecoverable.next({ reason: 'disk full' });

        expect(snackOpen).toHaveBeenCalledWith(expect.stringContaining('disk full'), 'Reload');
    });

    it('isConnected returns dataService.isOnline', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({ dataService: { isOnline: true } }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance.isConnected).toBe(true);
    });

    it('isSyncActive returns dbService.isSyncActive', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({ dbService: { isSyncActive: true, isSyncError: false } }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance.isSyncActive).toBe(true);
    });

    it('isSyncError returns dbService.isSyncError', async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({ dbService: { isSyncActive: false, isSyncError: true } }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance.isSyncError).toBe(true);
    });

    it('onClickSettings navigates to /settings', async () => {
        const navigate = vi.fn();
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({ router: { navigate } }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.componentInstance.onClickSettings();
        expect(navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('navigateToMain uses lastPage when set', async () => {
        const navigate = vi.fn();
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({
                settings: { redirectToHttps: false, lastPage: '/main/stopwatch' },
                router: { navigate },
            }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.componentInstance.navigateToMain();
        expect(navigate).toHaveBeenCalledWith(['/main/stopwatch']);
    });

    it('navigateToMain falls back to / when lastPage is empty', async () => {
        const navigate = vi.fn();
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: makeProviders({
                settings: { redirectToHttps: false, lastPage: '' },
                router: { navigate },
            }),
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.componentInstance.navigateToMain();
        expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('schedules SW update checks when swUpdate is enabled', async () => {
        const checkForUpdate = vi.fn().mockResolvedValue(false);

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: { isOnline: false } },
                { provide: DbService, useValue: { isSyncActive: false, isSyncError: false } },
                { provide: LoggerService, useValue: { log: vi.fn() } },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({ redirectToHttps: false, lastPage: '' }),
                    },
                },
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled: true,
                        versionUpdates: of(),
                        unrecoverable: of(),
                        checkForUpdate,
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                { provide: Router, useValue: { navigate: vi.fn() } },
                {
                    provide: MatSnackBar,
                    useValue: {
                        open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        // When swUpdate.isEnabled is true, checkForUpdate is scheduled once the app is stable.
        // In the test env the app stabilizes quickly.
        await vi.waitFor(() => expect(checkForUpdate).toHaveBeenCalled(), { timeout: 3000 });
    });
});
