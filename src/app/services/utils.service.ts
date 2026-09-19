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
        let timeString =
            hours.toString().padStart(2, '0') +
            ':' +
            minutes.toString().padStart(2, '0') +
            ':' +
            seconds.toString().padStart(2, '0');
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

    private static readonly SECONDS_PER_DAY = 86400;

    /** Upper bound (exclusive) and divisor for each sub-day relative unit. */
    private static readonly RELATIVE_SCALES: [number, number, Intl.RelativeTimeFormatUnit][] = [
        [60, 1, 'second'],
        [3600, 60, 'minute'],
        [UtilsService.SECONDS_PER_DAY, 3600, 'hour'],
    ];

    /**
     * Renders a span of a day or more. Spans inside the first week are given
     * as "N days M hours" when there is more than a whole hour left over.
     */
    private static formatDaysFromNow(rtf: Intl.RelativeTimeFormat, secDiff: number): string {
        const days = Math.floor(secDiff / UtilsService.SECONDS_PER_DAY);
        const withinFirstWeek =
            secDiff > UtilsService.SECONDS_PER_DAY && secDiff < 7 * UtilsService.SECONDS_PER_DAY;
        const remainingHours = (secDiff - days * UtilsService.SECONDS_PER_DAY) / 3600;
        if (withinFirstWeek && remainingHours > 1) {
            const daysValue = rtf.formatToParts(-days, 'day')[0].value;
            const daysAgo = daysValue + ' ' + (daysValue === '1' ? 'day' : 'days');
            const hours = rtf.format(-Math.floor(remainingHours), 'hour');
            return `${daysAgo} ${hours}`;
        }
        return rtf.format(-days, 'day');
    }

    static formatFromNow(value: number, fromMs: boolean = true, lang: string = 'en') {
        if (!Intl || !Intl.RelativeTimeFormat) {
            return '';
        }
        const rtf = new Intl.RelativeTimeFormat(lang, {
            style: 'long',
            numeric: 'always',
        });
        const valueMs = fromMs ? value : value * 1000;
        const secDiff = Math.floor((new Date().getTime() - valueMs) / 1000);

        const scale = UtilsService.RELATIVE_SCALES.find(([limit]) => secDiff < limit);
        if (scale) {
            const [, divisor, unit] = scale;
            return rtf.format(-Math.floor(secDiff / divisor), unit);
        }
        return UtilsService.formatDaysFromNow(rtf, secDiff);
    }

    static formatRelativeTime(ts: number, lang: string = 'en') {
        const currentTime = Date.now();
        const timeDifference = ts - currentTime;
        const secondsDifference = Math.round(timeDifference / 1000);
        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
        const thresholds = [
            { unit: 'second', threshold: 60 },
            { unit: 'minute', threshold: 60 },
            { unit: 'hour', threshold: 24 },
            { unit: 'day', threshold: 30 },
            { unit: 'month', threshold: 12 },
            { unit: 'year', threshold: Number.POSITIVE_INFINITY },
        ];
        function _formatTimestamp(timestamp: number) {
            let remainingTime = timestamp;
            for (const { unit, threshold } of thresholds) {
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

    static getStats<T extends { ts: number }>(events: T[], period: string): StatsData {
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
                d = date.toLocaleString('en-us', { weekday: 'long' });
            } else if (period === 'hour') {
                d = Math.floor(date.getHours());
            } else if (period === 'week') {
                d = Math.floor(date.getTime() / (oneDay * 7));
            } else if (period === 'month') {
                const months = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];
                d = months[((date.getFullYear() - 1970) * 12 + date.getMonth()) % 12];
            } else if (period === 'year') {
                d = date.getFullYear();
            } else {
                console.log(
                    'groupByTimePeriod: You have to set a period! day | hours | week | month | year',
                );
            }
            res[d] = res[d] || 0;
            res[d]++;
        }
        const ret: Ret[] = [];
        for (const k in res) {
            ret.push({ key: k, value: res[k] });
        }
        // ret.sort((a, b) => b.value - a.value);
        return {
            labels: ret.map((item) => item.key),
            datasets: [
                {
                    data: ret.map((item) => item.value),
                    backgroundColor: UtilsService.chartTheme().bar,
                },
            ],
        };
    }

    /** Whether the OS currently prefers a dark color scheme. */
    static prefersDark(): boolean {
        return (
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
        );
    }

    /** Warm "paper" chart colors that read well in both light and dark mode. */
    static chartTheme(): { bar: string; tick: string; grid: string } {
        const dark = UtilsService.prefersDark();
        return {
            bar: dark ? 'rgba(232, 154, 120, 0.85)' : 'rgba(166, 91, 60, 0.75)',
            tick: dark ? '#b8a999' : '#8c7e6d',
            grid: dark ? 'rgba(240, 224, 206, 0.1)' : 'rgba(74, 54, 38, 0.1)',
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
        } else {
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
            avgHours: avgHours,
        };
    }

    static isMobile(): boolean {
        return 'ontouchstart' in window || !!navigator.maxTouchPoints;
    }
}
