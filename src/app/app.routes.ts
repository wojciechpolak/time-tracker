/**
 * app.routes
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

import { Routes } from '@angular/router';

import { AuthGuard } from './services/auth.guard';
import { DebugComponent } from './debug/debug.component';
import { LastTimeListComponent } from './last-time/list/last-time-list.component';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { StopwatchListComponent } from './stopwatch/list/stopwatch-list.component';

export const PATHS = {
    Main: 'main',
    Last: 'last-time',
    Stopwatch: 'stopwatch',
    Settings: 'settings',
    Debug: 'debug',
}

export const routes: Routes = [
    {
        path: PATHS.Main,
        component: MainComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: `${PATHS.Last}`,
            },
            {
                path: PATHS.Last,
                component: LastTimeListComponent,
            },
            {
                path: PATHS.Stopwatch,
                component: StopwatchListComponent,
            },
            {
                path: PATHS.Debug,
                component: DebugComponent
            }
        ]
    },
    {
        path: PATHS.Settings,
        component: SettingsComponent
    },
    {
        path: '',
        redirectTo: `/${PATHS.Main}/${PATHS.Last}`,
        pathMatch: 'full'
    },
];
