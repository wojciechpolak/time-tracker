/**
 * confirm.service
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

import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../main/confirm-dialog.component';

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ConfirmService {
    private dialog = inject(MatDialog);

    async confirm(options: ConfirmOptions): Promise<boolean> {
        const data: ConfirmDialogData = {
            title: options.title ?? 'Confirm',
            message: options.message,
            confirmText: options.confirmText ?? 'OK',
            cancelText: options.cancelText ?? 'Cancel',
        };
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data,
            autoFocus: false,
        });
        const result = await firstValueFrom(dialogRef.afterClosed());
        return result === true;
    }
}
