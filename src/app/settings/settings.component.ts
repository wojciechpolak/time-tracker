/**
 * settings.component
 *
 * Time Tracker Copyright (C) 2023-2024 Wojciech Polak
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
import { UntypedFormControl, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppMaterialModules } from '../app-modules';
import { DataService } from '../services/data.service';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { SettingsService } from './settings.service';
import { environment } from '../../environments/environment';


@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    imports: [
        ...AppMaterialModules,
        ReactiveFormsModule,
    ]
})
export class SettingsComponent implements OnInit {

    protected form: UntypedFormGroup;
    protected importFile?: File;
    protected importFileReady: boolean = false;

    constructor(private swUpdate: SwUpdate,
                private snackBar: MatSnackBar,
                private loggerService: LoggerService,
                private settingsService: SettingsService,
                private dbService: DbService,
                private dataService: DataService) {
        this.form = new UntypedFormGroup({
            user: new UntypedFormControl(),
            password: new UntypedFormControl(),
            dbName: new UntypedFormControl(),
            endpoint: new UntypedFormControl(),
            enableRemoteSync: new UntypedFormControl(),
            redirectToHttps: new UntypedFormControl(),
            showDebug: new UntypedFormControl(),
        });
    }

    ngOnInit() {
        this.form.patchValue(this.settingsService.get());
        this.form.controls['dbName'].patchValue(
            this.settingsService.getDbName);
        this.dbService.estimateStorage();
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
        let prevDbName = this.settingsService.getDbName;
        let prevEndpoint = this.settingsService.getEndpoint();
        let prevRemoteSync = this.settingsService.hasEnabledRemoteSync();
        this.settingsService.save(this.form.value);

        let dbNameChanged = this.settingsService.getDbName !== prevDbName;
        let endpointChanged = this.settingsService.getEndpoint() !== prevEndpoint;
        let remoteSyncChanged = this.settingsService.hasEnabledRemoteSync() !== prevRemoteSync;

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
        }
    }

    importFileChange($event: Event) {
        if ($event.target) {
            let input = $event.target as HTMLInputElement;
            this.importFileReady = input.files?.length === 1;
            this.importFile = input.files?.[0];
        }
    }

    isOnline() {
        return window.navigator.onLine;
    }

    get storageEstimated() {
        return this.dbService.storageEstimated;
    }

    get version() {
        return environment.version;
    }
}
