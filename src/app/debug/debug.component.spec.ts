/**
 * debug.component.spec
 *
 * Time Tracker Copyright (C) 2023-2026 Wojciech Polak
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { DebugComponent } from './debug.component';

describe('DebugComponent', () => {
    let fixture: ComponentFixture<DebugComponent>;
    let component: DebugComponent;
    let onLog$: Subject<string>;
    let mockDbService: {
        getStorageEstimated: ReturnType<typeof vi.fn>;
        deleteAll: ReturnType<typeof vi.fn>;
        clearLocalDB: ReturnType<typeof vi.fn>;
    };
    let mockLoggerService: {
        buf: string[];
        onLog: Subject<string>;
        clear: ReturnType<typeof vi.fn>;
        log: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        onLog$ = new Subject<string>();
        mockDbService = {
            getStorageEstimated: vi.fn().mockResolvedValue('1 KB'),
            deleteAll: vi.fn(),
            clearLocalDB: vi.fn(),
        };
        mockLoggerService = {
            buf: [],
            onLog: onLog$,
            clear: vi.fn(),
            log: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [DebugComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: DbService, useValue: mockDbService },
                { provide: LoggerService, useValue: mockLoggerService },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DebugComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('ngOnInit calls getStorageEstimated', () => {
        fixture.detectChanges();
        expect(mockDbService.getStorageEstimated).toHaveBeenCalled();
    });

    it('ngOnInit replays buf messages into the output element', () => {
        mockLoggerService.buf = ['msg-a', 'msg-b'];
        fixture.detectChanges();

        // After detectChanges the template is rendered; buf messages were logged during ngOnInit
        const output = document.querySelector('#output');
        expect(output).not.toBeNull();
        // 'Welcome!' + 2 buf messages = at least 3 items
        expect(output?.querySelectorAll('li').length).toBeGreaterThanOrEqual(3);
    });

    it('subscribes to onLog and appends new messages', () => {
        fixture.detectChanges();
        const output = document.querySelector('#output');
        expect(output).not.toBeNull();

        const before = output?.querySelectorAll('li').length ?? 0;
        onLog$.next('live message');
        expect(output?.querySelectorAll('li').length).toBeGreaterThan(before);
    });

    it('ngOnDestroy unsubscribes from onLog', () => {
        fixture.detectChanges();
        fixture.destroy();

        // Emitting after destroy should not throw
        expect(() => onLog$.next('after destroy')).not.toThrow();
    });

    it('getStorageEstimated delegates to dbService', async () => {
        fixture.detectChanges();
        const comp = component as unknown as { getStorageEstimated(): Promise<string> };
        const result = await comp.getStorageEstimated();
        expect(result).toBe('1 KB');
    });

    it('deleteAll calls dbService.deleteAll when confirmed', () => {
        fixture.detectChanges();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        component.deleteAll();
        expect(mockDbService.deleteAll).toHaveBeenCalled();
    });

    it('deleteAll does nothing when cancelled', () => {
        fixture.detectChanges();
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        component.deleteAll();
        expect(mockDbService.deleteAll).not.toHaveBeenCalled();
    });

    it('clearLocalDB calls dbService.clearLocalDB when confirmed', () => {
        fixture.detectChanges();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        component.clearLocalDB();
        expect(mockDbService.clearLocalDB).toHaveBeenCalled();
    });

    it('clearLocalDB does nothing when cancelled', () => {
        fixture.detectChanges();
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        component.clearLocalDB();
        expect(mockDbService.clearLocalDB).not.toHaveBeenCalled();
    });

    it('clearConsole calls loggerService.clear and empties the output element', () => {
        fixture.detectChanges();
        const output = document.querySelector('#output');
        expect(output).not.toBeNull();

        // Populate with content first
        const li = document.createElement('li');
        li.textContent = 'old message';
        output?.appendChild(li);
        expect(output?.querySelectorAll('li').length).toBeGreaterThan(0);

        component.clearConsole();

        expect(mockLoggerService.clear).toHaveBeenCalled();
        expect(output?.innerHTML).toBe('');
    });

    it('log appends a list item to the output element', () => {
        fixture.detectChanges();
        const comp = component as unknown as { log(msg: string): void };
        comp.log('hello world');

        const output = document.querySelector('#output');
        expect(output).not.toBeNull();
        const texts = Array.from(output?.querySelectorAll('li') ?? []).map((li) => li.textContent);
        expect(texts).toContain('hello world');
    });
});
