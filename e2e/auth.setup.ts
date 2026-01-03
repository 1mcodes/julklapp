import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");

  // Wait for client-side JavaScript to load the form
  await page.waitForTimeout(2000);

  // Use fallback selectors that work with both server and client rendering
  const emailInput = page.locator('input[type="email"], [data-test-id="login-email-input"]').first();
  const passwordInput = page.locator('input[type="password"], [data-test-id="login-password-input"]').first();
  const submitButton = page.locator('button[type="submit"], [data-test-id="login-submit-button"]').first();

  // Fill credentials
  await emailInput.fill("test@123.com");
  await passwordInput.fill("123123a");
  await submitButton.click();

  // Wait until the page receives the cookies.
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("http://localhost:3000/dashboard/created");

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
