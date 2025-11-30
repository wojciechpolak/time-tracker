/**
 * main.component.spec
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

import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';

import { DbService } from '../services/db.service';
import { MainComponent } from './main.component';
import { provideCore } from '../core/core';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    const onDbChangeSubject = new Subject<void>();
    const onRemoteDbErrorSubject = new Subject<void>();
    const dbServiceStub = {
        dbLoaded: of(true),
        onDbChange: onDbChangeSubject.asObservable(),
        onRemoteDbError: onRemoteDbErrorSubject.asObservable(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MainComponent,
            ],
            providers: [
                provideZonelessChangeDetection(),
                provideCore(),
                provideRouter([]),
                provideMockStore(),
                {provide: DbService, useValue: dbServiceStub}
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
