/**
 * auth.guard
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

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SettingsService } from '../settings/settings.service';
import { PATHS } from '../app.routes';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard  {

    constructor(private router: Router,
                private settingsService: SettingsService) {
    }

    canActivate(route: ActivatedRouteSnapshot,
                state: RouterStateSnapshot): boolean | UrlTree {
        if (this.settingsService.hasEnabledRemoteSync() &&
            !this.settingsService.getUser &&
            !this.settingsService.getPassword) {
            return this.router.parseUrl(`/${PATHS.Settings}`);
        }
        return true;
    }
}
