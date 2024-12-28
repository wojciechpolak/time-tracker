/**
 * stopwatch.service
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

import { AppTitle, Stopwatch, StopwatchEvent, Types } from '../models';
import { DbService } from '../services/db.service';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
    providedIn: 'root'
})
export class StopwatchService {

    stopwatches: Stopwatch[] = [];
    stopwatchesLoading: boolean = true;

    constructor(private dbService: DbService,
                private loggerService: LoggerService) {
    }

    async fetchStopwatchList(): Promise<void> {
        this.stopwatchesLoading = true;
        let stopwatches: Stopwatch[] = [];
        let res;
        console.time('find-SW');
        try {
            res = await this.dbService.db.find({
                selector: {
                    type: Types.STOPWATCH,
                    // _id: {$nin: [null]},
                    ref: {$exists: false},
                },
                sort: [{_id: 'desc'}]
            });
        }
        catch (err) {
            this.loggerService.log('fetchStopwatchList error', err);
            return;
        }
        stopwatches = res.docs;
        for (let item of stopwatches) {
            if (item.tsArch) {
                item.events = [];
                continue;
            }
            await this.fetchStopwatchEvents(item);
        }
        console.timeEnd('find-SW');

        this.stopwatches = stopwatches
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
        this.stopwatchesLoading = false;

        // signal if at least one stopwatch is running...
        let swIsRunning = stopwatches.find(item => {
            let lastEventItem = item.events[item.events.length - 1] ?? {};
            return lastEventItem.ss;
        });
        if (swIsRunning) {
            document.title = '🟢 ' + AppTitle;
        }
        else {
            document.title = AppTitle;
        }
    }

    async fetchStopwatchEvents(item: Stopwatch) {
        // console.time('find-SWE');
        let rounds = await this.dbService.db.find({
            selector: {
                type: Types.STOPWATCH_TS,
                ref: item._id,
            },
            // sort: [{_id: 'desc'}]
        });
        // console.timeEnd('find-SWE');
        item.events = rounds.docs;
    }

    addStopwatch() {
        let ts = UtilsService.getTimestamp();
        let stopwatch = {
            _id: Types.STOPWATCH + '-' + ts.toString(),
            type: Types.STOPWATCH,
            name: 'Stopwatch #' + (UtilsService.toISOLocalString(new Date(ts))),
        } as Stopwatch;
        this.dbService
            .putItem(stopwatch)
            .then((doc: any) => {
                let timestamp: StopwatchEvent = {
                    _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                    ref: doc.id,
                    type: Types.STOPWATCH_TS,
                    ts: ts,
                    ss: true,
                    round: true,
                };
                this.dbService
                    .putItem(timestamp)
                    .then(() => {
                        this.loggerService.log('Successfully posted a new Stopwatch!');
                    });
            });
    }

    updateTitle(item: Stopwatch, title: string): Promise<void> {
        return this.dbService.updateItem(item, (doc: Stopwatch) => {
            doc.name = title;
        });
    }

    addEvent(id: string, newRound: boolean = false,
             isStart: boolean): Promise<void> {
        let ts = UtilsService.getTimestamp();
        if (newRound && isStart) { // let's stop the previous round first
            let event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: false, // stop
            };
            return this.dbService
                .putItem(event)
                .then(() : Promise<void> => {
                    let ts = UtilsService.getTimestamp();
                    let event: StopwatchEvent = {
                        _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                        ref: id,
                        type: Types.STOPWATCH_TS,
                        ts: ts,
                        ss: true, // start
                        round: true,
                    };
                    return this.dbService
                        .putItem(event)
                        .then(() => {
                            this.loggerService.log('Successfully posted a new Stopwatch Event!');
                        });
                });
        }
        else {
            let event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: !isStart,
                round: newRound,
            };
            return this.dbService
                .putItem(event)
                .then(() => {
                    this.loggerService.log('Successfully posted a new Stopwatch Event!');
                });
        }
    }

    editEvent(event: StopwatchEvent, label: string): Promise<void> {
        return this.dbService.updateItem(event, (doc: StopwatchEvent) => {
            doc.name = label ?? '';
        });
    }

    modifyEvent(event: StopwatchEvent, ts: number): Promise<void> {
        return this.dbService.updateItem(event, (doc: StopwatchEvent) => {
            doc.ts = ts;
        });
    }

    removeEvent(event: StopwatchEvent): Promise<void> {
        return this.dbService.deleteItem(event);
    }

    async toggleArchiveItem(item: Stopwatch, tsArch: number): Promise<void> {
        return this.dbService.updateItem(item, (doc: Stopwatch) => {
            if (doc.tsArch) {
                doc.tsArch = 0;
            }
            else {
                doc.tsArch = tsArch;
            }
            item.tsArch = doc.tsArch;
        });
    }

    async deleteStopwatch(item: Stopwatch): Promise<void> {
        let items = item.events.map((r: any) => {
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

    /*
     * Utilities
     */

    markNonStarters(events: StopwatchEvent[]): any[] {
        let idx = events.findIndex((item: StopwatchEvent) => item.ss);
        for (let i = 0; i < idx; i++) {
            events[i].inUse = false;
        }
        return events.slice(idx, events.length);
    }

    removeDupes(events: StopwatchEvent[]): StopwatchEvent[] {
        let ret: any[] = [];
        for (let i = 0; i < events.length; i++) {
            let ev: StopwatchEvent = events[i];
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

    createStartEndPairs(arr: any[]) {
        return arr.reduce((result, value, index: number, array: any[]) => {
            if (index % 2 === 0) {
                result.push(array.slice(index, index + 2));
            }
            return result;
        }, []);
    }
}
