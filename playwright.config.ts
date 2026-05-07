import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    // Viewport explícito necesario para que offsetWidth funcione en headless
    viewport: {width: 1280, height: 720},
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
  ],
  // Arranca el servidor de preview antes de los tests E2E
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
