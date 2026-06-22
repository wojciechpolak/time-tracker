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

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { AppMaterialModules } from '../app-modules';
import { ConfirmService } from '../services/confirm.service';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';

@Component({
    selector: 'app-debug',
    templateUrl: './debug.component.html',
    imports: [...AppMaterialModules, AsyncPipe],
})
export class DebugComponent implements OnInit, OnDestroy {
    private confirmService = inject(ConfirmService);
    private dbService = inject(DbService);
    private loggerService = inject(LoggerService);

    private sub!: Subscription;
    protected storageInfo$!: Promise<string>;

    ngOnInit() {
        this.log('Welcome!');
        this.storageInfo$ = this.getStorageEstimated();
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

    async getStorageEstimated() {
        return await this.dbService.getStorageEstimated();
    }

    async deleteAll() {
        const confirmed = await this.confirmService.confirm({
            title: 'Delete all data',
            message: 'Are you sure you want to delete all data?',
            confirmText: 'Delete',
        });
        if (confirmed) {
            this.dbService.deleteAll();
        }
    }

    async clearLocalDB() {
        const confirmed = await this.confirmService.confirm({
            title: 'Clear local database',
            message: 'Are you sure you want to clear the local database?',
            confirmText: 'Clear',
        });
        if (confirmed) {
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
