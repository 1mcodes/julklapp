import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Login page
 */
export class LoginPage extends BasePage {
  // Define locators that work before client-side rendering
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    // Use fallback selectors that work with both server and client rendering
    this.emailInput = page.locator('input[type="email"], [data-test-id="login-email-input"]').first();
    this.passwordInput = page.locator('input[type="password"], [data-test-id="login-password-input"]').first();
    this.loginButton = page.locator('button[type="submit"], [data-test-id="login-submit-button"]').first();
  }

  /**
   * Navigate to the login page
   */
  async navigate() {
    await this.goto("/login");
  }

  /**
   * Fill login credentials
   */
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Perform login
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.loginButton.click();
  }

  /**
   * Login with test user credentials
   */
  async loginAsTestUser() {
    // Using test credentials - in a real scenario, these would be set up in test environment
    await this.login("test@example.com", "password123");
  }
}
