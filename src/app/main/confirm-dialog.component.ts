/**
 * confirm-dialog.component
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

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModules } from '../app-modules';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
}

@Component({
    selector: 'app-confirm-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...AppMaterialModules],
    template: `
        <h1 mat-dialog-title>{{ data.title }}</h1>
        <div mat-dialog-content>
            <p>{{ data.message }}</p>
        </div>
        <div mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">{{ data.cancelText }}</button>
            <button mat-button (click)="onConfirm()">{{ data.confirmText }}</button>
        </div>
    `,
})
export class ConfirmDialogComponent {
    public dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
    public data = inject(MAT_DIALOG_DATA) as ConfirmDialogData;

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
