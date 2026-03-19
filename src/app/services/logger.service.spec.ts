/**
 * logger.service.spec
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

import { LoggerService } from './logger.service';

describe('LoggerService', () => {
    let service: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [LoggerService],
        });
        service = TestBed.inject(LoggerService);
    });

    it('stores formatted log messages, emits them, and forwards the original arguments to console', () => {
        const emitSpy = spyOn(service.onLog, 'emit');
        const consoleSpy = spyOn(console, 'log');
        const payload = { status: 'ok' };

        service.log('prefix', payload, 123);

        expect(service.buf).toEqual(['prefix {"status":"ok"} 123']);
        expect(emitSpy).toHaveBeenCalledWith('prefix {"status":"ok"} 123');
        expect(consoleSpy).toHaveBeenCalledWith('prefix', payload, 123);
    });

    it('clears the buffered log entries', () => {
        service.buf = ['one', 'two'];

        service.clear();

        expect(service.buf).toEqual([]);
    });
});
