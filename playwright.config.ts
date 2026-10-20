import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4317",
    headless: true,
  },
  reporter: "list",
});
