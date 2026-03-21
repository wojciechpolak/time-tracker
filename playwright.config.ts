import { defineConfig } from '@playwright/test';

const visualMode = process.env.VRT === '1';
const defaultReporter = process.env.CI ? ([['github']] as const) : ([['list']] as const);
const visualReporter = [...defaultReporter, ['html', { open: 'never' }]] as const;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    expect: {
        toHaveScreenshot: {
            pathTemplate: '.visual-regression/{testFilePath}/{arg}{ext}',
        },
    },
    reporter: visualMode ? visualReporter : defaultReporter,
    use: {
        baseURL: 'http://127.0.0.1:4200',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run start -- --host 127.0.0.1 --port 4200',
        url: 'http://127.0.0.1:4200',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
