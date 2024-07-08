/**
 * stopwatch.component
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

import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { Moment } from 'moment';

import { DataService } from '../services/data.service';
import { LoggerService } from '../services/logger.service';
import { TimerService } from '../services/timer.service';
import { Stopwatch, StopwatchEvent, StopwatchRoundTime, Types } from '../models';
import { UtilsService } from '../services/utils.service';

@Component({
    selector: 'app-stopwatch',
    templateUrl: './stopwatch.component.html',
})
export class StopwatchComponent implements OnInit, OnDestroy {

    @Input() item!: Stopwatch;

    protected addEventLocked: boolean = false;
    protected titleTime: string = '';
    protected cacheLastItemTs: number = 0;
    protected cacheLastNumberOfItems: number = 0;
    protected cacheLastRoundItem: StopwatchRoundTime | null = null;
    protected cacheTimeSum: number = 0;
    protected displayEvents: boolean = false;
    protected refreshLocked: boolean = false;
    protected revertedEvents: StopwatchEvent[] = [];
    protected roundsTime: StopwatchRoundTime[] = [];
    protected roundsTimeStr: Record<string, string> = {};
    protected roundsOnly: StopwatchEvent[] = [];
    protected statsContent: any = null;
    protected statsFreq: any = {};
    protected statsAvgDay: any = {};
    protected tsArch: number = 0;
    protected editedTitle!: string;
    protected isEditTitle: boolean = false;
    protected UtilsService: typeof UtilsService = UtilsService;

    protected barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        scales: {
            x: {},
            y: {},
        },
        plugins: {
            legend: {
                display: false,
            },
        }
    };

    private sub1!: Subscription;
    private sub2!: Subscription;

    constructor(private cd: ChangeDetectorRef,
                private loggerService: LoggerService,
                private timerService: TimerService,
                private dataService: DataService) {
    }

    ngOnInit() {
        this.init();
        this.calcTimeSpan();
        this.sub1 = this.dataService.onRefresh.subscribe(() => {
            this.refreshLocked = true;
            this.init();
            this.calcTimeSpan();
            this.refreshLocked = false;
        });
        this.sub2 = this.timerService.timer.subscribe(() => {
            if (this.refreshLocked) {
                return;
            }
            let lastEventItem = this.item.events[this.item.events.length - 1] ?? {};
            if (lastEventItem.ss || this.item.tsArch) {
                this.calcTimeSpan();
            }
        });
    }

    ngOnDestroy() {
        this.sub1 && this.sub1.unsubscribe();
        this.sub2 && this.sub2.unsubscribe();
    }

    init() {
        let lastEventItem = this.item.events[this.item.events.length - 1] ?? {};
        this.item.finished = !lastEventItem.ss;
        this.markNonStarters(this.item.events);
        this.removeDupes(this.item.events);
        this.revertedEvents = this.item.events.slice().reverse();
        this.revertedEvents.forEach(item => {
            item.tsFormControl = new FormControl(new Date(item.ts)) as any;
        })
        this.roundsOnly = this.revertedEvents.filter(item => item.round);
    }

    calcTimeSpan(skipArchive: boolean = false) {
        if (!skipArchive && this.item.tsArch) {
            this.tsArch = this.item.tsArch;
            this.titleTime = UtilsService.getTimeDiff(this.tsArch);
            return;
        }
        if (this.cacheLastNumberOfItems === this.item.events.length) {
            let timeSum = this.cacheTimeSum;
            let end = UtilsService.getTimestamp();
            if (this.cacheLastItemTs) {
                timeSum = timeSum + (end - this.cacheLastItemTs);
            }
            this.tsArch = timeSum;
            this.titleTime = UtilsService.getTimeDiff(timeSum);

            if (this.cacheLastRoundItem && this.cacheLastItemTs) {
                let last = this.cacheLastRoundItem;
                let t = last.timeDiff + (end - this.cacheLastItemTs);
                let ret = UtilsService.getTimeDiff(t);
                this.roundsTimeStr[last.id] = `[${ret}]`;
            }
            else if (this.cacheLastRoundItem) {
                return;
            }
            else {
                this.roundsTimeStr[this.item.events[0]._id] = `[${this.titleTime}]`;
            }
            return;
        }
        this.cacheLastNumberOfItems = this.item.events.length;
        this.titleTime = this.getAllSpan();
    }

    getAllSpan(): string {
        if (!this.item.events.length) {
            return '';
        }

        let events = this.markNonStarters(this.item.events);
        events = this.removeDupes(events);
        events = this.createStartEndPairs(events);

        this.roundsTime = [];
        this.cacheLastItemTs = 0;

        let events2 = events.map((ev: StopwatchEvent[]) => {
            if (ev.length === 2) {
                let timeDiff = UtilsService.roundTs(ev[1].ts) - UtilsService.roundTs(ev[0].ts);
                if (timeDiff < 0) {
                    return 0;
                }
                if (ev[0].ss && ev[0].round) {
                    this.roundsTime.push({
                        id: ev[0]._id,
                        timeDiff: timeDiff,
                    });
                }
                else if (this.roundsTime.length) {
                    let last = this.roundsTime[this.roundsTime.length - 1];
                    last.timeDiff += timeDiff;
                }
                return timeDiff;
            }
            else if (ev[0].round) {
                this.roundsTime.push({
                    id: ev[0]._id,
                    timeDiff: 0,
                });
            }
            if (ev[0].ss) {
                this.cacheLastItemTs = ev[0].ts;
            }
            return 0;
        });
        this.prepareRoundsTimeStr();
        this.cacheTimeSum = events2.reduce((r1: number, r2: number) => r1 + r2);
        this.tsArch = this.cacheTimeSum;
        return UtilsService.getTimeDiff(this.cacheTimeSum);
    }

    private markNonStarters(events: StopwatchEvent[]): any[] {
        let idx = events.findIndex(item => item.ss);
        for (let i = 0; i < idx; i++) {
            events[i].inUse = false;
        }
        return events.slice(idx, events.length);
    }

    private removeDupes(events: StopwatchEvent[]) {
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

    private createStartEndPairs(arr: any[]) {
        return arr.reduce((result, value, index: number, array: any[]) => {
            if (index % 2 === 0) {
                result.push(array.slice(index, index + 2));
            }
            return result;
        }, []);
    }

    private prepareRoundsTimeStr() {
        this.roundsTimeStr = {};
        for (let r of this.roundsTime) {
            let ret = UtilsService.getTimeDiff(r.timeDiff);
            this.roundsTimeStr[r.id] = `[${ret}]`;
        }
        this.cacheLastRoundItem = this.item.events.length > 1 ?
            this.roundsTime[this.roundsTime.length - 1] : null;
    }

    startStopStopwatch() {
        this.addEvent();
    }

    addEvent(newRound: boolean = false) {
        this.addEventLocked = true;
        let ts = UtilsService.getTimestamp();
        let lastEventItem = this.item.events[this.item.events.length - 1];
        if (newRound && lastEventItem.ss) { // let's stop the previous round first
            let event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: this.item._id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: false, // stop
            };
            this.dataService.putItem(event, () => {
                let ts = UtilsService.getTimestamp();
                let event: StopwatchEvent = {
                    _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                    ref: this.item._id,
                    type: Types.STOPWATCH_TS,
                    ts: ts,
                    ss: true, // start
                    round: true,
                };
                this.dataService.putItem(event, () => {
                    this.addEventLocked = false;
                    this.loggerService.log('Successfully posted a new Stopwatch Event!');
                });
            });
        }
        else {
            let event: StopwatchEvent = {
                _id: Types.STOPWATCH_TS + '-' + ts.toString(),
                ref: this.item._id,
                type: Types.STOPWATCH_TS,
                ts: ts,
                ss: !lastEventItem.ss,
                round: newRound,
            };
            this.dataService.putItem(event, () => {
                this.addEventLocked = false;
                this.loggerService.log('Successfully posted a new Stopwatch Event!');
            });
        }
    }

    removeEvent(event: StopwatchEvent, idx: number): void {
        if (!confirm('Do you confirm removing Stopwatch event #' + (idx + 1))) {
            return;
        }
        this.loggerService.log('Removing stopwatch event', idx);
        this.dataService.deleteItem(event);
    }

    editEvent(event: StopwatchEvent, idx: number): void {
        let label = prompt('Label #' + (idx + 1), event.name);
        if (label === null) {
            return;
        }
        this.dataService.updateItem(event, (doc: StopwatchEvent) => {
            doc.name = label ?? '';
        }).then(() => {
            this.cacheLastNumberOfItems = 0;
        });
    }

    modifyEvent(datePickerEvent: any,
                event: StopwatchEvent, idx: number): void {
        let ts = (<Moment>datePickerEvent.value).valueOf();
        if (!confirm('Do you want to change event #' + (idx + 1) +
            ' to ' + UtilsService.toDate(ts) + '?')) {
            return;
        }
        this.dataService.updateItem(event, (doc: StopwatchEvent) => {
            doc.ts = ts;
        }).then(() => {
            this.cacheLastNumberOfItems = 0;
        });
    }

    async deleteItem() {
        if (!confirm('Do you confirm removing stopwatch')) {
            return;
        }
        let items = this.item.events.map((r: any) => {
            return {
                _id: r._id,
                _rev: r._rev,
                _deleted: true,
            };
        });
        this.dataService.disableChangesListener();
        try {
            await this.dataService.deleteItem(this.item);
            await this.dataService.bulkDocs(items);
        }
        finally {
            this.dataService.enableChangesListener();
            await this.dataService.fetch();
        }
    }

    editTitle($event: Event) {
        $event.preventDefault();
        this.editedTitle = this.item.name;
        this.isEditTitle = true;
    }

    cancelEditTitle() {
        this.isEditTitle = false;
    }

    finishEditTitle() {
        this.dataService.updateItem(this.item, (doc: Stopwatch) => {
            doc.name = this.editedTitle;
        });
        this.isEditTitle = false;
    }

    async toggleArchiveItem() {
        await this.dataService.updateItem(this.item, (doc: Stopwatch) => {
            if (doc.tsArch) {
                doc.tsArch = 0;
            }
            else {
                doc.tsArch = this.tsArch;
            }
            this.item.tsArch = doc.tsArch;
            this.dataService.fetch();
        });
    }

    async switchDisplayRoundsEvents() {
        if (!this.item.events.length) {
            await this.dataService.fetchStopwatchEvents(this.item);
            this.init();
            this.calcTimeSpan(true);
        }
        this.displayEvents = !this.displayEvents;
    }

    async toggleStats() {
        if (this.statsContent) {
            this.statsContent = null;
            return;
        }
        if (!this.item.events.length) {
            await this.dataService.fetchStopwatchEvents(this.item);
            this.init();
            this.calcTimeSpan(true);
        }
        let events = this.markNonStarters(this.item.events);
        events = this.removeDupes(events);

        this.statsFreq = UtilsService.getStatsFreq(events.map(item => item.ts));
        this.statsContent = [];

        this.statsAvgDay = this.calcStatsAvgDay(events);
        let tmpSecs: number[] = Object.values(this.statsAvgDay.combinedTimeByDay) as number[];
        this.statsContent.push({
            name: 'Minutes per day',
            data: {
                labels: Object.keys(this.statsAvgDay.combinedTimeByDay),
                datasets: [
                    {
                        data: tmpSecs.map((item: number) => Math.round(item / 60))
                    }
                ]
            }
        });

        const s = ['day', 'hour', 'month', 'year'];
        for (let x of s) {
            this.statsContent.push({
                name: x,
                data: UtilsService.getStats(events, x)
            })
        }
    }

    calcStatsAvgDay(events: StopwatchEvent[]) {
        // Create an object to hold the total combined time for each day
        const combinedTimeByDay: any = {};

        // Loop through the events and calculate the combined time taken for each day
        for (let i = 0; i < events.length - 1; i += 2) {
            const startEvent = events[i];
            const stopEvent = events[i + 1];

            const startDate = new Date(startEvent.ts);
            const stopDate = new Date(stopEvent.ts);

            const startDay = startDate.getUTCDate();
            const stopDay = stopDate.getUTCDate();

            const startMonth = startDate.getUTCMonth() + 1;
            const stopMonth = stopDate.getUTCMonth() + 1;

            const startYear = startDate.getUTCFullYear();
            const stopYear = stopDate.getUTCFullYear();

            const startIndex = `${startYear}-${startMonth}-${startDay}`;
            const stopIndex = `${stopYear}-${stopMonth}-${stopDay}`;

            if (startDay === stopDay && startMonth === stopMonth && startYear === stopYear) {
                const timeDiffInSeconds = (stopEvent.ts - startEvent.ts) / 1000;
                combinedTimeByDay[startIndex] = (combinedTimeByDay[startIndex] || 0) + timeDiffInSeconds;
            }
            else {
                // If the event spans across multiple days, calculate the time taken for each day
                let firstDayEnd = new Date(startDate);
                firstDayEnd.setUTCHours(23, 59, 59, 999);
                let timeDiffInSeconds1 = (firstDayEnd.getTime() - startEvent.ts) / 1000;
                combinedTimeByDay[startIndex] = (combinedTimeByDay[startIndex] || 0) + timeDiffInSeconds1;

                const lastDayStart = new Date(stopDate);
                lastDayStart.setUTCHours(0, 0, 0, 0);
                const timeDiffInSeconds2 = (stopEvent.ts - lastDayStart.getTime()) / 1000;
                combinedTimeByDay[stopIndex] = (combinedTimeByDay[stopIndex] || 0) + timeDiffInSeconds2;

                // Calculate the time taken for each day in between the first and last day
                const daysInBetween = (stopDay - startDay) + 1;
                for (let j = 1; j < daysInBetween - 1; j++) {
                    const currentDate = new Date(startDate);
                    currentDate.setUTCDate(startDay + j);
                    const timeDiffInSeconds = 24 * 60 * 60;
                    combinedTimeByDay[`${startYear}-${startMonth}-${currentDate.getUTCDate()}`] = (combinedTimeByDay[`${startYear}-${startMonth}-${currentDate.getUTCDate()}`] || 0) + timeDiffInSeconds;
                }
            }
        }
        let combinedTimeByDayValues = Object.values(combinedTimeByDay);
        let sumTimeByDay: number = combinedTimeByDayValues
            .reduce((acc: any, v: any) => acc + v, 0) as number;
        let avgTimeByDay = sumTimeByDay / combinedTimeByDayValues.length;
        let avgTimeByDayMinutes = Math.round(avgTimeByDay / 60);
        return {
            combinedTimeByDay: combinedTimeByDay,
            sumTimeByDay: sumTimeByDay,
            avgTimeByDay: avgTimeByDay,
            avgTimeByDayMinutes: avgTimeByDayMinutes,
        };
    }
}
