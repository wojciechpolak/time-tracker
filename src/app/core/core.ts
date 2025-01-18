/**
 * core
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

import { Provider } from '@angular/core';
import { LocalStorageService, SessionStorageService } from '../services/storage.service';
import { LoggerService } from '../services/logger.service';

export function provideCore(): Provider[] {
  return [
      LoggerService,
      LocalStorageService,
      SessionStorageService,
      {provide: '$window', useFactory: getWindow},
  ];
}

export function getWindow() {
    return window;
}
