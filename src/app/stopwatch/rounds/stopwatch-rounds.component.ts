/**
 * stopwatch-rounds.component
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

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppMaterialModules } from '../../app-modules';
import { StopwatchEvent } from '../../models';
import { ItemActionsComponent } from '../../shared/item-actions.component';

/** One row per round, newest first. `display: contents` keeps the card layout. */
@Component({
    selector: 'app-stopwatch-rounds',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...AppMaterialModules, ItemActionsComponent],
    styles: `
        :host {
            display: contents;
        }
    `,
    template: `
        <mat-card-content class="stopwatch-rounds">
            @for (event of rounds(); track event._id; let i = $index) {
                <div>
                    <span class="round">
                        Round #{{ rounds().length - i }} -
                        {{ event.round ? roundsTimeStr()[event._id] : '' }}
                    </span>
                    <span class="round-label">{{ event.name }}</span>
                    @if (!archived()) {
                        <app-item-actions
                            class="ts-actions"
                            editLabel="Edit Label"
                            removeLabel="Remove Event"
                            (edit)="edit.emit({ event, idx: rounds().length - i - 1 })"
                            (remove)="remove.emit({ event, idx: rounds().length - i - 1 })"
                        ></app-item-actions>
                    }
                </div>
            }
        </mat-card-content>
    `,
})
export class StopwatchRoundsComponent {
    readonly rounds = input.required<StopwatchEvent[]>();
    readonly roundsTimeStr = input.required<Record<string, string>>();
    readonly archived = input.required<boolean>();

    readonly edit = output<{ event: StopwatchEvent; idx: number }>();
    readonly remove = output<{ event: StopwatchEvent; idx: number }>();
}
