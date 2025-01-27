/**
 * stopwatch.service
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

import { DbResponse, Stopwatch, StopwatchEvent, Types } from '../models';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';

type StopwatchUpdate = Partial<Pick<Stopwatch, 'name' | 'tsArch'>>;
type StopwatchEventUpdate = Partial<Pick<StopwatchEvent, 'name' | 'ts'>>;

@Injectable({
    providedIn: 'root'
})
export class StopwatchService {

    constructor(private dbService: DbService,
                private loggerService: LoggerService) {
    }

    async fetchStopwatch(id: string, ignoreTsArch: boolean = false): Promise<Stopwatch> {
        try {
            const stopwatch = await this.dbService.getItem<Stopwatch>(id);
            if (!stopwatch) {
                throw new Error(`Stopwatch with id ${id} not found`);
            }
            if (stopwatch.tsArch && !ignoreTsArch) {
                stopwatch.events = [];
            }
            else {
                await this.fetchStopwatchEvents(stopwatch);
            }
            return stopwatch;
        }
        catch (err) {
            this.loggerService.log('fetchStopwatch error', err);
            throw err;
        }
    }

    async fetchStopwatchList(): Promise<Stopwatch[]> {
        let stopwatches: Stopwatch[] = [];
        console.time('find-SW');
        try {
            const res = await this.dbService.db.find({
                selector: {
                    type: Types.STOPWATCH,
                    // _id: {$nin: [null]},
                    ref: {$exists: false},
                },
                sort: [{_id: 'desc'}]
            });
            stopwatches = res.docs as Stopwatch[];
            for (const item of stopwatches) {
                if (item.tsArch) {
                    item.events = [];
                    continue;
                }
                await this.fetchStopwatchEvents(item);
            }
            stopwatches = this.sortStopwatchesByEvents(stopwatches);
        }
        catch (err) {
            this.loggerService.log('fetchStopwatchList error', err);
            return [];
        }
        finally {
            console.timeEnd('find-SW');
        }
        return stopwatches;
    }

    sortStopwatchesByEvents(stopwatches: Stopwatch[]): Stopwatch[] {
        return stopwatches
            .sort((a: Stopwatch, b: Stopwatch) => {
                let tsA, tsB;
                if (a.events.length) {
                    tsA = a.events[a.events.length - 1].ts;
                }
                else {
                    tsA = Number(a._id.split('-')[1]);
                }
                if (b.events.length) {
                    tsB = b.events[b.events.length - 1].ts;
                }
                else {
                    tsB = Number(b._id.split('-')[1]);
                }
                return tsB - tsA;
            });
    }

    async fetchStopwatchEvent(id: string): Promise<StopwatchEvent> {
        try {
            const ev = await this.dbService.getItem<StopwatchEvent>(id);
            if (!ev) {
                throw new Error(`Stopwatch Event with id ${id} not found`);
            }
            return ev;
        }
        catch (err) {
            this.loggerService.log('fetchStopwatchEvent error', err);
            throw err;
        }
    }

    async fetchStopwatchEvents(item: Stopwatch) {
        // console.time('find-SWE');
        const rounds = await this.dbService.db.find({
            selector: {
                type: Types.STOPWATCH_TS,
                ref: item._id,
            },
            // sort: [{_id: 'desc'}]
        });
        // console.timeEnd('find-SWE');
        item.events = rounds.docs as StopwatchEvent[];
        this.preprocessEvents(item);
    }

    async addStopwatch(): Promise<Stopwatch> {
        const ts = UtilsService.getTimestamp();
        const stopwatch = {
            _id: Types.STOPWATCH + '-' + ts.toString(),
            type: Types.STOPWATCH,
            name: 'Stopwatch #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as Stopwatch;
        const doc = await this.dbService.putItem(stopwatch);
        const timestamp: StopwatchEvent = {
            _id: Types.STOPWATCH_TS + '-' + ts.toString(),
            ref: doc._id,
            type: Types.STOPWATCH_TS,
            ts: ts,
            ss: true,
            round: true,
        };
        await this.dbService.putItem(timestamp);
        this.loggerService.log('Successfully posted a new Stopwatch!');
        return await this.fetchStopwatch(doc._id);
    }

    async updateStopwatch(item: Stopwatch, changes: StopwatchUpdate): Promise<Stopwatch> {
        const updated = await this.dbService.updateItem(item, (doc: Stopwatch) => {
            Object.assign(doc, changes);
        });
        return this.fetchStopwatch(updated.id);
    }

    async addEvent(id: string, newRound: boolean = false, isStart: boolean): Promise<StopwatchEvent[]> {
        let ts = UtilsService.getTimestamp();
        if (newRound && isStart) { // let's stop the previous round first
            const event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: false, // stop
            };
            const eventObj1 = await this.dbService.putItem(event);
            eventObj1.inUse = true;

            ts = UtilsService.getTimestamp();
            const event2: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: true, // start
                round: true,
            };
            const eventObj2 = await this.dbService.putItem(event2);
            eventObj2.inUse = true;
            this.loggerService.log('Successfully posted a new Stopwatch Event!');
            return [eventObj1, eventObj2];
        }
        else {
            const event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: !isStart,
                round: newRound,
            };
            const eventObj = await this.dbService.putItem(event);
            eventObj.inUse = true;
            this.loggerService.log('Successfully posted a new Stopwatch Event!');
            return [eventObj];
        }
    }

    async updateEvent(event: StopwatchEvent, changes: StopwatchEventUpdate): Promise<StopwatchEvent> {
        const updated = await this.dbService.updateItem(event, (doc: StopwatchEvent) => {
            Object.assign(doc, changes);
        });
        return this.fetchStopwatchEvent(updated.id);
    }

    async removeEvent(event: StopwatchEvent): Promise<DbResponse> {
        return await this.dbService.deleteItem(event);
    }

    async toggleArchiveItem(item: Stopwatch, tsArch: number): Promise<Stopwatch> {
        const resp = await this.dbService.updateItem(item, (doc: Stopwatch) => {
            if (doc.tsArch) {
                doc.tsArch = 0;
            }
            else {
                doc.tsArch = tsArch;
            }
        });
        return await this.fetchStopwatch(resp.id);
    }

    async deleteStopwatch(item: Stopwatch): Promise<DbResponse> {
        const items = item.events.map((r: StopwatchEvent) => {
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

    /*
     * Utilities
     */

    markNonStarters(events: StopwatchEvent[]): StopwatchEvent[] {
        const idx = events.findIndex((item: StopwatchEvent) => item.ss);
        for (let i = 0; i < idx; i++) {
            events[i].inUse = false;
        }
        return events.slice(idx, events.length);
    }

    removeDupes(events: StopwatchEvent[]): StopwatchEvent[] {
        const ret: StopwatchEvent[] = [];
        for (let i = 0; i < events.length; i++) {
            const ev: StopwatchEvent = events[i];
            if (i > 0 && ev.ss && ev.ss === events[i - 1].ss) {
                // do not push
            }
            else if (i > 0 && !ev.ss && ev.ss === events[i + 1]?.ss) {
                // do not push
            }
            else {
                if (ev.inUse === undefined) {
                    ev.inUse = true;
                }
                ret.push(ev);
            }
        }
        return ret;
    }

    createStartEndPairs(arr: StopwatchEvent[]): StopwatchEvent[][] {
        return arr.reduce((result: StopwatchEvent[][], _value, index: number, array: StopwatchEvent[]) => {
            if (index % 2 === 0) {
                result.push(array.slice(index, index + 2));
            }
            return result;
        }, []);
    }

    preprocessEvents(item: Stopwatch) {
        const lastEventItem = item.events[item.events.length - 1] ?? {};
        item.finished = !lastEventItem.ss;
        this.markNonStarters(item.events);
        this.removeDupes(item.events);
    }
}
