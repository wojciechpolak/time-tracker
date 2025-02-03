/**
 * models
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

import { FormControl } from '@angular/forms';
import { MtxDatetimeFormats } from '@ng-matero/extensions/core';

export const AppTitle = 'Time Tracker';

export enum Types {
    LAST_TIME = 'LT',
    LAST_TIME_TS = 'LT-TS',
    STOPWATCH = 'SW',
    STOPWATCH_TS = 'SW-TS',
}

export interface DbResponse {
    ok: boolean;
    id: string;
    rev: string;
}

export interface DbError {
    message?: string | undefined;
    error?: string | boolean | undefined;
}

export interface Stopwatch {
    _id: string;
    type: Types.STOPWATCH;
    name: string;
    events: StopwatchEvent[];
    tsArch?: number;
    finished?: boolean;
}

export interface StopwatchEvent {
    _id: string;
    _rev?: string;
    type: Types.STOPWATCH_TS,
    ref: string;
    name?: string;
    ts: number;
    tsFormControl?: FormControl<Date>;
    ss: boolean; // end=false,start=true
    round?: boolean;
    inUse?: boolean;
}

export interface StopwatchRoundTime {
    id: string;
    timeDiff: number;
}

export interface LastTime {
    _id: string;
    type: Types.LAST_TIME;
    name: string;
    timestamps: TimeStamp[];
    hasMoreTs: boolean;
}

export interface TimeStamp {
    _id: string;
    _rev?: string
    type: Types.LAST_TIME_TS,
    ref: string;
    label?: string;
    ts: number;
}

export interface Deleted {
    _id: string;
    _rev: string;
    _deleted: true;
}

export type Db = Stopwatch | StopwatchEvent | LastTime | TimeStamp | Deleted;

export const DATE_FORMAT: MtxDatetimeFormats = {
    parse: {
        dateInput: 'YYYY-MM-DD',
        monthInput: 'MMMM',
        yearInput: 'YYYY',
        timeInput: 'HH:mm',
        datetimeInput: 'YYYY-MM-DD HH:mm',
    },
    display: {
        dateInput: 'YYYY-MM-DD HH:mm:ss',
        monthInput: 'MMMM',
        yearInput: 'YYYY',
        timeInput: 'HH:mm',
        datetimeInput: 'YYYY-MM-DD HH:mm',
        monthYearLabel: 'YYYY MMMM',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
        popupHeaderDateLabel: 'MMM DD, ddd',
    },
}

export interface StatsAvgDay {
    combinedTimeByDay: Record<string, number>;
    sumTimeByDay: number;
    avgTimeByDay: number;
    avgTimeByDayMinutes: number;
}

export interface StatsData {
    labels: string[];
    datasets: {
        data: number[];
        backgroundColor?: string;
    }[];
}

export interface StatsContent {
    name: string;
    data: StatsData;
}

export interface StatsFreq {
    avgDays: number;
    avgHours: number;
}
