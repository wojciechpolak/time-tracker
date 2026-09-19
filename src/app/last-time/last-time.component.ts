/**
 * last-time.component
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
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MtxDatetimepickerInputEvent } from '@ng-matero/extensions/datetimepicker';

import { AppMaterialModules } from '../app-modules';
import { ConfirmService } from '../services/confirm.service';
import { LastTime, StatsContent, StatsFreq, TimeStamp } from '../models';
import { TimerService } from '../services/timer.service';
import { UtilsService } from '../services/utils.service';
import { LastTimeStore } from '../store/last-time.store';
import { ItemActionsComponent } from '../shared/item-actions.component';
import { StatsContentComponent } from '../shared/stats-content.component';

@Component({
    selector: 'app-last-time',
    templateUrl: './last-time.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ...AppMaterialModules,
        AsyncPipe,
        FormsModule,
        ItemActionsComponent,
        ReactiveFormsModule,
        StatsContentComponent,
    ],
})
export class LastTimeComponent implements OnInit, OnChanges {
    private confirmService = inject(ConfirmService);
    private lastTimeStore = inject(LastTimeStore);
    private timerService = inject(TimerService);

    readonly item = input.required<LastTime>();

    protected UtilsService: typeof UtilsService = UtilsService;
    protected editedTitle!: string;
    protected expandTimestamps: boolean = false;
    protected isEditTitle: boolean = false;
    protected isWaiting: boolean = false;
    protected statsContent: StatsContent[] | null = null;
    protected statsFreq: StatsFreq | null = null;
    protected tsDate$!: Observable<string>;
    protected tsFormControls: Record<string, FormControl<Date | null>> = {};

    /** True once there is more than a single recorded timestamp to look back on. */
    protected hasTimestampHistory(): boolean {
        const timestamps = this.item().timestamps;
        return !!timestamps && timestamps.length > 1;
    }

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
        this.updateTimestamps();
        this.tsDate$ = this.timerService.timer$.pipe(
            map(() => UtilsService.formatFromNow(this.lastTimestamp)),
        );
    }

    ngOnChanges(changes: SimpleChanges) {
        changes['item'].currentValue.timestamps.forEach((item: TimeStamp) => {
            this.tsFormControls[item._id] = new FormControl(new Date(item.ts));
        });
    }

    updateTimestamps() {
        this.item().timestamps.forEach((item: TimeStamp) => {
            this.tsFormControls[item._id] = new FormControl(new Date(item.ts));
        });
    }

    get lastTimestamp(): number {
        const timestamps = this.item().timestamps;
        return timestamps.length ? timestamps[0].ts : 0;
    }

    touch() {
        this.lastTimeStore.touchLastTime(this.item());
    }

    async deleteItem(): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Remove item',
            message: 'Do you confirm removing this item?',
            confirmText: 'Remove',
        });
        if (!confirmed) {
            return;
        }
        this.isWaiting = true;
        this.lastTimeStore.deleteLastTime(this.item());
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
        this.lastTimeStore.updateLastTimeTitle({ lastTime: this.item(), title: this.editedTitle });
        this.isEditTitle = false;
    }

    editTimestampLabel(ts: TimeStamp, idx: number) {
        const label = prompt('Label #' + (idx + 1));
        if (label !== null) {
            this.lastTimeStore.updateTimeStampLabel({ timestamp: ts, label });
        }
    }

    async modifyTimestamp(
        datePickerEvent: MtxDatetimepickerInputEvent<Date>,
        ts: TimeStamp,
        idx: number,
    ): Promise<void> {
        const newTs = datePickerEvent.value?.valueOf() ?? 0;
        const confirmed = await this.confirmService.confirm({
            title: 'Change timestamp',
            message:
                'Do you want to change timestamp #' +
                (idx + 1) +
                ' to ' +
                UtilsService.toDate(newTs) +
                '?',
            confirmText: 'Change',
        });
        if (confirmed) {
            this.lastTimeStore.updateTimeStamp({ timestamp: ts, newTs });
        }
    }

    async removeTimestamp(ts: TimeStamp, idx: number): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Remove timestamp',
            message: 'Do you confirm removing timestamp #' + (idx + 1) + '?',
            confirmText: 'Remove',
        });
        if (confirmed) {
            this.lastTimeStore.deleteTimeStamp(ts);
        }
    }

    showOlderTimestamps(item: LastTime) {
        this.lastTimeStore.loadLastTime({ id: item._id, limit: 0 });
    }

    toggleStats() {
        if (this.statsContent) {
            this.statsContent = null;
            return;
        }
        const s = ['day', 'hour', 'month', 'year'];
        this.statsContent = [];
        for (const x of s) {
            this.statsContent.push({
                name: x,
                data: UtilsService.getStats<TimeStamp>(this.item().timestamps, x),
            });
        }
        this.statsFreq = UtilsService.getStatsFreq(this.item().timestamps.map((item) => item.ts));
    }

    protected getAgeCssClass(): string {
        const day = 86400000;
        const now = new Date().getTime();
        const timestamps = this.item().timestamps;
        const ts = timestamps.length ? timestamps[0].ts : 0;
        const diff = now - ts;
        let name = 'default';
        if (diff <= day) {
            name = '1d';
        } else if (diff < 7 * day) {
            name = '1w';
        } else if (diff < 30 * day) {
            name = '1m';
        } else if (diff < 90 * day) {
            name = '3m';
        } else if (diff > 365 * day) {
            name = '1y';
        }
        return 'age-' + name;
    }

    protected getNextPredictedTime(): string {
        const ts = this.item().timestamps;
        if (ts.length > 1) {
            const p = (ts[0].ts - ts[ts.length - 1].ts) / (ts.length - 1);
            const tsp = ts[0].ts + Math.round(p);
            return `${UtilsService.formatRelativeTime(tsp)} (${UtilsService.toDate(tsp)})`;
        }
        return '--';
    }
}
