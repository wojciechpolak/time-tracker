/**
 * main.component
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

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppMaterialModules } from '../app-modules';
import { DataService } from '../services/data.service';
import { SettingsService } from '../settings/settings.service';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    imports: [
        ...AppMaterialModules,
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
    ]
})
export class MainComponent implements OnInit, OnDestroy {

    protected redirectToHttps: boolean = false;
    protected showDebug: boolean = false;

    private sub: Subscription = Subscription.EMPTY;

    constructor(private cd: ChangeDetectorRef,
                private settings: SettingsService,
                private dataService: DataService) {
    }

    ngOnInit() {
        const settings = this.settings.get();
        this.showDebug = settings.showDebug;
        this.redirectToHttps = settings.redirectToHttps;
        this.sub = this.dataService.onRefresh.subscribe(() => {
            this.cd.detectChanges();
        });
    }

    ngOnDestroy () {
        this.sub && this.sub.unsubscribe();
    }
}
