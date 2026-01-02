import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Home Page", () => {
  test("should load successfully", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Wait for the page to load
    await homePage.waitForLoad();

    // Check that the page has a title
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });

  test("should have main heading", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Check that the heading is visible
    await expect(homePage.heading).toBeVisible();
  });
});
