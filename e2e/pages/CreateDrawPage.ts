import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Create Draw page
 */
export class CreateDrawPage extends BasePage {
  // Main form elements with fallback selectors
  readonly drawNameInput: Locator;
  readonly addParticipantButton: Locator;
  readonly createDrawButton: Locator;

  constructor(page: Page) {
    super(page);
    // Use fallback selectors that work with both server and client rendering
    this.drawNameInput = page.locator('input[type="text"], [data-test-id="draw-name-input"]').first();
    this.addParticipantButton = page
      .locator('button:has-text("Add Participant"), [data-test-id="add-participant-button"]')
      .first();
    this.createDrawButton = page.locator('button:has-text("Create Draw"), [data-test-id="create-draw-button"]').first();
  }

  /**
   * Navigate to the create draw page
   */
  async navigate() {
    await this.goto("/dashboard/create");
  }

  /**
   * Fill the draw name
   */
  async fillDrawName(name: string) {
    await this.drawNameInput.fill(name);
  }

  /**
   * Get the participant input locators for a specific participant index
   */
  getParticipantLocators(index: number) {
    return {
      firstName: this.page
        .locator(`input[placeholder*="first name"], [data-test-id="participant-${index}-first-name"]`)
        .first(),
      lastName: this.page
        .locator(`input[placeholder*="last name"], [data-test-id="participant-${index}-last-name"]`)
        .first(),
      email: this.page.locator(`input[type="email"], [data-test-id="participant-${index}-email"]`).first(),
      giftPreferences: this.page.locator(`textarea, [data-test-id="participant-${index}-gift-preferences"]`).first(),
      removeButton: this.page
        .locator(`button:has-text("Remove"), [data-test-id="remove-participant-${index}-button"]`)
        .first(),
    };
  }

  /**
   * Fill participant information for a specific participant
   */
  async fillParticipantInfo(
    index: number,
    participant: {
      firstName: string;
      lastName: string;
      email: string;
      giftPreferences?: string;
    }
  ) {
    const locators = this.getParticipantLocators(index);
    await locators.firstName.fill(participant.firstName);
    await locators.lastName.fill(participant.lastName);
    await locators.email.fill(participant.email);
    if (participant.giftPreferences) {
      await locators.giftPreferences.fill(participant.giftPreferences);
    }
  }

  /**
   * Add a new participant
   */
  async addParticipant() {
    await this.addParticipantButton.click();
  }

  /**
   * Remove a participant by index
   */
  async removeParticipant(index: number) {
    const locators = this.getParticipantLocators(index);
    await locators.removeButton.click();
  }

  /**
   * Submit the create draw form
   */
  async submitDraw() {
    await this.createDrawButton.click();
  }

  /**
   * Fill draw name and multiple participants in one method
   */
  async fillDrawForm(
    drawName: string,
    participants: {
      firstName: string;
      lastName: string;
      email: string;
      giftPreferences?: string;
    }[]
  ) {
    await this.fillDrawName(drawName);

    // Fill existing participants (form starts with 3)
    const existingParticipants = Math.min(participants.length, 3);
    for (let i = 0; i < existingParticipants; i++) {
      await this.fillParticipantInfo(i, participants[i]);
    }

    // Add additional participants if needed
    for (let i = 3; i < participants.length; i++) {
      await this.addParticipant();
      await this.fillParticipantInfo(i, participants[i]);
    }
  }

  /**
   * Create a complete draw with name and participants
   */
  async createDraw(
    drawName: string,
    participants: {
      firstName: string;
      lastName: string;
      email: string;
      giftPreferences?: string;
    }[]
  ) {
    await this.fillDrawForm(drawName, participants);
    await this.submitDraw();
  }
}
