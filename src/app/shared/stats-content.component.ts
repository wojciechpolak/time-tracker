/**
 * stats-content.component
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

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AppMaterialModules } from '../app-modules';
import { StatsContent, StatsFreq } from '../models';

/**
 * The stats card shared by the Last Time and Stopwatch items: a frequency
 * summary followed by one bar chart per grouping period. Callers project any
 * extra summary text into the frequency paragraph.
 *
 * The host is laid out with `display: contents` so `mat-card-content` stays a
 * direct child of the card container, exactly as it was before extraction.
 */
@Component({
    selector: 'app-stats-content',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...AppMaterialModules, BaseChartDirective],
    styles: `
        :host {
            display: contents;
        }
    `,
    template: `
        <mat-card-content class="stats">
            @if (statsFreq(); as freq) {
                <p>
                    Frequency of events: every {{ freq.avgDays.toFixed(2) }} days (or
                    {{ freq.avgHours.toFixed(2) }} hours)<ng-content />
                </p>
            }
            @for (stats of statsContent(); track stats) {
                <div>
                    <h4>{{ stats['name'] }}</h4>
                    <canvas
                        baseChart
                        class="chart"
                        [data]="stats['data']"
                        [options]="options()"
                        [type]="'bar'"
                    >
                    </canvas>
                </div>
            }
        </mat-card-content>
    `,
})
export class StatsContentComponent {
    readonly statsContent = input.required<StatsContent[] | null>();
    readonly statsFreq = input.required<StatsFreq | null>();
    readonly options = input.required<ChartConfiguration['options']>();
}
