/**
 * settings.component.spec
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
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataService } from '../services/data.service';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { SettingsComponent } from './settings.component';
import { SettingsService } from './settings.service';

describe('SettingsComponent', () => {
    let component: SettingsComponent;

    const dbServiceStub = {
        dbLoaded: Promise.resolve(),
        getStorageEstimated: vi.fn().mockResolvedValue('0 B'),
    };
    const dataServiceStub = {
        fetchAll: vi.fn(),
    };
    const loggerServiceStub = {
        log: vi.fn(),
    };
    const settingsServiceStub = {
        get: vi.fn().mockReturnValue({
            dbEngine: 'pouchdb',
            dbName: 'time-tracker',
            endpoint: '',
            user: '',
            password: '',
            lastPage: '',
            enableRemoteSync: false,
            firebaseConfig: '',
            redirectToHttps: false,
            showDebug: false,
        }),
        getDbName: 'time-tracker',
    };
    const snackBarStub = {
        open: vi.fn(),
    };
    const swUpdateStub = {
        isEnabled: false,
        checkForUpdate: vi.fn(),
        versionUpdates: of(),
        unrecoverable: of(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SettingsComponent],
            providers: [
                provideZonelessChangeDetection(),
                {
                    provide: DataService,
                    useValue: dataServiceStub,
                },
                {
                    provide: DbService,
                    useValue: dbServiceStub,
                },
                {
                    provide: LoggerService,
                    useValue: loggerServiceStub,
                },
                {
                    provide: SettingsService,
                    useValue: settingsServiceStub,
                },
                {
                    provide: SwUpdate,
                    useValue: swUpdateStub,
                },
                {
                    provide: MatSnackBar,
                    useValue: snackBarStub,
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('validates Firebase config JSON when Firestore is selected', () => {
        const form = component as unknown as { form: SettingsComponent['form'] };
        form.form.controls['dbEngine'].setValue('firestore');
        form.form.controls['firebaseConfig'].setValue('{"apiKey":"abc"}');

        expect(form.form.controls['firebaseConfig'].errors).toEqual({
            invalidJson: true,
        });
    });

    it('accepts a complete Firebase config payload', () => {
        const form = component as unknown as { form: SettingsComponent['form'] };
        form.form.controls['dbEngine'].setValue('firestore');
        form.form.controls['firebaseConfig'].setValue(
            '{"apiKey":"abc","authDomain":"example.firebaseapp.com","projectId":"demo","storageBucket":"demo.appspot.com","messagingSenderId":"123","appId":"1:123:web:456"}',
        );

        expect(form.form.controls['firebaseConfig'].errors).toBeNull();
    });
});
