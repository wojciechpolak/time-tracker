/**
 * logger.service
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

import { EventEmitter, Injectable } from '@angular/core';

@Injectable()
export class LoggerService {

    buf: string[] = [];
    onLog: EventEmitter<string> = new EventEmitter();

    log(...messages: unknown[]) {
        const msg = messages.map(m => {
            return typeof m === 'string' ? m : JSON.stringify(m);
        }).join(' ');
        this.buf.push(msg);
        this.onLog.emit(msg);
        console.log(...messages);
    }

    clear() {
        this.buf = [];
    }
}
