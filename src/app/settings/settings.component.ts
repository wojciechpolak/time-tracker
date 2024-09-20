/**
 * settings.component
 *
 * Time Tracker Copyright (C) 2023, 2024 Wojciech Polak
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
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { SwUpdate } from '@angular/service-worker';

import { environment } from '../../environments/environment';
import { DataService } from '../services/data.service';
import { SettingsService } from './settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

    protected form: UntypedFormGroup;
    protected importFile?: File;
    protected importFileReady: boolean = false;

    constructor(private swUpdate: SwUpdate,
                private snackBar: MatSnackBar,
                private settingsService: SettingsService,
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
        this.dataService.estimateStorage();
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
            this.dataService.remoteSyncDisable();
        }
        if (dbNameChanged) {
            await this.dataService.closeDb();
            this.dataService.openDb();
            this.dataService.fetch();
        }
        if (endpointChanged || remoteSyncChanged) {
            this.dataService.remoteSyncEnable();
        }
        window.history.back();
    }

    async checkForUpdate($event: Event) {
        $event.preventDefault();
        if (this.swUpdate.isEnabled) {
            const res = await this.swUpdate.checkForUpdate();
            if (!res) {
                this.snackBar.open('Time Tracker is up to date', 'OK');
            }
        }
    }

    dbExport($event: Event) {
        $event.preventDefault();
        this.dataService.exportDb();
    }

    async dbImport($event: Event) {
        $event.preventDefault();
        if (confirm('Confirm?')) {
            await this.dataService.importDb(this.importFile);
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
        return this.dataService.storageEstimated;
    }

    get version() {
        return environment.version;
    }
}
