/**
 * item-actions.component
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

import { AppMaterialModules } from '../app-modules';

/**
 * The per-timestamp / per-event overflow menu shared by the Last Time and
 * Stopwatch lists. The host carries the `ts-actions` class, which supplies the
 * inline-block layout the previous `<span>` host got from the same rule.
 */
@Component({
    selector: 'app-item-actions',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...AppMaterialModules],
    template: `
        <mat-card-actions>
            <button
                mat-icon-button
                matTooltip="Actions"
                aria-label="Actions"
                [matMenuTriggerFor]="menu"
            >
                <mat-icon>more_vert</mat-icon>
                <mat-menu [overlapTrigger]="false" #menu="matMenu">
                    <button mat-menu-item (click)="edit.emit()">{{ editLabel() }}</button>
                    <button mat-menu-item (click)="remove.emit()">{{ removeLabel() }}</button>
                </mat-menu>
            </button>
        </mat-card-actions>
    `,
})
export class ItemActionsComponent {
    readonly editLabel = input.required<string>();
    readonly removeLabel = input.required<string>();

    readonly edit = output();
    readonly remove = output();
}
