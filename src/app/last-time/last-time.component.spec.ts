/**
 * last-time.component.spec
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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { LastTimeComponent } from './last-time.component';
import { Types } from '../models';
import { provideCore } from '../core/core';

describe('LastTimeComponent', () => {
    let component: LastTimeComponent;
    let fixture: ComponentFixture<LastTimeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                LastTimeComponent,
            ],
            providers: [
                provideCore(),
                provideMockStore(),
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LastTimeComponent);
        component = fixture.componentInstance;
        component.item = {
            _id: 'LT-1',
            type: Types.LAST_TIME,
            name: 'LT-1',
            hasMoreTs: false,
            timestamps: [{
                _id: 'LT-TS-1',
                ref: 'LT-1',
                type: Types.LAST_TIME_TS,
                ts: new Date().getTime(),
            }]
        }
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
