/**
 * dialog.component
 *
 * Time Tracker Copyright (C) 2025 Wojciech Polak
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

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModules } from '../app-modules';

type ParsedData = {link: string | null, text: string};

@Component({
    selector: 'app-dialog',
    imports: [
        ...AppMaterialModules,
    ],
    template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
        <p>{{ parsedData.text }}</p>
        <p><a href="{{ parsedData.link }}" target="_blank">Link</a></p>
    </div>
    <div mat-dialog-actions>
        <button mat-button (click)="onClose()">Dismiss</button>
    </div>
    `,
})
export class AppDialogComponent {

    parsedData: ParsedData;

    constructor(public dialogRef: MatDialogRef<AppDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: {title: string; message: string}) {
        this.parsedData = this.extractAndRemoveHttpLink(data.message);
    }

    onClose(): void {
        this.dialogRef.close();
    }

    extractAndRemoveHttpLink(input: string): ParsedData {
        const urlRegex = /https?:\/\/[^\s]+/;
        const match = input.match(urlRegex);
        if (!match) {
            return {link: null, text: input};
        }
        const link = match[0];
        const text = input.replace(urlRegex, '').trim();
        return {link, text};
    }
}
