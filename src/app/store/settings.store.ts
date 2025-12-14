/**
 * store/settings.store
 *
 * Time Tracker Copyright (C) 2025 Wojciech Polak
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

import { inject } from '@angular/core';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Settings } from '../models';
import { LocalStorageService } from '../services/storage.service';
import { environment } from '../../environments/environment';

const withDevtools = environment.storeWithDevTools;
const STORAGE_SETTINGS = 'settings';

export interface SettingsState {
    settings: Settings;
}

const initialState: SettingsState = {
    settings: {} as Settings,
};

const Actions = {
    load: 'loadSettings',
    save: 'saveSettings',
    update: 'updateSettings',
} as const;

export const SettingsStore = signalStore(
    {providedIn: 'root'},
    withDevtools('settings'),
    withState(initialState),
    withMethods((store, localStorage = inject(LocalStorageService)) => ({

        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        load: rxMethod<void>(
            pipe(
                tap(() => {
                    const settings = localStorage.get(STORAGE_SETTINGS) ?? {};
                    updateState(store, Actions.load, {settings});
                })
            )
        ),

        save: rxMethod<Settings>(
            pipe(
                tap((settings) => {
                    localStorage.set(STORAGE_SETTINGS, settings);
                    updateState(store, Actions.save, {settings});
                })
            )
        ),

        update: rxMethod<Partial<Settings>>(
            pipe(
                tap((partialSettings) => {
                    const currentSettings = store.settings();
                    const newSettings = {...currentSettings, ...partialSettings};
                    localStorage.set(STORAGE_SETTINGS, newSettings);
                    updateState(store, Actions.update, {settings: newSettings});
                })
            )
        ),
    }))
);
