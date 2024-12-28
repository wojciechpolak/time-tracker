/**
 * last-time-list.component
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

import { AppMaterialModules } from '../../app-modules';
import { LastTime } from '../../models';
import { LastTimeComponent } from '../last-time.component';
import { LastTimeService } from '../last-time.service';
import { PATHS } from '../../app-routing.module';
import { SettingsService } from '../../settings/settings.service';

@Component({
    selector: 'app-last-time-list',
    templateUrl: './last-time-list.component.html',
    imports: [
        ...AppMaterialModules,
        LastTimeComponent,
    ]
})
export class LastTimeListComponent implements OnInit {

    constructor(private settingsService: SettingsService,
                protected lastTimeService: LastTimeService) {
    }

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Last}`});
    }

    get lastTime(): LastTime[] {
        return this.lastTimeService.lastTime;
    }

    get lastTimeLoading(): boolean {
        return this.lastTimeService.lastTimeLoading;
    }
}
