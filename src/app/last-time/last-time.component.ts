/**
 * last-time.component
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

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { Moment } from 'moment';

import { DataService } from '../services/data.service';
import { LastTime, TimeStamp, Types } from '../models';
import { LoggerService } from '../services/logger.service';
import { UtilsService } from '../services/utils.service';

@Component({
    selector: 'app-last-time',
    templateUrl: './last-time.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastTimeComponent implements OnInit, OnChanges {

    @Input() item!: LastTime;

    protected editedTitle!: string;
    protected isEditTitle: boolean = false;
    protected expandTimestamps: boolean = false;
    protected statsContent: any = null;
    protected statsFreq: any = {};
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

    constructor(private cd: ChangeDetectorRef,
                private loggerService: LoggerService,
                private dataService: DataService) {
    }

    ngOnInit() {
        this.updateTimestamps();
    }

    ngOnChanges(changes: SimpleChanges) {
        changes['item'].currentValue.timestamps.forEach((item: TimeStamp) => {
            item.tsFormControl = new FormControl(new Date(item.ts)) as any;
        })
    }

    updateTimestamps() {
      this.item.timestamps.forEach(item => {
            item.tsFormControl = new FormControl(new Date(item.ts)) as any;
        })
    }

    get lastTimestamp(): number {
        return this.item.timestamps[0].ts;
    }

    touch() {
        let ts = UtilsService.getTimestamp();
        let timestamp: TimeStamp = {
            _id: Types.LAST_TIME_TS + '-' + ts.toString(),
            ref: this.item._id,
            type: Types.LAST_TIME_TS,
            ts: ts,
        };
        this.dataService.putItem(timestamp, () => {
            this.loggerService.log('Successfully posted a new LastTime-TS!');
        });
    }

    async deleteItem() {
        let items = this.item.timestamps.map((r: any) => {
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
        this.dataService.updateItem(this.item, (doc: LastTime) => {
            doc.name = this.editedTitle;
        });
        this.isEditTitle = false;
    }

    editTimestampLabel(ts: TimeStamp, idx: number) {
        let label = prompt('Label #' + (idx + 1));
        if (label === null) {
            return;
        }
        this.dataService.updateItem(ts, (doc: TimeStamp) => {
            doc.label = label ?? '';
        });
    }

    modifyTimestamp(datePickerEvent: any, ts: TimeStamp, idx: number): void {
        let newTs = (<Moment>datePickerEvent.value).valueOf();
        if (!confirm('Do you want to change timestamp #' + (idx + 1) +
            ' to ' + UtilsService.toDate(newTs) + '?')) {
            return;
        }
        this.dataService.updateItem(ts, (doc: TimeStamp) => {
            doc.ts = newTs;
        });
    }

    removeTimestamp(ts: TimeStamp, idx: number) {
        if (!confirm('Do you confirm removing timestamp #' + (idx + 1))) {
            return;
        }
        this.dataService.deleteItem(ts);
    }

    async showOlderTimestamps(item: LastTime) {
        await this.dataService.fetchTimestamps(item, 0);
        this.updateTimestamps();
        this.cd.detectChanges();
    }

    toggleStats() {
        if (this.statsContent) {
            this.statsContent = null;
            return;
        }
        let s = ['day', 'hour', 'month', 'year'];
        this.statsContent = [];
        for (let x of s) {
            this.statsContent.push({
                name: x,
                data: UtilsService.getStats(this.item.timestamps, x)
            })
        }
        this.statsFreq = UtilsService.getStatsFreq(this.item.timestamps.map(item => item.ts));
    }

    protected getAgeCssClass(): string {
        const day = 86400000;
        let now = new Date().getTime();
        let ts = this.item.timestamps[0].ts;
        let diff = now - ts;
        let name = 'default';
        if (diff <= day) {
            name = '1d';
        }
        else if (diff < 7 * day) {
            name = '1w';
        }
        else if (diff < 30 * day) {
            name = '1m';
        }
        else if (diff < 90 * day) {
            name = '3m';
        }
        else if (diff > 365 * day) {
            name = '1y'
        }
        return 'age-' + name;
    }

    protected getNextPredictedTime(): string {
        let ts = this.item.timestamps;
        if (ts.length > 1) {
            let p = (ts[0].ts - ts[ts.length - 1].ts) / (ts.length - 1);
            let tsp = ts[0].ts + Math.round(p)
            return `${UtilsService.formatRelativeTime(tsp)} (${UtilsService.toDate(tsp)})`;
        }
        return '--';
    }
}
