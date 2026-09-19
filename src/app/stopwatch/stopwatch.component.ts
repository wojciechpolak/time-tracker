/**
 * stopwatch.component
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

import {
    ChangeDetectionStrategy,
    Component,
    OnChanges,
    OnInit,
    SimpleChanges,
    input,
    inject,
    Signal,
} from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChartConfiguration } from 'chart.js';
import { MtxDatetimepickerInputEvent } from '@ng-matero/extensions/datetimepicker';

import { AppMaterialModules } from '../app-modules';
import { ConfirmService } from '../services/confirm.service';
import { LoggerService } from '../services/logger.service';
import {
    StatsAvgDay,
    StatsContent,
    StatsFreq,
    Stopwatch,
    StopwatchEvent,
    StopwatchRoundTime,
} from '../models';
import { StopwatchService } from './stopwatch.service';
import { TimerService } from '../services/timer.service';
import { UtilsService } from '../services/utils.service';
import { StopwatchStore } from '../store/stopwatch.store';
import { StatsContentComponent } from '../shared/stats-content.component';
import { StopwatchEventsComponent } from './events/stopwatch-events.component';
import { StopwatchRoundsComponent } from './rounds/stopwatch-rounds.component';

@Component({
    selector: 'app-stopwatch',
    templateUrl: './stopwatch.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ...AppMaterialModules,
        AsyncPipe,
        FormsModule,
        NgClass,
        StatsContentComponent,
        StopwatchEventsComponent,
        StopwatchRoundsComponent,
    ],
})
export class StopwatchComponent implements OnChanges, OnInit {
    private confirmService = inject(ConfirmService);
    private loggerService = inject(LoggerService);
    private stopwatchService = inject(StopwatchService);
    private stopwatchStore = inject(StopwatchStore);
    private timerService = inject(TimerService);

    readonly item = input.required<Stopwatch>();

    protected UtilsService: typeof UtilsService = UtilsService;
    protected addEventLocked: Signal<boolean> = this.stopwatchStore.loading;
    protected cacheLastItemTs: number = 0;
    protected cacheLastNumberOfItems: number = 0;
    protected cacheLastRoundItem: StopwatchRoundTime | null = null;
    protected cacheTimeSum: number = 0;
    protected displayEvents: boolean = false;
    protected editedTitle!: string;
    protected isEditTitle: boolean = false;
    protected isRunning: boolean = false;
    protected isWaiting: boolean = false;
    protected revertedEvents: StopwatchEvent[] = [];
    protected roundsOnly: StopwatchEvent[] = [];
    protected roundsTime: StopwatchRoundTime[] = [];
    // Replaced, never mutated in place: StopwatchRoundsComponent takes this as
    // a signal input, so a new reference is what makes the running round's
    // elapsed time re-render on each timer tick.
    protected roundsTimeStr: Record<string, string> = {};
    protected statsAvgDay: StatsAvgDay | null = null;
    protected statsContent: StatsContent[] | null = null;
    protected statsFreq: StatsFreq | null = null;
    protected titleTime$!: Observable<string>;
    protected titleTime: string = '';
    protected tsArch: number = 0;

    protected barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        scales: {
            x: {
                ticks: { color: UtilsService.chartTheme().tick },
                grid: { color: UtilsService.chartTheme().grid },
            },
            y: {
                ticks: { color: UtilsService.chartTheme().tick },
                grid: { color: UtilsService.chartTheme().grid },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    ngOnInit() {
        this.titleTime$ = this.timerService.timer$.pipe(
            tap(() => {
                const lastEventItem = this.item().events[this.item().events.length - 1] ?? {};
                if (lastEventItem.ss || this.item().tsArch) {
                    this.calcTimeSpan();
                }
            }),
            map(() => this.titleTime),
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['item'] && this.item()) {
            this.init();
            this.calcTimeSpan();
        }
    }

    init() {
        const lastEventItem = this.item().events[this.item().events.length - 1] ?? {};
        this.isRunning = lastEventItem.ss;
        this.revertedEvents = structuredClone(this.item().events).slice().reverse();
        this.revertedEvents.forEach((item) => {
            item.tsFormControl = new FormControl(new Date(item.ts)) as FormControl<Date>;
        });
        this.roundsOnly = this.revertedEvents.filter((item) => item.round);
    }

    calcTimeSpan(skipArchive: boolean = false) {
        const item = this.item();
        if (!skipArchive && item.tsArch) {
            this.tsArch = item.tsArch;
            this.titleTime = UtilsService.getTimeDiff(this.tsArch);
            return;
        }
        if (this.cacheLastNumberOfItems === item.events.length) {
            let timeSum = this.cacheTimeSum;
            const end = UtilsService.getTimestamp();
            if (this.cacheLastItemTs) {
                timeSum = timeSum + (end - this.cacheLastItemTs);
            }
            this.tsArch = timeSum;
            this.titleTime = UtilsService.getTimeDiff(timeSum);

            if (this.cacheLastRoundItem && this.cacheLastItemTs) {
                const last = this.cacheLastRoundItem;
                const t = last.timeDiff + (end - this.cacheLastItemTs);
                const ret = UtilsService.getTimeDiff(t);
                this.roundsTimeStr = { ...this.roundsTimeStr, [last.id]: `[${ret}]` };
            } else if (this.cacheLastRoundItem) {
                return;
            } else {
                this.roundsTimeStr = {
                    ...this.roundsTimeStr,
                    [item.events[0]._id]: `[${this.titleTime}]`,
                };
            }
            return;
        }
        this.cacheLastNumberOfItems = item.events.length;
        this.titleTime = this.getAllSpan();
    }

    getAllSpan(): string {
        const item = this.item();
        if (!item.events.length) {
            return '';
        }

        let events = this.stopwatchService.markNonStarters(item.events);
        events = this.stopwatchService.removeDupes(events);
        const eventsPair = this.stopwatchService.createStartEndPairs(events);

        this.roundsTime = [];
        this.cacheLastItemTs = 0;

        const events2 = eventsPair.map((ev: StopwatchEvent[]) => {
            if (ev.length === 2) {
                const timeDiff = UtilsService.roundTs(ev[1].ts) - UtilsService.roundTs(ev[0].ts);
                if (timeDiff < 0) {
                    return 0;
                }
                if (ev[0].ss && ev[0].round) {
                    this.roundsTime.push({
                        id: ev[0]._id,
                        timeDiff: timeDiff,
                    });
                } else if (this.roundsTime.length) {
                    const last = this.roundsTime[this.roundsTime.length - 1];
                    last.timeDiff += timeDiff;
                }
                return timeDiff;
            } else if (ev[0].round) {
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
        this.cacheTimeSum = events2.reduce((r1: number, r2: number) => r1 + r2, 0);
        this.tsArch = this.cacheTimeSum;
        return UtilsService.getTimeDiff(this.cacheTimeSum);
    }

    private prepareRoundsTimeStr() {
        const roundsTimeStr: Record<string, string> = {};
        for (const r of this.roundsTime) {
            const ret = UtilsService.getTimeDiff(r.timeDiff);
            roundsTimeStr[r.id] = `[${ret}]`;
        }
        this.roundsTimeStr = roundsTimeStr;
        this.cacheLastRoundItem =
            this.item().events.length > 1 ? this.roundsTime[this.roundsTime.length - 1] : null;
    }

    startStopStopwatch() {
        this.addEvent();
    }

    addEvent(newRound: boolean = false) {
        const lastEventItem: StopwatchEvent = this.item().events[this.item().events.length - 1];
        const isStart: boolean = lastEventItem.ss;
        this.stopwatchStore.addStopwatchEvent({ stopwatchId: this.item()._id, newRound, isStart });
    }

    async removeEvent(event: StopwatchEvent, idx: number): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Remove event',
            message: 'Do you confirm removing Stopwatch event #' + (idx + 1) + '?',
            confirmText: 'Remove',
        });
        if (!confirmed) {
            return;
        }
        this.loggerService.log('Removing stopwatch event', idx);
        this.stopwatchStore.deleteStopwatchEvent(event);
    }

    editEvent(event: StopwatchEvent, idx: number): void {
        const label = prompt('Label #' + (idx + 1), event.name);
        if (label !== null) {
            this.stopwatchStore.updateStopwatchEventLabel({ event, label });
            this.cacheLastNumberOfItems = 0;
        }
    }

    async modifyEvent(
        datePickerEvent: MtxDatetimepickerInputEvent<Date>,
        event: StopwatchEvent,
        idx: number,
    ): Promise<void> {
        const ts = datePickerEvent.value?.valueOf() ?? 0;
        const confirmed = await this.confirmService.confirm({
            title: 'Change event',
            message:
                'Do you want to change event #' +
                (idx + 1) +
                ' to ' +
                UtilsService.toDate(ts) +
                '?',
            confirmText: 'Change',
        });
        if (confirmed) {
            this.stopwatchStore.updateStopwatchEvent({ event, ts });
            this.cacheLastNumberOfItems = 0;
        }
    }

    async deleteItem(): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Remove stopwatch',
            message: 'Do you confirm removing stopwatch?',
            confirmText: 'Remove',
        });
        if (!confirmed) {
            return;
        }
        this.isWaiting = true;
        this.stopwatchStore.deleteStopwatch(this.item());
        this.isWaiting = false;
    }

    editTitle($event: Event) {
        $event.preventDefault();
        this.editedTitle = this.item().name;
        this.isEditTitle = true;
    }

    cancelEditTitle() {
        this.isEditTitle = false;
    }

    finishEditTitle() {
        this.stopwatchStore.updateStopwatchTitle({
            stopwatch: this.item(),
            title: this.editedTitle,
        });
        this.isEditTitle = false;
    }

    toggleArchiveItem() {
        this.stopwatchStore.toggleArchiveStopwatch({ stopwatch: this.item(), tsArch: this.tsArch });
    }

    switchDisplayRoundsEvents() {
        const item = this.item();
        if (!item.events.length) {
            this.stopwatchStore.loadStopwatch({ id: item._id, ignoreTsArch: true });
        }
        this.displayEvents = !this.displayEvents;
    }

    private async sleep(duration: number) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    async toggleStats(): Promise<void> {
        if (this.statsContent) {
            this.statsContent = null;
            return;
        }
        const itemValue = this.item();
        if (!itemValue.events.length) {
            this.stopwatchStore.loadStopwatch({ id: itemValue._id, ignoreTsArch: true });
            await this.sleep(200);
        }
        let events = this.stopwatchService.markNonStarters(itemValue.events);
        events = this.stopwatchService.removeDupes(events);

        this.statsFreq = UtilsService.getStatsFreq(events.map((item) => item.ts));
        this.statsContent = [];

        this.statsAvgDay = this.calcStatsAvgDay(events);
        const tmpSecs: number[] = Object.values(this.statsAvgDay.combinedTimeByDay) as number[];
        this.statsContent.push({
            name: 'Minutes per day',
            data: {
                labels: Object.keys(this.statsAvgDay.combinedTimeByDay),
                datasets: [
                    {
                        data: tmpSecs.map((item: number) => Math.round(item / 60)),
                        backgroundColor: UtilsService.chartTheme().bar,
                    },
                ],
            },
        });

        const s = ['day', 'hour', 'month', 'year'];
        for (const x of s) {
            this.statsContent.push({
                name: x,
                data: UtilsService.getStats<StopwatchEvent>(events, x),
            });
        }
    }

    private static dayIndex(date: Date): string {
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    }

    private static addSeconds(acc: Record<string, number>, day: string, seconds: number): void {
        acc[day] = (acc[day] || 0) + seconds;
    }

    /**
     * Credits one start/stop span to the day(s) it covers. A span that crosses
     * midnight is split into the tail of the first day, whole days in between,
     * and the head of the last day.
     */
    private static accumulateSpan(
        acc: Record<string, number>,
        startEvent: StopwatchEvent,
        stopEvent: StopwatchEvent,
    ): void {
        const startDate = new Date(startEvent.ts);
        const stopDate = new Date(stopEvent.ts);
        const startIndex = StopwatchComponent.dayIndex(startDate);
        const stopIndex = StopwatchComponent.dayIndex(stopDate);

        if (startIndex === stopIndex) {
            StopwatchComponent.addSeconds(acc, startIndex, (stopEvent.ts - startEvent.ts) / 1000);
            return;
        }

        const firstDayEnd = new Date(startDate);
        firstDayEnd.setUTCHours(23, 59, 59, 999);
        StopwatchComponent.addSeconds(
            acc,
            startIndex,
            (firstDayEnd.getTime() - startEvent.ts) / 1000,
        );

        const lastDayStart = new Date(stopDate);
        lastDayStart.setUTCHours(0, 0, 0, 0);
        StopwatchComponent.addSeconds(
            acc,
            stopIndex,
            (stopEvent.ts - lastDayStart.getTime()) / 1000,
        );

        const startDay = startDate.getUTCDate();
        const daysInBetween = stopDate.getUTCDate() - startDay + 1;
        for (let j = 1; j < daysInBetween - 1; j++) {
            const currentDate = new Date(startDate);
            currentDate.setUTCDate(startDay + j);
            const day = `${startDate.getUTCFullYear()}-${startDate.getUTCMonth() + 1}-${currentDate.getUTCDate()}`;
            StopwatchComponent.addSeconds(acc, day, 24 * 60 * 60);
        }
    }

    calcStatsAvgDay(events: StopwatchEvent[]): StatsAvgDay {
        const combinedTimeByDay: Record<string, number> = {};
        for (let i = 0; i < events.length - 1; i += 2) {
            StopwatchComponent.accumulateSpan(combinedTimeByDay, events[i], events[i + 1]);
        }
        const combinedTimeByDayValues = Object.values(combinedTimeByDay);
        const sumTimeByDay: number = combinedTimeByDayValues.reduce(
            (acc: number, v: number) => acc + v,
            0,
        );
        const avgTimeByDay = sumTimeByDay / combinedTimeByDayValues.length;
        return {
            combinedTimeByDay: combinedTimeByDay,
            sumTimeByDay: sumTimeByDay,
            avgTimeByDay: avgTimeByDay,
            avgTimeByDayMinutes: Math.round(avgTimeByDay / 60),
        };
    }
}
