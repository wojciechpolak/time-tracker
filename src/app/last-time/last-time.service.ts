/**
 * last-time.service
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

import { Injectable } from '@angular/core';

import { DbService } from '../services/db.service';
import { DbResponse, LastTime, TimeStamp, Types } from '../models';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';

type LastTimeUpdate = Partial<Pick<LastTime, 'name'>>;
type TimeStampUpdate = Partial<Pick<TimeStamp, 'label' | 'ts'>>;

const LT_TS_MAX_ITEMS = 10;

@Injectable({
    providedIn: 'root'
})
export class LastTimeService {

    constructor(private dbService: DbService,
                private loggerService: LoggerService) {
    }

    async fetchLastTime(id: string, limit: number = 0): Promise<LastTime> {
        try {
            const lastTime = await this.dbService.getItem<LastTime>(id);
            if (!lastTime) {
                throw new Error(`LastTime with id ${id} not found`);
            }
            await this.fetchTimestamps(lastTime, limit);
            return lastTime;
        }
        catch (err) {
            this.loggerService.log('fetchLastTime error', err);
            throw err;
        }
    }

    async fetchLastTimeList(): Promise<LastTime[]> {
        let lastTime: LastTime[] = [];
        console.time('find-LT');
        try {
            lastTime = await this.dbService.find<LastTime>({
                selector: {
                    type: Types.LAST_TIME,
                    // _id: {$nin: [null]},
                    ref: {$exists: false},
                },
                // sort: [{_id: 'desc'}]
            });
            for (const item of lastTime) {
                await this.fetchTimestamps(item);
            }
            lastTime = this.sortLastTimeByTs(lastTime);
            return lastTime;
        }
        catch (err) {
            this.loggerService.log('fetchLastTimeList error', err);
            return [];
        }
        finally {
            console.timeEnd('find-LT');
        }
    }

    sortLastTimeByTs(lastTime: LastTime[]): LastTime[] {
        return lastTime.sort(
            (a: LastTime, b: LastTime) => b.timestamps[0].ts - a.timestamps[0].ts);
    }

    async fetchTimeStamp(id: string): Promise<TimeStamp> {
        try {
            const timestamp = await this.dbService.getItem<TimeStamp>(id);
            if (!timestamp) {
                throw new Error(`TimeStamp with id ${id} not found`);
            }
            return timestamp;
        }
        catch (err) {
            this.loggerService.log('fetchTimeStamp error', err);
            throw err;
        }
    }

    /**
     * Gets timestamps for the LastTime item
     * @param item
     * @param limit Limit the number of items or 0 for unlimited
     */
    async fetchTimestamps(item: LastTime, limit: number = LT_TS_MAX_ITEMS) {
        // console.time('find-LTT');
        const timestamps = await this.dbService.find<TimeStamp>({
            selector: {
                type: Types.LAST_TIME_TS,
                ref: item._id,
            },
            sort: [{_id: 'desc'}],
            ...(limit ? {limit: limit + 1} : {}),
        });
        timestamps.sort((a: TimeStamp, b: TimeStamp) => b.ts - a.ts);
        // console.timeEnd('find-LTT');
        item.timestamps = timestamps;
        if (limit && item.timestamps.length > limit) {
            item.timestamps = item.timestamps.slice(0, limit);
            item.hasMoreTs = true;
        }
        else {
            item.hasMoreTs = false;
        }
    }

    async addLastTime(): Promise<LastTime> {
        const ts = UtilsService.getTimestamp();
        const lastTime = {
            _id: Types.LAST_TIME + '-' + ts.toString(),
            type: Types.LAST_TIME,
            name: 'Last #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as LastTime;
        const doc = await this.dbService.putItem(lastTime);
        const timestamp: TimeStamp = {
            _id: Types.LAST_TIME_TS + '-' + ts.toString(),
            ref: doc._id,
            type: Types.LAST_TIME_TS,
            ts: ts,
        };
        await this.dbService.putItem(timestamp);
        this.loggerService.log('Successfully posted a new LastTime!');
        return await this.fetchLastTime(doc._id);
    }

    async touch(item: LastTime): Promise<TimeStamp> {
        const ts = UtilsService.getTimestamp();
        const timestamp: TimeStamp = {
            _id: Types.LAST_TIME_TS + '-' + ts.toString(),
            ref: item._id,
            type: Types.LAST_TIME_TS,
            ts: ts,
        };
        const ret = await this.dbService.putItem(timestamp);
        this.loggerService.log('Successfully posted a new LastTime-TS!');
        return ret;
    }

    async updateLastTime(item: LastTime, changes: LastTimeUpdate): Promise<LastTime> {
        const updated = await this.dbService.updateItem(item, (doc: LastTime) => {
            Object.assign(doc, changes);
        });
        return await this.fetchLastTime(updated.id);
    }

    async updateTimestamp(ts: TimeStamp, changes: TimeStampUpdate): Promise<TimeStamp> {
        const updated = await this.dbService.updateItem(ts, (doc: TimeStamp) => {
            Object.assign(doc, changes);
        });
        return await this.fetchTimeStamp(updated.id);
    }

    async removeTimestamp(ts: TimeStamp): Promise<DbResponse> {
        return await this.dbService.deleteItem(ts);
    }

    async deleteLastTime(item: LastTime): Promise<DbResponse> {
        const items = item.timestamps.map((r: TimeStamp) => {
            return {
                _id: r._id,
                _rev: r._rev,
                _deleted: true,
            };
        });
        const ret = await this.dbService.deleteItem(item);
        await this.dbService.bulkDocs(items);
        return ret;
    }
}
