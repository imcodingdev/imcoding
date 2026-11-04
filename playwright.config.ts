import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT ?? 3100)

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: 'npm run build && npm run start',
    env: { NEXT_PUBLIC_FAKE_BACKEND: '1', PORT: String(port) },
    port,
    // Chỉ tái dùng server có sẵn khi đặt REUSE_SERVER=1; server đó PHẢI là bản fake backend
    // (NEXT_PUBLIC_FAKE_BACKEND=1), không được là server thật trên cùng cổng.
    reuseExistingServer: !!process.env.REUSE_SERVER,
    timeout: 240_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
