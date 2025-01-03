/**
 * main
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

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideMomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { AppComponent } from './app/app.component';
import { CoreModule } from './app/core/core.module';
import { DATE_FORMAT } from './app/models';
import { DataService } from './app/services/data.service';
import { DbService } from './app/services/db.service';
import { LastTimeService } from './app/last-time/last-time.service';
import { SettingsService } from './app/settings/settings.service';
import { StopwatchService } from './app/stopwatch/stopwatch.service';
import { TimerService } from './app/services/timer.service';
import { appEffects } from './app/store/app.effects';
import { appReducer } from './app/store/app.reducer';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            BrowserModule,
            AppRoutingModule,
            ServiceWorkerModule.register('ngsw-worker.js', {
                enabled: environment.production,
                // Register the ServiceWorker as soon as the app is stable
                // or after 30 seconds (whichever comes first).
                registrationStrategy: 'registerWhenStable:30000'
            }),
            CoreModule,
            ReactiveFormsModule,
            FormsModule,
        ),
        DataService,
        DbService,
        LastTimeService,
        SettingsService,
        StopwatchService,
        TimerService,
        provideMomentDatetimeAdapter(DATE_FORMAT),
        provideCharts(withDefaultRegisterables()),
        provideAnimations(),
        provideEffects(appEffects),
        provideStore(appReducer),
        !environment.production && {...provideStoreDevtools()} || [],
        { provide: APP_BASE_HREF, useValue: environment.baseHref },
    ]
}).catch(err => console.error(err));
