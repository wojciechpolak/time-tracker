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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
        remoteSyncDisable: vi.fn(),
        remoteSyncEnable: vi.fn(),
        closeDb: vi.fn().mockResolvedValue(undefined),
        openDb: vi.fn(),
        exportDb: vi.fn(),
        importDb: vi.fn().mockResolvedValue(undefined),
        deleteAll: vi.fn(),
        clearLocalDB: vi.fn(),
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
        getEndpoint: vi.fn().mockReturnValue('http://localhost:5984/time-tracker'),
        hasEnabledRemoteSync: vi.fn().mockReturnValue(false),
        save: vi.fn(),
    };
    const snackBarStub = {
        open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
    };
    const swUpdateStub = {
        isEnabled: false,
        checkForUpdate: vi.fn().mockResolvedValue(false),
        versionUpdates: of(),
        unrecoverable: of(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SettingsComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DataService, useValue: dataServiceStub },
                { provide: DbService, useValue: dbServiceStub },
                { provide: LoggerService, useValue: loggerServiceStub },
                { provide: SettingsService, useValue: settingsServiceStub },
                { provide: SwUpdate, useValue: swUpdateStub },
                { provide: MatSnackBar, useValue: snackBarStub },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        settingsServiceStub.get.mockReturnValue({
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
        });
        settingsServiceStub.getDbName = 'time-tracker';
        settingsServiceStub.getEndpoint.mockReturnValue('http://localhost:5984/time-tracker');
        settingsServiceStub.hasEnabledRemoteSync.mockReturnValue(false);

        const fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        TestBed.resetTestingModule();
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

    it('clears Firebase validators when dbEngine switches back to pouchdb', () => {
        const form = component as unknown as { form: SettingsComponent['form'] };
        form.form.controls['dbEngine'].setValue('firestore');
        form.form.controls['dbEngine'].setValue('pouchdb');
        form.form.controls['firebaseConfig'].setValue('');

        expect(form.form.controls['firebaseConfig'].errors).toBeNull();
    });

    it('fillDefaultEndpoint patches the endpoint control', () => {
        settingsServiceStub.getEndpoint.mockReturnValue('http://localhost:5984/');
        const form = component as unknown as { form: SettingsComponent['form'] };
        component.fillDefaultEndpoint(new Event('click'));

        expect(settingsServiceStub.getEndpoint).toHaveBeenCalledWith(false);
        expect(form.form.controls['endpoint'].value).toBe('http://localhost:5984/');
    });

    it('cancel calls window.history.back', () => {
        const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        component.cancel(new Event('click'));
        expect(backSpy).toHaveBeenCalled();
    });

    it('save calls settingsService.save and navigates back', async () => {
        const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        const reloadSpy = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { ...window.location, reload: reloadSpy },
            configurable: true,
        });

        await component.save();

        expect(settingsServiceStub.save).toHaveBeenCalled();
        expect(backSpy).toHaveBeenCalled();
    });

    it('save is a no-op when the form is invalid', async () => {
        const form = component as unknown as { form: SettingsComponent['form'] };
        form.form.controls['dbEngine'].setValue('firestore');
        form.form.controls['firebaseConfig'].setValue('bad-json');

        await component.save();

        expect(settingsServiceStub.save).not.toHaveBeenCalled();
    });

    it('save calls remoteSyncDisable/Enable when endpoint changes', async () => {
        vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        settingsServiceStub.getEndpoint
            .mockReturnValueOnce('http://old:5984/')
            .mockReturnValueOnce('http://new:5984/');

        await component.save();

        expect(dbServiceStub.remoteSyncDisable).toHaveBeenCalled();
        expect(dbServiceStub.remoteSyncEnable).toHaveBeenCalled();
    });

    it('save reopens the db when dbName changes', async () => {
        vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        settingsServiceStub.getDbName = 'time-tracker';
        // after save(), stub returns new name
        settingsServiceStub.save.mockImplementation(() => {
            settingsServiceStub.getDbName = 'new-db';
        });

        await component.save();

        expect(dbServiceStub.closeDb).toHaveBeenCalled();
        expect(dbServiceStub.openDb).toHaveBeenCalled();
        expect(dataServiceStub.fetchAll).toHaveBeenCalled();
    });

    it('checkForUpdate is a no-op when swUpdate is disabled', async () => {
        await component.checkForUpdate(new Event('click'));
        expect(swUpdateStub.checkForUpdate).not.toHaveBeenCalled();
    });

    it('checkForUpdate shows snackbar when already up to date', async () => {
        swUpdateStub.isEnabled = true;
        swUpdateStub.checkForUpdate.mockResolvedValue(false);

        await component.checkForUpdate(new Event('click'));

        expect(snackBarStub.open).toHaveBeenCalledWith('Time Tracker is up to date', 'OK');
        swUpdateStub.isEnabled = false;
    });

    it('checkForUpdate logs when a new version is found', async () => {
        swUpdateStub.isEnabled = true;
        swUpdateStub.checkForUpdate.mockResolvedValue(true);

        await component.checkForUpdate(new Event('click'));

        expect(loggerServiceStub.log).toHaveBeenCalled();
        swUpdateStub.isEnabled = false;
    });

    it('dbExport delegates to dbService', () => {
        component.dbExport(new Event('click'));
        expect(dbServiceStub.exportDb).toHaveBeenCalled();
    });

    it('dbImport calls dbService.importDb when confirmed', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        await component.dbImport(new Event('click'));
        expect(dbServiceStub.importDb).toHaveBeenCalled();
        expect(snackBarStub.open).toHaveBeenCalledWith('Database imported', 'OK');
    });

    it('dbImport does nothing when cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        await component.dbImport(new Event('click'));
        expect(dbServiceStub.importDb).not.toHaveBeenCalled();
    });

    it('importFileChange sets importFileReady when one file is selected', () => {
        const file = new File([''], 'backup.json');
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', {
            value: [file],
            configurable: true,
        });
        const event = new Event('change');
        Object.defineProperty(event, 'target', { value: input });

        component.importFileChange(event);

        const comp = component as unknown as {
            importFileReady: boolean;
            importFile: File | undefined;
        };
        expect(comp.importFileReady).toBe(true);
        expect(comp.importFile).toBe(file);
    });

    it('isOnline returns the navigator online status', () => {
        expect(component.isOnline()).toBe(navigator.onLine);
    });

    it('version returns the environment version object', () => {
        expect(component.version).toBeDefined();
    });
});
