/**
 * settings.component
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

import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { z } from 'zod';

import { AppMaterialModules } from '../app-modules';
import { DataService } from '../services/data.service';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { SettingsService, Databases, DbEngine } from './settings.service';
import { environment } from '../../environments/environment';


const firebaseConfigSchema = z.object({
  apiKey: z.string(),
  authDomain: z.string(),
  projectId: z.string(),
  storageBucket: z.string(),
  messagingSenderId: z.string(),
  appId: z.string(),
}).strict();

function firebaseConfigValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
        return null;
    }
    try {
        const parsed = JSON.parse(control.value);
        firebaseConfigSchema.parse(parsed);
        return null;
    }
    catch (error: unknown) {
        console.error(error);
        return {invalidJson: true};
    }
}

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    imports: [
        ...AppMaterialModules,
        ReactiveFormsModule,
        KeyValuePipe,
        AsyncPipe,
    ]
})
export class SettingsComponent implements OnInit {

    protected databases = Databases;
    protected form: FormGroup;
    protected importFile?: File;
    protected importFileReady: boolean = false;
    protected storageInfo$!: Promise<string>;
    protected firebaseConfigPlaceholder = `{
   "apiKey": "",
   "authDomain": "",
   "projectId": "",
   "storageBucket": "",
   "messagingSenderId": "",
   "appId": ""
}`;

    constructor(private swUpdate: SwUpdate,
                private snackBar: MatSnackBar,
                private loggerService: LoggerService,
                private settingsService: SettingsService,
                private dbService: DbService,
                private dataService: DataService) {
        this.form = new FormGroup({
            user: new FormControl<string>(''),
            password: new FormControl<string>(''),
            dbEngine: new FormControl<DbEngine>('pouchdb'),
            dbName: new FormControl<string>(''),
            firebaseConfig: new FormControl<string>(''),
            endpoint: new FormControl<string>(''),
            enableRemoteSync: new FormControl<boolean>(false),
            redirectToHttps: new FormControl<boolean>(false),
            showDebug: new FormControl<boolean>(false),
        });
    }

    async ngOnInit() {
        await this.dbService.dbLoaded;
        this.storageInfo$ = this.getStorageEstimated();
        this.form.patchValue(this.settingsService.get());
        this.form.controls['dbName'].patchValue(
            this.settingsService.getDbName);

        this.form.get('dbEngine')?.valueChanges.subscribe((dbEngineValue: DbEngine) => {
            const firebaseConfigControl = this.form.get('firebaseConfig');
            if (dbEngineValue === 'firestore') {
                firebaseConfigControl?.setValidators(
                    [Validators.required, firebaseConfigValidator]);
            }
            else {
                firebaseConfigControl?.clearValidators();
            }
            firebaseConfigControl?.updateValueAndValidity();
        });
    }

    fillDefaultEndpoint($event: Event) {
        $event.preventDefault();
        this.form.controls['endpoint'].patchValue(
            this.settingsService.getEndpoint(false));
        this.form.markAsDirty();
    }

    cancel($event: Event) {
        $event.preventDefault();
        window.history.back();
    }

    async save() {
        if (!this.form.valid) {
            return;
        }
        const prevDbName = this.settingsService.getDbName;
        const prevEndpoint = this.settingsService.getEndpoint();
        const prevRemoteSync = this.settingsService.hasEnabledRemoteSync();
        this.settingsService.save(this.form.value);

        const dbNameChanged = this.settingsService.getDbName !== prevDbName;
        const endpointChanged = this.settingsService.getEndpoint() !== prevEndpoint;
        const remoteSyncChanged = this.settingsService.hasEnabledRemoteSync() !== prevRemoteSync;

        if (endpointChanged || remoteSyncChanged) {
            this.dbService.remoteSyncDisable();
        }
        if (dbNameChanged) {
            await this.dbService.closeDb();
            this.dbService.openDb();
            this.dataService.fetchAll();
        }
        if (endpointChanged || remoteSyncChanged) {
            this.dbService.remoteSyncEnable();
        }
        window.history.back();
        window.location.reload();
    }

    async checkForUpdate($event: Event) {
        $event.preventDefault();
        this.loggerService.log('swUpdate isEnabled:', this.swUpdate.isEnabled);
        if (this.swUpdate.isEnabled) {
            const res = await this.swUpdate.checkForUpdate();
            if (!res) {
                this.snackBar.open('Time Tracker is up to date', 'OK');
            }
            else {
                this.loggerService.log('swUpdate checkForUpdate:', res);
            }
        }
    }

    dbExport($event: Event) {
        $event.preventDefault();
        this.dbService.exportDb();
    }

    async dbImport($event: Event) {
        $event.preventDefault();
        if (confirm('Confirm?')) {
            await this.dbService.importDb(this.importFile);
            this.importFileReady = false;
            this.snackBar.open('Database imported', 'OK');
            this.dataService.fetchAll();
        }
    }

    importFileChange($event: Event) {
        if ($event.target) {
            const input = $event.target as HTMLInputElement;
            this.importFileReady = input.files?.length === 1;
            this.importFile = input.files?.[0];
        }
    }

    isOnline() {
        return window.navigator.onLine;
    }

    async getStorageEstimated(): Promise<string> {
        return await this.dbService.getStorageEstimated();
    }

    get version() {
        return environment.version;
    }
}
