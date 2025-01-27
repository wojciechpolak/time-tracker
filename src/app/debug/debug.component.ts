/**
 * debug.component
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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppMaterialModules } from '../app-modules';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';


@Component({
    selector: 'app-debug',
    templateUrl: './debug.component.html',
    imports: [
        ...AppMaterialModules,
    ]
})
export class DebugComponent implements OnInit, OnDestroy {

    private sub!: Subscription;

    constructor(private loggerService: LoggerService,
                private dbService: DbService) {
    }

    ngOnInit() {
        this.dbService.estimateStorage();
        this.log('Welcome!');
        for (const msg of this.loggerService.buf) {
            this.log(msg);
        }
        this.sub = this.loggerService.onLog.subscribe((msg: string) => {
            this.log(msg);
        });
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    get storageEstimated() {
        return this.dbService.storageEstimated;
    }

    deleteAll() {
        if (confirm('Confirm?')) {
            this.dbService.deleteAll();
        }
    }

    clearLocalDB() {
        if (confirm('Confirm?')) {
            this.dbService.clearLocalDB();
        }
    }

    clearConsole() {
        this.loggerService.clear();
        const output = document.querySelector('#output') as HTMLDivElement;
        if (output) {
            output.innerHTML = '';
        }
    }

    log(msg: string) {
        const message = document.createElement('li');
        const content = document.createTextNode(msg);
        message.appendChild(content);
        const output = document.querySelector('#output') as HTMLDivElement;
        if (output) {
            output.appendChild(message);
            output.scrollTop = output.scrollHeight;
        }
    }
}
