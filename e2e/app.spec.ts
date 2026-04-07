/**
 * app.spec
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

import { expect, Locator, Page, test } from '@playwright/test';

async function renameTitle(page: Page, card: Locator, title: string) {
    await card.locator('mat-card-title').dblclick();
    await page.getByRole('textbox', { name: 'Name' }).fill(title);
    await page.getByRole('button', { name: 'Done' }).click();
}

async function openCardActions(card: Locator) {
    await card.locator('.mat-card-actions-container button[aria-label="Actions"]').click();
}

async function screenshotIfVisual(target: Page | Locator, name: string, mask: Locator[] = []) {
    if (!process.env['VRT']) {
        return;
    }

    await expect(target).toHaveScreenshot(name, {
        animations: 'disabled',
        caret: 'hide',
        mask,
    });
}

async function waitForPersistedLastPage(page: Page, expectedLastPage: string) {
    await page.waitForFunction((expected: string) => {
        const raw = window.localStorage.getItem('settings');
        if (!raw) {
            return false;
        }

        try {
            const settings = JSON.parse(raw) as { lastPage?: string };
            return settings.lastPage === expected;
        } catch {
            return false;
        }
    }, expectedLastPage);
}

test.describe('Time Tracker', () => {
    test('loads the main shell on the last-time view', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveURL(/\/main\/last-time/);
        await expect(page.getByRole('button', { name: 'Time Tracker' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Last Time' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Stopwatch' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Last Time' })).toBeVisible();
        await screenshotIfVisual(page, 'main-shell.png', [
            page.locator('#connection-status'),
            page.locator('.spinner'),
        ]);
    });

    test('switches between the main tabs', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('tab', { name: 'Stopwatch' }).click();
        await expect(page).toHaveURL(/\/main\/stopwatch/);
        await expect(page.getByRole('button', { name: 'Add Stopwatch' })).toBeVisible();

        await page.getByRole('tab', { name: 'Last Time' }).click();
        await expect(page).toHaveURL(/\/main\/last-time/);
        await expect(page.getByRole('button', { name: 'Add Last Time' })).toBeVisible();
    });

    test('remembers the last visited tab', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('tab', { name: 'Stopwatch' }).click();
        await expect(page).toHaveURL(/\/main\/stopwatch/);
        await waitForPersistedLastPage(page, '/main/stopwatch');

        await page.reload();

        await expect(page).toHaveURL(/\/main\/stopwatch/);
        await expect(page.getByRole('button', { name: 'Add Stopwatch' })).toBeVisible();
    });

    test('creates, edits, browses, and deletes a last-time entry', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Empty list')).toBeVisible();
        await page.getByRole('button', { name: 'Add Last Time' }).click();

        const card = page.locator('app-last-time').first();
        await expect(page.locator('app-last-time')).toHaveCount(1);
        await expect(card).toContainText('Last #');

        await renameTitle(page, card, 'Client onboarding');
        await expect(card.locator('.title')).toHaveText('Client onboarding');
        await screenshotIfVisual(card, 'last-time-card.png', [card.locator('.time')]);

        await card.getByRole('button', { name: 'Touch' }).click();
        await expect(card.getByRole('button', { name: 'Recent entries' })).toBeVisible();
        await card.getByRole('button', { name: 'Recent entries' }).click();
        await expect(card.locator('ol.timestamps li')).toHaveCount(2);
        await expect(card.getByText('First time:')).toBeVisible();

        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Delete' }).click();

        await expect(page.getByText('Empty list')).toBeVisible();
    });

    test('adds last-time entries and shows stats', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Empty list')).toBeVisible();
        await page.getByRole('button', { name: 'Add Last Time' }).click();

        const card = page.locator('app-last-time').first();
        await expect(page.locator('app-last-time')).toHaveCount(1);
        await card.getByRole('button', { name: 'Touch' }).click();
        await card.getByRole('button', { name: 'Touch' }).click();

        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Show Stats' }).click();

        await expect(card.getByText('Frequency of events:')).toBeVisible();
        await expect(card.getByRole('heading', { name: 'day' })).toBeVisible();
        await expect(card.getByRole('heading', { name: 'hour' })).toBeVisible();
        await expect(card.getByRole('heading', { name: 'month' })).toBeVisible();
        await expect(card.getByRole('heading', { name: 'year' })).toBeVisible();

        await card.getByRole('button', { name: 'Recent entries' }).click();
        await expect(card.locator('ol.timestamps li')).toHaveCount(3);
    });

    test('starts, stops, creates a new round, and shows stopwatch stats', async ({ page }) => {
        await page.goto('/main/stopwatch');
        await page.getByRole('button', { name: 'Add Stopwatch' }).click();

        const card = page.locator('app-stopwatch').first();
        await expect(card).toContainText('Stopwatch #');
        await expect(card.getByRole('button', { name: 'STOP' })).toBeVisible();

        await renameTitle(page, card, 'Sprint tracking');
        await expect(card.locator('.title')).toHaveText('Sprint tracking');
        await screenshotIfVisual(card, 'stopwatch-card.png', [card.locator('.time')]);

        await card.getByRole('button', { name: 'STOP' }).click();
        await expect(card.getByRole('button', { name: 'START' })).toBeVisible();

        await card.getByRole('button', { name: 'START' }).click();
        await expect(card.getByRole('button', { name: 'STOP' })).toBeVisible();

        await card.getByRole('button', { name: 'NEW ROUND' }).click();
        await expect(card.getByText('Round #2')).toBeVisible();

        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Show Events' }).click();
        await expect(card.locator('.event-ts')).toHaveCount(5);

        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Show Stats' }).click();
        await expect(card.getByText('Frequency of events:')).toBeVisible();
        await expect(card.getByText('Minutes per day')).toBeVisible();

        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Show Rounds' }).click();
        await expect(card.getByText('Round #2')).toBeVisible();

        page.once('dialog', (dialog) => dialog.accept());
        await openCardActions(card);
        await page.getByRole('menuitem', { name: 'Delete' }).click();

        await expect(page.getByText('Empty list')).toBeVisible();
    });

    test('opens the settings view and exposes the main controls', async ({ page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Database' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Info & Update' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Redirect to HTTPS' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Show DEBUG Tab' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
        await screenshotIfVisual(page, 'settings-general.png', [
            page.locator('#connection-status'),
            page.locator('.spinner'),
        ]);

        await page.getByRole('tab', { name: 'Database' }).click();
        await expect(page.getByRole('button', { name: 'DB Export' })).toBeVisible();

        await page.getByRole('tab', { name: 'Info & Update' }).click();
        await expect(page.getByRole('button', { name: 'check for update' })).toBeVisible();
    });

    test('shows the debug tab when persisted settings enable it', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem(
                'settings',
                JSON.stringify({
                    dbEngine: 'pouchdb',
                    dbName: 'time-tracker',
                    endpoint: '',
                    user: '',
                    password: '',
                    lastPage: '/main/last-time',
                    enableRemoteSync: false,
                    firebaseConfig: '',
                    redirectToHttps: false,
                    showDebug: true,
                }),
            );
        });

        await page.goto('/');

        await expect(page).toHaveURL(/\/main\/last-time/);
        await expect(page.getByRole('tab', { name: 'DEBUG' })).toBeVisible();
    });
});
