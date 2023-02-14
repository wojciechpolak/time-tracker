/**
 * debug.component
 *
 * Time Tracker Copyright (C) 2023 Wojciech Polak
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

import { DataService } from '../services/data.service';
import { LoggerService } from '../services/logger.service';


@Component({
    selector: 'app-debug',
    templateUrl: './debug.component.html'
})
export class DebugComponent implements OnInit, OnDestroy {

    private sub!: Subscription;

    constructor(private loggerService: LoggerService,
                private dataService: DataService) {
    }

    ngOnInit() {
        this.dataService.estimateStorage();
        this.log('Welcome!');
        for (let msg of this.loggerService.buf) {
            this.log(msg);
        }
        this.sub = this.loggerService.onLog.subscribe((msg: string) => {
            this.log(msg);
        });
    }

    ngOnDestroy() {
        this.sub && this.sub.unsubscribe();
    }

    get storageEstimated() {
        return this.dataService.storageEstimated;
    }

    deleteAll() {
        if (confirm('Confirm?')) {
            this.dataService.deleteAll();
        }
    }

    clearLocalDB() {
        if (confirm('Confirm?')) {
            this.dataService.clearLocalDB();
        }
    }

    clearConsole() {
        this.loggerService.clear();
        let output = document.querySelector('#output') as HTMLDivElement;
        if (output) {
            output.innerHTML = '';
        }
    }

    log(msg: string) {
        let message = document.createElement('li');
        let content = document.createTextNode(msg);
        message.appendChild(content);
        let output = document.querySelector('#output') as HTMLDivElement;
        if (output) {
            output.appendChild(message);
            output.scrollTop = output.scrollHeight;
        }
    }
}
