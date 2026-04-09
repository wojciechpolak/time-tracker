/**
 * auth.guard.spec
 *
 * Time Tracker Copyright (C) 2026 Wojciech Polak
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

import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsService } from '../settings/settings.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let mockSettingsService: {
        hasEnabledRemoteSync: ReturnType<typeof vi.fn>;
        getUser: string;
        getPassword: string;
    };

    beforeEach(() => {
        mockSettingsService = {
            hasEnabledRemoteSync: vi.fn().mockReturnValue(false),
            getUser: '',
            getPassword: '',
        };

        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                provideRouter([]),
                { provide: SettingsService, useValue: mockSettingsService },
            ],
        });

        guard = TestBed.inject(AuthGuard);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('allows activation when remote sync is disabled', () => {
        mockSettingsService.hasEnabledRemoteSync.mockReturnValue(false);
        expect(guard.canActivate()).toBe(true);
    });

    it('allows activation when remote sync is enabled and user credentials exist', () => {
        mockSettingsService.hasEnabledRemoteSync.mockReturnValue(true);
        mockSettingsService.getUser = 'admin';
        mockSettingsService.getPassword = 'secret';
        expect(guard.canActivate()).toBe(true);
    });

    it('allows activation when remote sync is enabled and only user is set', () => {
        mockSettingsService.hasEnabledRemoteSync.mockReturnValue(true);
        mockSettingsService.getUser = 'admin';
        mockSettingsService.getPassword = '';
        expect(guard.canActivate()).toBe(true);
    });

    it('redirects to settings when remote sync is enabled but no credentials', () => {
        mockSettingsService.hasEnabledRemoteSync.mockReturnValue(true);
        mockSettingsService.getUser = '';
        mockSettingsService.getPassword = '';

        const result = guard.canActivate();

        expect(result).toBeInstanceOf(UrlTree);
        expect((result as UrlTree).toString()).toBe('/settings');
    });
});
