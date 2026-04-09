/**
 * last-time-list.component.spec
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataService } from '../../services/data.service';
import { LastTimeStore } from '../../store/last-time.store';
import { SettingsService } from '../../settings/settings.service';
import { LastTimeListComponent } from './last-time-list.component';

describe('LastTimeListComponent', () => {
    let component: LastTimeListComponent;
    let fixture: ComponentFixture<LastTimeListComponent>;
    let mockLastTimeStore: { addLastTime: ReturnType<typeof vi.fn> };
    let mockSettingsService: { update: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        mockLastTimeStore = { addLastTime: vi.fn() };
        mockSettingsService = { update: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [LastTimeListComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: LastTimeStore, useValue: mockLastTimeStore },
                {
                    provide: DataService,
                    useValue: {
                        lastTimeList: signal([]),
                        lastTimeLoading: signal(false),
                        lastTimeLoadingAll: signal(false),
                    },
                },
                { provide: SettingsService, useValue: mockSettingsService },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(LastTimeListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('records the current page in settings on init', () => {
        expect(mockSettingsService.update).toHaveBeenCalledWith({
            lastPage: '/main/last-time',
        });
    });

    it('delegates addLastTime to the store', () => {
        component.addLastTime();
        expect(mockLastTimeStore.addLastTime).toHaveBeenCalledOnce();
    });
});
