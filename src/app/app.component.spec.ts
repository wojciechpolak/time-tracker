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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';
import { DbService } from './services/db.service';
import { DataService } from './services/data.service';
import { LoggerService } from './services/logger.service';
import { SettingsService } from './settings/settings.service';

describe('AppComponent', () => {
    beforeEach(async () => {
        const versionUpdates = new Subject<unknown>();
        const unrecoverable = new Subject<unknown>();

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                {
                    provide: DataService,
                    useValue: {
                        isOnline: false,
                    },
                },
                {
                    provide: DbService,
                    useValue: {
                        isSyncActive: false,
                        isSyncError: false,
                    },
                },
                {
                    provide: LoggerService,
                    useValue: {
                        log: vi.fn(),
                    },
                },
                {
                    provide: SettingsService,
                    useValue: {
                        get: vi.fn().mockReturnValue({
                            showDebug: false,
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
                        unrecoverable: unrecoverable.asObservable(),
                        checkForUpdate: vi.fn(),
                        activateUpdate: vi.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: vi.fn(),
                    },
                },
                {
                    provide: MatSnackBar,
                    useValue: {
                        open: vi.fn().mockReturnValue({
                            onAction: () => of(undefined),
                        }),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});
