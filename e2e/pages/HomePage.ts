import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the home page
 */
export class HomePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  /**
   * Navigate to the home page
   */
  async navigate() {
    await this.goto("/");
  }

  /**
   * Get the main heading text
   */
  async getHeadingText() {
    return this.heading.textContent();
  }
}
