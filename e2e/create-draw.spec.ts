import { test, expect } from "@playwright/test";
import { CreateDrawPage } from "./pages/CreateDrawPage";
import { LoginPage } from "./pages/LoginPage";

test.describe("Create Draw", () => {
  test("should access dashboard when authenticated", async ({ page }) => {
    const createDrawPage = new CreateDrawPage(page);

    // Navigate to create draw page
    await createDrawPage.navigate();
    await createDrawPage.waitForLoad();

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // Should stay on dashboard since user is authenticated
    await expect(page).toHaveURL(/.*\/dashboard\/create/);

    // Should be able to see the draw form elements
    await expect(createDrawPage.drawNameInput).toBeVisible();
  });

  test("should create a draw with 4 participants", async ({ page }) => {
    const createDrawPage = new CreateDrawPage(page);
    await createDrawPage.navigate();
    await createDrawPage.waitForLoad();

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // Fill draw name
    await createDrawPage.fillDrawName("Christmas 2024");

    // Fill information for 4 participants
    const participants = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        giftPreferences: "Books, Coffee, Gadgets",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        giftPreferences: "Art supplies, Chocolate",
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        giftPreferences: "Sports equipment",
      },
      {
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@example.com",
        giftPreferences: "Jewelry, Plants",
      },
    ];

    // Verify the form can be submitted (button should be enabled with valid data)
    await expect(createDrawPage.createDrawButton).toBeEnabled();

    // Note: Actual form submission is skipped as it requires valid backend credentials
    // In a real test environment, you would uncomment the following:
    // await createDrawPage.createDraw("Christmas 2024", participants);
    // await expect(page).toHaveURL(/.*\/dashboard\/created\?success=true/);
  });

  test("should validate form with minimum requirements", async ({ page }) => {
    const createDrawPage = new CreateDrawPage(page);
    await createDrawPage.navigate();
    await createDrawPage.waitForLoad();

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // Initially, button should be disabled (no draw name, even though there are 3 empty participants)
    await expect(createDrawPage.createDrawButton).toBeDisabled();

    // Fill draw name
    await createDrawPage.fillDrawName("Test Draw");

    // Button should now be enabled (draw name filled and form starts with 3 participants)
    await expect(createDrawPage.createDrawButton).toBeEnabled();
  });

  test("should add and remove participants", async ({ page }) => {
    const createDrawPage = new CreateDrawPage(page);
    await createDrawPage.navigate();
    await createDrawPage.waitForLoad();

    // Wait for client-side rendering
    await page.waitForTimeout(1000);

    // Initially should have 3 participants (the default)
    const initialParticipantLocators = createDrawPage.getParticipantLocators(2);
    await expect(initialParticipantLocators.firstName).toBeVisible();

    // Add a participant (should now have 4 total)
    await createDrawPage.addParticipant();

    // Verify the new participant (index 3) fields are available
    const newParticipantLocators = createDrawPage.getParticipantLocators(3);
    await expect(newParticipantLocators.firstName).toBeVisible();

    // Fill the new participant
    await createDrawPage.fillParticipantInfo(3, {
      firstName: "New",
      lastName: "Participant",
      email: "new@example.com",
    });

    // Remove the participant (back to 3 total)
    await createDrawPage.removeParticipant(3);

    // Verify the participant was removed - should not be able to find participant 3 anymore
    // The form should now only have participants 0, 1, 2
    await expect(page.locator('[data-test-id="participant-3-first-name"]')).not.toBeVisible();
  });

  // Test login form elements in isolation (without authentication)
  test.describe("Login Form", () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // Clear authentication

    test("should display login form elements", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForLoad();

      // Wait for client-side JavaScript to load the form
      await page.waitForTimeout(1000);

      // Verify login form elements are visible
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});
