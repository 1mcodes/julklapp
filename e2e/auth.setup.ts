import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");
const testEmailsFile = path.join(__dirname, "../playwright/.auth/test-emails.json");

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

setup("initialize test tracking", async () => {
  // Clear any existing test emails file to start fresh
  if (fs.existsSync(testEmailsFile)) {
    fs.unlinkSync(testEmailsFile);
  }

  // Create empty test emails file
  fs.writeFileSync(testEmailsFile, JSON.stringify({ emails: [] }, null, 2));
  console.log("Initialized test email tracking");
});

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
