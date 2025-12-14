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

import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { AppTitle } from '../../models';
import { AppMaterialModules } from '../../app-modules';
import { DataService } from '../../services/data.service';
import { PATHS } from '../../app.routes';
import { SettingsService } from '../../settings/settings.service';
import { StopwatchComponent } from '../stopwatch.component';
import { StopwatchStore } from '../../store/stopwatch.store';

@Component({
    selector: 'app-stopwatch-list',
    templateUrl: './stopwatch-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ...AppMaterialModules,
        StopwatchComponent,
        AsyncPipe,
    ]
})
export class StopwatchListComponent implements OnInit {

    private settingsService = inject(SettingsService);
    private stopwatchStore = inject(StopwatchStore);
    protected dataService = inject(DataService);

    constructor() {
        effect(() => {
            const stopwatches = this.dataService.stopwatches();
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

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Stopwatch}`});
    }

    addStopwatch() {
        this.stopwatchStore.addStopwatch();
    }
}
