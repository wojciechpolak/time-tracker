/**
 * main
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

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideMomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';

import { AppComponent } from './app/app.component';
import { CoreModule } from './app/core/core.module';
import { DataService } from './app/services/data.service';
import { DATE_FORMAT } from './app/models';
import { environment } from './environments/environment';
import { SettingsService } from './app/settings/settings.service';
import { TimerService } from './app/services/timer.service';

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
        SettingsService,
        TimerService,
        provideMomentDatetimeAdapter(DATE_FORMAT),
        provideCharts(withDefaultRegisterables()),
        provideAnimations(),
        { provide: APP_BASE_HREF, useValue: environment.baseHref },
    ]
}).catch(err => console.error(err));
