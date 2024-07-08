/**
 * last-time-list.component
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

import { Component, OnInit } from '@angular/core';

import { DataService } from '../../services/data.service';
import { LastTime, TimeStamp, Types } from '../../models';
import { LoggerService } from '../../services/logger.service';
import { PATHS } from '../../app-routing.module';
import { SettingsService } from '../../settings/settings.service';
import { UtilsService } from '../../services/utils.service';

@Component({
    selector: 'app-last-time-list',
    templateUrl: './last-time-list.component.html'
})
export class LastTimeListComponent implements OnInit {

    constructor(private loggerService: LoggerService,
                private settingsService: SettingsService,
                private dataService: DataService) {
    }

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Last}`});
    }

    get lastTime(): LastTime[] {
        return this.dataService.lastTime;
    }

    get lastTimeLoading(): boolean {
        return this.dataService.lastTimeLoading;
    }

    addLastTime() {
        let ts = UtilsService.getTimestamp();
        let lastTime = {
            _id: Types.LAST_TIME + '-' + ts.toString(),
            type: Types.LAST_TIME,
            name: 'Last #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as LastTime;
        this.dataService.putItem(lastTime, (doc: any) => {
            let timestamp: TimeStamp = {
                _id: Types.LAST_TIME_TS + '-' + ts.toString(),
                ref: doc.id,
                type: Types.LAST_TIME_TS,
                ts: ts,
            };
            this.dataService.putItem(timestamp, () => {
                this.loggerService.log('Successfully posted a new LastTime!');
            });
        });
    }
}
