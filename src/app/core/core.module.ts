/**
 * core.module
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

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { LocalStorageService, SessionStorageService } from '../services/storage.service';
import { LoggerService } from '../services/logger.service';

@NgModule({
    providers: [
        LoggerService,
        LocalStorageService,
        SessionStorageService,
        {provide: '$window', useFactory: getWindow},
    ]
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule is already loaded.');
        }
    }
}

export function getWindow() {
    return window;
}
