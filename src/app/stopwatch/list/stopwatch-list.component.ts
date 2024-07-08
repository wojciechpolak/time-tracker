/**
 * stopwatch-list.component
 *
 * Time Tracker Copyright (C) 2023 Wojciech Polak
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

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { DataService } from '../../services/data.service';
import { LoggerService } from '../../services/logger.service';
import { PATHS } from '../../app-routing.module';
import { SettingsService } from '../../settings/settings.service';
import { Stopwatch, StopwatchEvent, Types } from '../../models';
import { UtilsService } from '../../services/utils.service';

@Component({
    selector: 'app-stopwatch-list',
    templateUrl: './stopwatch-list.component.html',
})
export class StopwatchListComponent implements OnInit {

    constructor(private cd: ChangeDetectorRef,
                private loggerService: LoggerService,
                private settingsService: SettingsService,
                private dataService: DataService) {
    }

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Stopwatch}`});
    }

    get stopwatches(): Stopwatch[] {
        return this.dataService.stopwatches;
    }

    get stopwatchesLoading(): boolean {
        return this.dataService.stopwatchesLoading;
    }

    addStopwatch() {
        let ts = UtilsService.getTimestamp();
        let stopwatch = {
            _id: Types.STOPWATCH + '-' + ts.toString(),
            type: Types.STOPWATCH,
            name: 'Stopwatch #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as Stopwatch;
        this.dataService.putItem(stopwatch, (doc: any) => {
            let timestamp: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: doc.id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: true,
                round: true,
            };
            this.dataService.putItem(timestamp, () => {
                this.loggerService.log('Successfully posted a new Stopwatch!');
            });
        });
    }
}
