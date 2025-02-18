/**
 * app.config
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

import { ApplicationConfig } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideMomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { DATE_FORMAT } from './models';
import { DataService } from './services/data.service';
import { DbService } from './services/db.service';
import { DynamicDbService } from './services/dynamic-db.service';
import { LastTimeService } from './last-time/last-time.service';
import { SettingsService } from './settings/settings.service';
import { StopwatchService } from './stopwatch/stopwatch.service';
import { TimerService } from './services/timer.service';
import { appEffects } from './store/app.effects';
import { appReducer } from './store/app.reducer';
import { environment } from '../environments/environment';
import { provideCore } from './core/core';
import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
    providers: [
        DataService,
        LastTimeService,
        SettingsService,
        StopwatchService,
        TimerService,
        {provide: DbService, useClass: DynamicDbService},
        provideCore(),
        provideRouter(routes),
        provideServiceWorker('ngsw-worker.js', {
            enabled: environment.production,
            // Register the ServiceWorker as soon as the app is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        }),
        provideMomentDatetimeAdapter(DATE_FORMAT),
        provideCharts(withDefaultRegisterables()),
        provideAnimations(),
        provideEffects(appEffects),
        provideStore(appReducer),
        !environment.production && {...provideStoreDevtools()} || [],
        {provide: APP_BASE_HREF, useValue: environment.baseHref},
    ]
};
