/**
 * app.component
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

import { ApplicationRef, Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppMaterialModules } from './app-modules';
import { DataService } from './services/data.service';
import { DbService } from './services/db.service';
import { LoggerService } from './services/logger.service';
import { PATHS } from './app-routing.module';
import { SettingsService } from './settings/settings.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [
        ...AppMaterialModules,
        NgClass,
        RouterOutlet,
    ]
})
export class AppComponent implements OnInit {

    constructor(private router: Router,
                private appRef: ApplicationRef,
                private swUpdate: SwUpdate,
                private snackBar: MatSnackBar,
                private loggerService: LoggerService,
                private settingsService: SettingsService,
                private dbService: DbService,
                private dataService: DataService) {
    }

    ngOnInit() {
        let settings = this.settingsService.get();
        if (settings.redirectToHttps && window.location.protocol === 'http:') {
            let newLoc = window.location.href.replace('http://', 'https://');
            fetch(newLoc).then(() => {
                window.location.href = newLoc;
            }, (err) => {
                this.loggerService.log('Redirect to HTTPS', err);
            });
        }
        else if (settings.lastPage) {
            this.router.navigate([settings.lastPage]);
        }

        this.swUpdate.versionUpdates.subscribe(evt => {
            switch (evt.type) {
                case 'VERSION_DETECTED':
                    this.loggerService.log(`Downloading new app version: ${evt.version.hash}`);
                    break;
                case 'VERSION_READY':
                    this.loggerService.log(`Current app version: ${evt.currentVersion.hash}`);
                    this.loggerService.log(`New app version ready for use: ${evt.latestVersion.hash}`);
                    let snack = this.snackBar.open('New app version is available.', 'Reload');
                    snack.onAction().subscribe(() => {
                        this.swUpdate.activateUpdate()
                            .then(() => document.location.reload());
                    });
                    break;
                case 'VERSION_INSTALLATION_FAILED':
                    this.loggerService.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
                    break;
            }
        });

        this.swUpdate.unrecoverable.subscribe(event => {
            let snack = this.snackBar.open(
                `An error occurred that we cannot recover from: ${event.reason}`, 'Reload');
            snack.onAction().subscribe(() => {
                document.location.reload();
            });
        });

        if (this.swUpdate.isEnabled) {
            const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable));
            const updateHourInterval = 6;
            const updateInterval$ = interval(updateHourInterval * 60 * 60 * 1000);
            const updateChecker = concat(appIsStable$, updateInterval$);
            updateChecker.subscribe(() => this.swUpdate.checkForUpdate());
        }
    }

    get isConnected() {
        return this.dataService.isOnline;
    }

    get isSyncActive() {
        return this.dbService.isSyncActive;
    }

    get isSyncError() {
        return this.dbService.isSyncError;
    }

    onClickSettings() {
        this.router.navigate([`/${PATHS.Settings}`]);
    }

    navigateToMain() {
        let settings = this.settingsService.get();
        if (settings.lastPage) {
            this.router.navigate([settings.lastPage]);
        }
        else {
            this.router.navigate(['/']);
        }
    }
}
