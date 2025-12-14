/**
 * last-time-list.component
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

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { AppMaterialModules } from '../../app-modules';
import { DataService } from '../../services/data.service';
import { LastTimeComponent } from '../last-time.component';
import { PATHS } from '../../app.routes';
import { SettingsService } from '../../settings/settings.service';
import { LastTimeStore } from '../../store/last-time.store';

@Component({
    selector: 'app-last-time-list',
    templateUrl: './last-time-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ...AppMaterialModules,
        LastTimeComponent,
        AsyncPipe,
    ]
})
export class LastTimeListComponent implements OnInit {

    private settingsService = inject(SettingsService);
    private lastTimeStore = inject(LastTimeStore);
    protected dataService = inject(DataService);

    ngOnInit() {
        this.settingsService.update({lastPage: `/${PATHS.Main}/${PATHS.Last}`});
    }

    addLastTime() {
        this.lastTimeStore.addLastTime();
    }
}
