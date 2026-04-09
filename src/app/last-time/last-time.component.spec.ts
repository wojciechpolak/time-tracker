/**
 * last-time.component.spec
 *
 * Time Tracker Copyright (C) 2023-2026 Wojciech Polak
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LastTime, TimeStamp, Types } from '../models';
import { LastTimeStore } from '../store/last-time.store';
import { TimerService } from '../services/timer.service';
import { LastTimeComponent } from './last-time.component';

const makeTS = (id: string, ref: string, ts: number): TimeStamp => ({
    _id: id,
    type: Types.LAST_TIME_TS,
    ref,
    ts,
});

const makeLT = (id: string, timestamps: TimeStamp[] = []): LastTime => ({
    _id: id,
    type: Types.LAST_TIME,
    name: id,
    timestamps,
    hasMoreTs: false,
});

const mockLastTimeStore = {
    touchLastTime: vi.fn(),
    deleteLastTime: vi.fn(),
    updateLastTimeTitle: vi.fn(),
    updateTimeStampLabel: vi.fn(),
    updateTimeStamp: vi.fn(),
    deleteTimeStamp: vi.fn(),
    loadLastTime: vi.fn(),
};

const mockTimerService = { timer$: of(0) };

async function createFixture(initialItem: LastTime): Promise<ComponentFixture<LastTimeComponent>> {
    await TestBed.configureTestingModule({
        imports: [LastTimeComponent],
        providers: [
            provideZonelessChangeDetection(),
            { provide: LastTimeStore, useValue: mockLastTimeStore },
            { provide: TimerService, useValue: mockTimerService },
        ],
        schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(LastTimeComponent);
    fixture.componentRef.setInput('item', initialItem);
    fixture.detectChanges();
    return fixture;
}

describe('LastTimeComponent', () => {
    afterEach(() => {
        vi.clearAllMocks();
        TestBed.resetTestingModule();
    });

    it('should create', async () => {
        const fixture = await createFixture(makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]));
        expect(fixture.componentInstance).toBeTruthy();
    });

    describe('lastTimestamp', () => {
        it('returns the ts of the first timestamp when present', async () => {
            const ts = Date.now();
            const fixture = await createFixture(makeLT('LT-1', [makeTS('TS-1', 'LT-1', ts)]));
            const comp = fixture.componentInstance as unknown as { lastTimestamp: number };
            expect(comp.lastTimestamp).toBe(ts);
        });

        it('returns 0 when there are no timestamps', async () => {
            const fixture = await createFixture(makeLT('LT-empty', []));
            const comp = fixture.componentInstance as unknown as { lastTimestamp: number };
            expect(comp.lastTimestamp).toBe(0);
        });
    });

    describe('getAgeCssClass', () => {
        async function getClass(item: LastTime): Promise<string> {
            const fixture = await createFixture(item);
            return (
                fixture.componentInstance as unknown as { getAgeCssClass(): string }
            ).getAgeCssClass();
        }

        it('returns age-1d when the last timestamp is within the past day', async () => {
            expect(await getClass(makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]))).toBe(
                'age-1d',
            );
        });

        it('returns age-1w when the last timestamp is 2 days old', async () => {
            const twoDaysAgo = Date.now() - 2 * 86_400_000;
            expect(await getClass(makeLT('LT-1', [makeTS('TS-1', 'LT-1', twoDaysAgo)]))).toBe(
                'age-1w',
            );
        });

        it('returns age-1m when the last timestamp is 10 days old', async () => {
            const tenDaysAgo = Date.now() - 10 * 86_400_000;
            expect(await getClass(makeLT('LT-1', [makeTS('TS-1', 'LT-1', tenDaysAgo)]))).toBe(
                'age-1m',
            );
        });

        it('returns age-3m when the last timestamp is 60 days old', async () => {
            const sixtyDaysAgo = Date.now() - 60 * 86_400_000;
            expect(await getClass(makeLT('LT-1', [makeTS('TS-1', 'LT-1', sixtyDaysAgo)]))).toBe(
                'age-3m',
            );
        });

        it('returns age-1y when the last timestamp is over a year old', async () => {
            const overYearAgo = Date.now() - 400 * 86_400_000;
            expect(await getClass(makeLT('LT-1', [makeTS('TS-1', 'LT-1', overYearAgo)]))).toBe(
                'age-1y',
            );
        });

        it('returns age-1y when there are no timestamps (ts=0 is treated as epoch)', async () => {
            expect(await getClass(makeLT('LT-empty', []))).toBe('age-1y');
        });
    });

    describe('getNextPredictedTime', () => {
        async function getNext(item: LastTime): Promise<string> {
            const fixture = await createFixture(item);
            return (
                fixture.componentInstance as unknown as { getNextPredictedTime(): string }
            ).getNextPredictedTime();
        }

        it('returns -- when there is only one timestamp', async () => {
            expect(await getNext(makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]))).toBe('--');
        });

        it('returns -- when there are no timestamps', async () => {
            expect(await getNext(makeLT('LT-1', []))).toBe('--');
        });

        it('returns a formatted prediction string when multiple timestamps exist', async () => {
            const now = Date.now();
            const item = makeLT('LT-1', [
                makeTS('TS-2', 'LT-1', now),
                makeTS('TS-1', 'LT-1', now - 7 * 86_400_000),
            ]);
            const result = await getNext(item);
            expect(result).not.toBe('--');
            expect(result).toContain('(');
        });
    });

    describe('toggleStats', () => {
        let fixture: ComponentFixture<LastTimeComponent>;
        let component: LastTimeComponent;

        beforeEach(async () => {
            const now = Date.now();
            fixture = await createFixture(
                makeLT('LT-1', [
                    makeTS('TS-2', 'LT-1', now),
                    makeTS('TS-1', 'LT-1', now - 86_400_000),
                ]),
            );
            component = fixture.componentInstance;
        });

        it('populates statsContent and statsFreq on first call', () => {
            const comp = component as unknown as {
                statsContent: unknown;
                statsFreq: unknown;
                toggleStats(): void;
            };
            comp.toggleStats();

            expect(comp.statsContent).not.toBeNull();
            expect(Array.isArray(comp.statsContent)).toBe(true);
            expect(comp.statsFreq).not.toBeNull();
        });

        it('clears statsContent on the second call', () => {
            const comp = component as unknown as {
                statsContent: unknown;
                toggleStats(): void;
            };
            comp.toggleStats();
            comp.toggleStats();
            expect(comp.statsContent).toBeNull();
        });
    });

    describe('title editing', () => {
        let fixture: ComponentFixture<LastTimeComponent>;
        let component: LastTimeComponent;
        const initialItem = makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]);

        beforeEach(async () => {
            fixture = await createFixture(initialItem);
            component = fixture.componentInstance;
        });

        it('editTitle sets the edited title and shows the edit form', () => {
            const comp = component as unknown as {
                editedTitle: string;
                isEditTitle: boolean;
                editTitle(e: Event): void;
            };
            comp.editTitle(new Event('click'));
            expect(comp.isEditTitle).toBe(true);
            expect(comp.editedTitle).toBe('LT-1');
        });

        it('cancelEditTitle hides the edit form', () => {
            const comp = component as unknown as {
                isEditTitle: boolean;
                cancelEditTitle(): void;
            };
            comp.isEditTitle = true;
            comp.cancelEditTitle();
            expect(comp.isEditTitle).toBe(false);
        });

        it('finishEditTitle dispatches the update and closes the form', () => {
            const comp = component as unknown as {
                editedTitle: string;
                isEditTitle: boolean;
                finishEditTitle(): void;
            };
            comp.editedTitle = 'New Name';
            comp.isEditTitle = true;
            comp.finishEditTitle();

            expect(mockLastTimeStore.updateLastTimeTitle).toHaveBeenCalledWith({
                lastTime: initialItem,
                title: 'New Name',
            });
            expect(comp.isEditTitle).toBe(false);
        });
    });

    describe('touch and delete', () => {
        let component: LastTimeComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]),
            );
            component = fixture.componentInstance;
        });

        it('touch delegates to the store', () => {
            component.touch();
            expect(mockLastTimeStore.touchLastTime).toHaveBeenCalledOnce();
        });

        it('deleteItem delegates to the store', () => {
            component.deleteItem();
            expect(mockLastTimeStore.deleteLastTime).toHaveBeenCalledOnce();
        });
    });

    describe('showOlderTimestamps', () => {
        let component: LastTimeComponent;

        beforeEach(async () => {
            const fixture = await createFixture(
                makeLT('LT-1', [makeTS('TS-1', 'LT-1', Date.now())]),
            );
            component = fixture.componentInstance;
        });

        it('calls loadLastTime with limit 0', () => {
            const item = makeLT('LT-1', []);
            component.showOlderTimestamps(item);
            expect(mockLastTimeStore.loadLastTime).toHaveBeenCalledWith({ id: 'LT-1', limit: 0 });
        });
    });

    describe('editTimestampLabel', () => {
        let component: LastTimeComponent;
        const ts = makeTS('TS-1', 'LT-1', Date.now());

        beforeEach(async () => {
            const fixture = await createFixture(makeLT('LT-1', [ts]));
            component = fixture.componentInstance;
        });

        it('calls updateTimeStampLabel when prompt returns a value', () => {
            vi.spyOn(window, 'prompt').mockReturnValue('my label');
            const comp = component as unknown as {
                editTimestampLabel(ts: TimeStamp, idx: number): void;
            };
            comp.editTimestampLabel(ts, 0);
            expect(mockLastTimeStore.updateTimeStampLabel).toHaveBeenCalledWith({
                timestamp: ts,
                label: 'my label',
            });
        });

        it('does nothing when prompt is cancelled', () => {
            vi.spyOn(window, 'prompt').mockReturnValue(null);
            const comp = component as unknown as {
                editTimestampLabel(ts: TimeStamp, idx: number): void;
            };
            comp.editTimestampLabel(ts, 0);
            expect(mockLastTimeStore.updateTimeStampLabel).not.toHaveBeenCalled();
        });
    });

    describe('modifyTimestamp', () => {
        let component: LastTimeComponent;
        const ts = makeTS('TS-1', 'LT-1', Date.now());

        beforeEach(async () => {
            const fixture = await createFixture(makeLT('LT-1', [ts]));
            component = fixture.componentInstance;
        });

        it('calls updateTimeStamp when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const comp = component as unknown as {
                modifyTimestamp(evt: { value: Date | null }, ts: TimeStamp, idx: number): void;
            };
            const newDate = new Date('2024-01-15T12:00:00.000Z');
            comp.modifyTimestamp({ value: newDate }, ts, 0);
            expect(mockLastTimeStore.updateTimeStamp).toHaveBeenCalledWith({
                timestamp: ts,
                newTs: newDate.valueOf(),
            });
        });

        it('does nothing when confirm is cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const comp = component as unknown as {
                modifyTimestamp(evt: { value: Date | null }, ts: TimeStamp, idx: number): void;
            };
            comp.modifyTimestamp({ value: new Date() }, ts, 0);
            expect(mockLastTimeStore.updateTimeStamp).not.toHaveBeenCalled();
        });
    });

    describe('removeTimestamp', () => {
        let component: LastTimeComponent;
        const ts = makeTS('TS-1', 'LT-1', Date.now());

        beforeEach(async () => {
            const fixture = await createFixture(makeLT('LT-1', [ts]));
            component = fixture.componentInstance;
        });

        it('calls deleteTimeStamp when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const comp = component as unknown as {
                removeTimestamp(ts: TimeStamp, idx: number): void;
            };
            comp.removeTimestamp(ts, 0);
            expect(mockLastTimeStore.deleteTimeStamp).toHaveBeenCalledWith(ts);
        });

        it('does nothing when confirm is cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const comp = component as unknown as {
                removeTimestamp(ts: TimeStamp, idx: number): void;
            };
            comp.removeTimestamp(ts, 0);
            expect(mockLastTimeStore.deleteTimeStamp).not.toHaveBeenCalled();
        });
    });
});
