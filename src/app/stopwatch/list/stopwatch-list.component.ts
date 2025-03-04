/**
 * stopwatch-list.component
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

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppTitle, Stopwatch } from '../../models';
import { AppMaterialModules } from '../../app-modules';
import { DataService } from '../../services/data.service';
import { PATHS } from '../../app.routes';
import { SettingsService } from '../../settings/settings.service';
import { StopwatchActions } from '../../store/stopwatch';
import { StopwatchComponent } from '../stopwatch.component';

@Component({
    selector: 'app-stopwatch-list',
    templateUrl: './stopwatch-list.component.html',
    imports: [
        ...AppMaterialModules,
        StopwatchComponent,
        AsyncPipe,
    ]
})
export class StopwatchListComponent implements OnInit, OnDestroy {

    private settingsService = inject(SettingsService);
    private store = inject(Store);
    protected dataService = inject(DataService);

    private sub1!: Subscription;

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Stopwatch}`});

        this.sub1 = this.dataService.stopwatches$.subscribe((stopwatches: Stopwatch[]) => {
            // signal if at least one stopwatch is running...
            const swIsRunning = stopwatches.find(item => {
                const lastEventItem = item.events[item.events.length - 1] ?? {};
                return lastEventItem.ss;
            });
            if (swIsRunning) {
                document.title = '🟢 ' + AppTitle;
            }
            else {
                document.title = AppTitle;
            }
        });
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }

    addStopwatch() {
        this.store.dispatch(StopwatchActions.addStopwatch());
    }
}
