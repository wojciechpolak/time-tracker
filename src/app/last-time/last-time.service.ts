/**
 * last-time.service
 *
 * Time Tracker Copyright (C) 2024 Wojciech Polak
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

import { Injectable } from '@angular/core';

import { DbService } from '../services/db.service';
import { LastTime, TimeStamp, Types } from '../models';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';

const LT_TS_MAX_ITEMS = 10;

@Injectable({
    providedIn: 'root'
})
export class LastTimeService {

    lastTime: LastTime[] = [];
    lastTimeLoading: boolean = true;

    constructor(private dbService: DbService,
                private loggerService: LoggerService) {
    }

    async fetchLastTime(): Promise<void> {
        this.lastTimeLoading = true;
        let lastTime: LastTime[] = [];
        let result;
        console.time('find-LT');
        try {
            result = await this.dbService.db.find({
                selector: {
                    type: Types.LAST_TIME,
                    // _id: {$nin: [null]},
                    ref: {$exists: false},
                },
                // sort: [{_id: 'desc'}]
            });
        }
        catch (err) {
            this.loggerService.log('fetchLastTime error', err);
            return;
        }
        lastTime = result.docs;
        for (let item of lastTime) {
            await this.fetchTimestamps(item);
        }
        console.timeEnd('find-LT');
        this.lastTime = lastTime
            .sort((a: LastTime, b: LastTime) => b.timestamps[0].ts - a.timestamps[0].ts);
        this.lastTimeLoading = false;
    }

    /**
     * Gets timestamps for the LastTime item
     * @param item
     * @param limit Limit the number of items or 0 for unlimited
     */
    async fetchTimestamps(item: LastTime, limit: number = LT_TS_MAX_ITEMS) {
        // console.time('find-LTT');
        let timestamps = await this.dbService.db.find({
            selector: {
                type: Types.LAST_TIME_TS,
                ref: item._id,
            },
            sort: [{_id: 'desc'}],
            ...(limit ? {limit: limit + 1} : {}),
        });
        timestamps.docs.sort((a: any, b: any) => b.ts - a.ts);
        // console.timeEnd('find-LTT');
        item.timestamps = timestamps.docs;
        if (limit && item.timestamps.length > limit) {
            item.timestamps = item.timestamps.slice(0, limit);
            item.hasMoreTs = true;
        }
        else {
            item.hasMoreTs = false;
        }
    }

    addLastTime() {
        let ts = UtilsService.getTimestamp();
        let lastTime = {
            _id: Types.LAST_TIME + '-' + ts.toString(),
            type: Types.LAST_TIME,
            name: 'Last #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as LastTime;
        this.dbService
            .putItem(lastTime)
            .then((doc: any) => {
                let timestamp: TimeStamp = {
                    _id: Types.LAST_TIME_TS + '-' + ts.toString(),
                    ref: doc.id,
                    type: Types.LAST_TIME_TS,
                    ts: ts,
                };
                this.dbService
                    .putItem(timestamp)
                    .then(() => {
                        this.loggerService.log('Successfully posted a new LastTime!');
                    });
            });
    }

    touch(item: LastTime): Promise<void> {
        let ts = UtilsService.getTimestamp();
        let timestamp: TimeStamp = {
            _id: Types.LAST_TIME_TS + '-' + ts.toString(),
            ref: item._id,
            type: Types.LAST_TIME_TS,
            ts: ts,
        };
        return this.dbService
            .putItem(timestamp)
            .then(() => {
                this.loggerService.log('Successfully posted a new LastTime-TS!');
            });
    }

    updateTitle(item: LastTime, title: string): Promise<void> {
        return this.dbService.updateItem(item, (doc: LastTime) => {
            doc.name = title;
        });
    }

    updateTimestampLabel(ts: TimeStamp, label: string): Promise<void> {
        return this.dbService.updateItem(ts, (doc: TimeStamp) => {
            doc.label = label ?? '';
        });
    }

    updateTimestamp(ts: TimeStamp, newTs: number): Promise<void> {
        return this.dbService.updateItem(ts, (doc: TimeStamp) => {
            doc.ts = newTs;
        });
    }

    removeTimestamp(ts: TimeStamp): Promise<void> {
        return this.dbService.deleteItem(ts);
    }

    async deleteLastTime(item: LastTime): Promise<void> {
        let items = item.timestamps.map((r: any) => {
            return {
                _id: r._id,
                _rev: r._rev,
                _deleted: true,
            };
        });
        this.dbService.disableChangesListener();
        try {
            await this.dbService.deleteItem(item);
            await this.dbService.bulkDocs(items);
        }
        finally {
            this.dbService.enableChangesListener();
        }
    }
}
