/**
 * utils.service
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

import { StatsData, StatsFreq } from '../models';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UtilsService {

    static size2human(size: number): string {
        const i = Math.floor(Math.log(size) / Math.log(1000));
        const num = parseFloat((size / Math.pow(1000, i)).toFixed(2));
        return num + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }

    static getTimestamp(ms: boolean = true): number {
        if (ms) {
            return new Date().getTime();
        }
        return Math.floor(new Date().getTime() / 1000);
    }

    static roundTs(ts: number): number {
        return ts - (ts % 1000);
    }

    static getTimeDiff(time: number, ms: boolean = false): string {
        const d = new Date(time);
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const seconds = d.getSeconds();
        let timeString = hours.toString().padStart(2, '0')
            + ':' + minutes.toString().padStart(2, '0')
            + ':' + seconds.toString().padStart(2, '0');
        if (ms) {
            timeString += '.' + d.getMilliseconds().toString().padStart(3, '0');
        }
        if (d.getTime() > 86400000) {
            timeString = Math.floor(d.getTime() / 86400000) + 'd ' + timeString;
        }
        return timeString;
    }

    static toDate(ts: number, fromMs: boolean = true): string {
        const time = parseInt(ts?.toString().split('.')[0], 10);
        const multiply = fromMs ? 1 : 1000;
        const s = this.toISOLocalString(new Date(time * multiply))
            .replace('T', ' ')
            .replace('Z', ' ');
        return s.slice(0, 19);
    }

    static toISOLocalString(time: Date): string {
        return new Date(time.getTime() - time.getTimezoneOffset() * 60000).toISOString();
    }

    static formatFromNow(value: number, fromMs: boolean = true, lang: string = 'en') {
        if (Intl && Intl.RelativeTimeFormat) {
            const rtf = new Intl.RelativeTimeFormat(lang, {
                style: 'long',
                numeric: 'always'
            });
            let secDiff;
            if (fromMs) {
                secDiff = Math.floor((new Date().getTime() - value) / 1000);
            }
            else {
                secDiff = Math.floor((new Date().getTime() - value * 1000) / 1000);
            }
            let ret;
            if (secDiff < 60) {
                ret = rtf.format(-secDiff, 'second');
            }
            else if (secDiff < 3600) {
                ret = rtf.format(-Math.floor(secDiff / 60), 'minute');
            }
            else if (secDiff < 86400) {
                ret = rtf.format(-Math.floor(secDiff / 3600), 'hour');
            }
            else if (secDiff > 86400 && secDiff < (7 * 86400)) {
                const days = Math.floor(secDiff / 86400);
                const remainingHours = (secDiff - (days * 86400)) / 3600;
                if (remainingHours > 1) {
                    const p1 = rtf.formatToParts(-Math.floor(secDiff / 86400), 'day');
                    let daysAgo = p1[0].value;
                    daysAgo = daysAgo + ' ' + (daysAgo === '1' ? 'day' : 'days');
                    const hours = rtf.format(-Math.floor(remainingHours), 'hour');
                    ret = `${daysAgo} ${hours}`;
                }
                else {
                    ret = rtf.format(-Math.floor(secDiff / 86400), 'day');
                }
            }
            else {
                ret = rtf.format(-Math.floor(secDiff / 86400), 'day');
            }
            return ret;
        }
        return '';
    }

    static formatRelativeTime(ts: number, lang: string = 'en') {
        const currentTime = Date.now();
        const timeDifference = ts - currentTime;
        const secondsDifference = Math.round(timeDifference / 1000);
        const rtf = new Intl.RelativeTimeFormat(lang, {numeric: 'auto'});
        const thresholds = [
            {unit: 'second', threshold: 60},
            {unit: 'minute', threshold: 60},
            {unit: 'hour', threshold: 24},
            {unit: 'day', threshold: 30},
            {unit: 'month', threshold: 12},
            {unit: 'year', threshold: Number.POSITIVE_INFINITY}
        ];
        function _formatTimestamp(timestamp: number) {
            let remainingTime = timestamp;
            for (const {unit, threshold} of thresholds) {
                if (Math.abs(remainingTime) < threshold) {
                    const value = Math.round(remainingTime);
                    return rtf.format(Math.round(value), unit as Intl.RelativeTimeFormatUnit);
                }
                remainingTime /= threshold;
            }
            return rtf.format(Math.round(remainingTime), 'year');
        }
        return _formatTimestamp(secondsDifference);
    }

    static getStats<T extends {ts: number}>(events: T[], period: string): StatsData {
        type Res = Record<string | number, number>;
        type Ret = {
            key: string;
            value: number;
        };
        const res: Res = {};
        const oneDay = 86400 * 1000;
        for (const item of events) {
            const date = new Date(item.ts);
            let d: string | number = '';
            if (period === 'day') {
                d = date.toLocaleString('en-us', {weekday: 'long'});
            }
            else if (period === 'hour') {
                d = Math.floor(date.getHours())
            }
            else if (period === 'week') {
                d = Math.floor(date.getTime() / (oneDay * 7));
            }
            else if (period === 'month') {
                const months = [
                    'January', 'February', 'March', 'April',
                    'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'
                ];
                d = months[(((date.getFullYear() - 1970) * 12 + date.getMonth()) % 12)];
            }
            else if (period === 'year') {
                d = date.getFullYear();
            }
            else {
                console.log('groupByTimePeriod: You have to set a period! day | hours | week | month | year');
            }
            res[d] = res[d] || 0;
            res[d]++;
        }
        const ret: Ret[] = [];
        for (const k in res) {
            ret.push({key: k, value: res[k]});
        }
        // ret.sort((a, b) => b.value - a.value);
        return {
            labels: ret.map(item => item.key),
            datasets: [
                {
                    data: ret.map(item => item.value),
                    backgroundColor: 'rgb(255, 99, 132, 0.6)',
                }
            ]
        };
    }

    static getStatsFreq(ts: number[]): StatsFreq | null {
        ts.sort();

        // Calculate the differences between adjacent timestamps
        const diffs = [];
        if (ts.length > 1) {
            for (let i = 0; i < ts.length - 1; i++) {
                const diff = ts[i + 1] - ts[i];
                diffs.push(diff);
            }
        }
        else {
            diffs.push(0);
        }

        // Calculate the sum of all differences in milliseconds
        const sumDiff = diffs.reduce((acc, diff) => acc + diff, 0);

        // Calculate the average difference in milliseconds
        const avgDiff = sumDiff / diffs.length;

        // Convert the average difference to days and hours
        const avgDays = avgDiff / (1000 * 60 * 60 * 24);
        const avgHours = avgDiff / (1000 * 60 * 60);

        if (avgHours === 0) {
            return null;
        }
        return {
            avgDays: avgDays,
            avgHours: avgHours
        };
    }

    static isMobile(): boolean {
        return 'ontouchstart' in window || !!navigator.maxTouchPoints;
    }
}
