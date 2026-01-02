import { Page } from "@playwright/test";

/**
 * Base page object model class
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path = "/") {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to load
   */
  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get the page title
   */
  async getTitle() {
    return this.page.title();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
