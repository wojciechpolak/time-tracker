/**
 * utils.service.spec
 *
 * Time Tracker Copyright (C) 2026 Wojciech Polak
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

import { UtilsService } from './utils.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('UtilsService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('formats sizes in a human readable form', () => {
        expect(UtilsService.size2human(1)).toBe('1 B');
        expect(UtilsService.size2human(1_500_000)).toBe('1.5 MB');
    });

    it('returns timestamps in milliseconds or seconds', () => {
        vi.spyOn(Date.prototype, 'getTime').mockReturnValue(1_700_000_123_456);

        expect(UtilsService.getTimestamp()).toBe(1_700_000_123_456);
        expect(UtilsService.getTimestamp(false)).toBe(1_700_000_123);
    });

    it('rounds timestamps down to the nearest second', () => {
        expect(UtilsService.roundTs(1_234_567)).toBe(1_234_000);
    });

    it('formats time differences with optional milliseconds and day prefixes', () => {
        expect(UtilsService.getTimeDiff(61_001, true)).toBe('00:01:01.001');
        expect(UtilsService.getTimeDiff(172_861_001, true)).toBe('2d 00:01:01.001');
    });

    it('converts timestamps into a local date string while stripping decimals', () => {
        const isoSpy = vi
            .spyOn(UtilsService, 'toISOLocalString')
            .mockReturnValue('2025-01-02T03:04:05.678Z');

        expect(UtilsService.toDate(1_735_787_045.999, false)).toBe('2025-01-02 03:04:05');
        const [dateArg] = isoSpy.mock.calls.at(-1) ?? [];
        expect(dateArg).toBeInstanceOf(Date);
        expect(dateArg?.getTime()).toBe(1_735_787_045_000);
    });

    it('creates ISO strings from local time', () => {
        const date = new Date(2025, 0, 2, 3, 4, 5, 678);
        const expected = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();

        expect(UtilsService.toISOLocalString(date)).toBe(expected);
    });

    it('formats relative times from milliseconds and seconds', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));
        const rtf = new Intl.RelativeTimeFormat('en', {
            style: 'long',
            numeric: 'always',
        });

        expect(UtilsService.formatFromNow(Date.now() - 30_000)).toBe(rtf.format(-30, 'second'));
        expect(UtilsService.formatFromNow(Math.floor(Date.now() / 1000) - 7200, false)).toBe(
            rtf.format(-2, 'hour'),
        );
    });

    it('formats a timestamp in the 1-59 minute range', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));
        const rtf = new Intl.RelativeTimeFormat('en', {
            style: 'long',
            numeric: 'always',
        });

        // 5 minutes ago
        expect(UtilsService.formatFromNow(Date.now() - 5 * 60_000)).toBe(rtf.format(-5, 'minute'));
    });

    it('includes days and hours for recent multi-day intervals', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));
        const rtf = new Intl.RelativeTimeFormat('en', {
            style: 'long',
            numeric: 'always',
        });
        const parts = rtf.formatToParts(-2, 'day');
        const daysAgo = `${parts[0]?.value} days`;
        const hoursAgo = rtf.format(-3, 'hour');

        expect(UtilsService.formatFromNow(Date.now() - (2 * 86_400_000 + 3 * 3_600_000))).toBe(
            `${daysAgo} ${hoursAgo}`,
        );
    });

    it('returns an empty string when Intl.RelativeTimeFormat is unavailable', () => {
        const originalIntl = globalThis.Intl;
        Object.defineProperty(globalThis, 'Intl', {
            value: undefined,
            configurable: true,
        });

        expect(UtilsService.formatFromNow(Date.now())).toBe('');

        Object.defineProperty(globalThis, 'Intl', {
            value: originalIntl,
            configurable: true,
        });
    });

    it('formats relative timestamps across units', () => {
        vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-18T12:00:00.000Z').getTime());
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

        expect(UtilsService.formatRelativeTime(Date.now() + 90_000)).toBe(rtf.format(2, 'minute'));
        expect(UtilsService.formatRelativeTime(Date.now() - 40 * 86_400_000)).toBe(
            rtf.format(-1, 'month'),
        );
    });

    it('builds chart stats grouped by different periods', () => {
        const events = [
            { ts: new Date(2025, 0, 6, 8, 0, 0).getTime() },
            { ts: new Date(2025, 0, 6, 8, 30, 0).getTime() },
            { ts: new Date(2025, 1, 7, 9, 0, 0).getTime() },
        ];

        const hourStats = UtilsService.getStats(events, 'hour');
        const monthStats = UtilsService.getStats(events, 'month');
        const yearStats = UtilsService.getStats(events, 'year');

        expect(hourStats.labels).toEqual(['8', '9']);
        expect(hourStats.datasets[0]?.data).toEqual([2, 1]);
        expect(monthStats.labels).toEqual(['January', 'February']);
        expect(monthStats.datasets[0]?.data).toEqual([2, 1]);
        expect(yearStats.labels).toEqual(['2025']);
        expect(yearStats.datasets[0]?.data).toEqual([3]);
    });

    it('builds chart stats grouped by week', () => {
        const events = [
            { ts: new Date(2025, 0, 6, 8, 0, 0).getTime() },
            { ts: new Date(2025, 0, 13, 8, 0, 0).getTime() },
        ];
        const weekStats = UtilsService.getStats(events, 'week');
        expect(weekStats.labels.length).toBeGreaterThanOrEqual(1);
        expect(weekStats.datasets[0]?.data.length).toBe(weekStats.labels.length);
    });

    it('logs when getStats is called without a valid period', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        UtilsService.getStats([{ ts: Date.now() }], 'invalid');

        expect(consoleSpy).toHaveBeenCalledWith(
            'groupByTimePeriod: You have to set a period! day | hours | week | month | year',
        );
    });

    it('calculates average timestamp frequency and handles single-item input', () => {
        const freq = UtilsService.getStatsFreq([10_000, 20_000, 30_000]);

        expect(freq).not.toBeNull();
        expect(freq?.avgDays).toBeCloseTo(10_000 / (1000 * 60 * 60 * 24), 10);
        expect(freq?.avgHours).toBeCloseTo(10_000 / (1000 * 60 * 60), 10);
        expect(UtilsService.getStatsFreq([123])).toBeNull();
    });

    it('detects touch devices through maxTouchPoints', () => {
        const original = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
        Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            value: 2,
        });

        try {
            expect(UtilsService.isMobile()).toBe(true);
        } finally {
            if (original) {
                Object.defineProperty(navigator, 'maxTouchPoints', original);
            } else {
                Reflect.deleteProperty(navigator, 'maxTouchPoints');
            }
        }
    });
});
