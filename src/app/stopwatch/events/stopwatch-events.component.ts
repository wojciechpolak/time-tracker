/**
 * stopwatch-events.component
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

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MtxDatetimepickerInputEvent } from '@ng-matero/extensions/datetimepicker';

import { AppMaterialModules } from '../../app-modules';
import { StopwatchEvent } from '../../models';
import { ItemActionsComponent } from '../../shared/item-actions.component';
import { TimerService } from '../../services/timer.service';
import { UtilsService } from '../../services/utils.service';

/** The raw start/stop event log, newest first, with editable timestamps. */
@Component({
    selector: 'app-stopwatch-events',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...AppMaterialModules, ItemActionsComponent, NgClass, ReactiveFormsModule],
    styles: `
        :host {
            display: contents;
        }
    `,
    template: `
        <mat-card-content class="stopwatch-events">
            @for (event of events(); track event._id; let i = $index) {
                <div class="event-ts">
                    <span [ngClass]="{ ignored: !event.inUse }">
                        #{{ events().length - i }}:
                        <span [ngClass]="{ start: event.ss, end: !event.ss }">●</span>
                        <mat-form-field class="event-ts-input">
                            <input
                                matInput
                                [formControl]="$any(event.tsFormControl)"
                                [mtxDatetimepicker]="datePicker"
                                (dateChange)="
                                    modify.emit({
                                        datePickerEvent: $event,
                                        event,
                                        idx: events().length - i - 1,
                                    })
                                "
                                matTooltip="{{ relativeTimes()[i] }}"
                                matTooltipPosition="above"
                            />
                            <mtx-datetimepicker
                                #datePicker
                                [type]="'datetime'"
                                [mode]="'auto'"
                                [touchUi]="UtilsService.isMobile()"
                                [timeInput]="true"
                            >
                            </mtx-datetimepicker>
                            <mtx-datetimepicker-toggle [for]="$any(datePicker)" matSuffix>
                            </mtx-datetimepicker-toggle>
                        </mat-form-field>
                        {{ event.round ? '[R]' : '' }}
                    </span>
                    @if (event.name) {
                        <span class="round-label">{{ event.name }}</span>
                    }
                    @if (!archived()) {
                        <app-item-actions
                            class="ts-actions"
                            editLabel="Edit Label"
                            removeLabel="Remove Event"
                            (edit)="edit.emit({ event, idx: events().length - i - 1 })"
                            (remove)="remove.emit({ event, idx: events().length - i - 1 })"
                        ></app-item-actions>
                    }
                </div>
            }
        </mat-card-content>
    `,
})
export class StopwatchEventsComponent {
    readonly events = input.required<StopwatchEvent[]>();
    readonly archived = input.required<boolean>();

    readonly modify = output<{
        datePickerEvent: MtxDatetimepickerInputEvent<Date>;
        event: StopwatchEvent;
        idx: number;
    }>();
    readonly edit = output<{ event: StopwatchEvent; idx: number }>();
    readonly remove = output<{ event: StopwatchEvent; idx: number }>();

    protected UtilsService: typeof UtilsService = UtilsService;

    private timerService = inject(TimerService);
    private tick = toSignal(this.timerService.timer$, { initialValue: 0 });

    /**
     * "5 minutes ago" per event. These were re-evaluated by the parent's own
     * change detection before this list became a component; depending on the
     * timer here keeps them refreshing now that the list is OnPush.
     */
    protected readonly relativeTimes = computed(() => {
        void this.tick();
        return this.events().map((event) => UtilsService.formatFromNow(event.ts));
    });
}
