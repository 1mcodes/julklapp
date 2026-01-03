import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DrawParticipantsPage extends BasePage {
  readonly participantsTable: Locator;
  readonly participantsTableContainer: Locator;
  readonly tableBody: Locator;
  readonly participantRows: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly drawTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.participantsTableContainer = page.getByTestId("participants-table-container");
    this.participantsTable = page.getByTestId("participants-table");
    this.tableBody = this.participantsTable.locator("tbody");
    this.participantRows = this.tableBody.locator('[data-test-id^="participant-row-"]');
    this.loadingSpinner = page.getByTestId("participants-loading");
    this.errorMessage = page.getByTestId("participants-error");
    this.drawTitle = page.getByTestId("draw-title");
  }

  /**
   * Navigate to a specific draw's participants page
   */
  async navigateToDraw(drawId: string) {
    await this.goto(`/dashboard/draws/${drawId}/participants`);
  }

  /**
   * Wait for the participants to load
   */
  async waitForParticipantsToLoad() {
    await this.loadingSpinner.waitFor({ state: "hidden" });
  }

  /**
   * Get the number of participants in the table
   */
  async getParticipantCount(): Promise<number> {
    await this.waitForParticipantsToLoad();
    return await this.participantRows.count();
  }

  /**
   * Get participant data from a specific row
   */
  async getParticipantData(rowIndex: number): Promise<{ name: string; surname: string; email: string }> {
    await this.waitForParticipantsToLoad();
    const row = this.participantRows.nth(rowIndex);
    const name = await row.getByTestId("participant-name").textContent();
    const surname = await row.getByTestId("participant-surname").textContent();
    const email = await row.getByTestId("participant-email").textContent();

    return {
      name: name?.trim() || "",
      surname: surname?.trim() || "",
      email: email?.trim() || "",
    };
  }

  /**
   * Get all participants data
   */
  async getAllParticipants(): Promise<{ name: string; surname: string; email: string }[]> {
    const count = await this.getParticipantCount();
    const participants = [];

    for (let i = 0; i < count; i++) {
      participants.push(await this.getParticipantData(i));
    }

    return participants;
  }

  /**
   * Check if a specific participant exists in the table
   */
  async hasParticipant(firstName: string, lastName: string, email: string): Promise<boolean> {
    const participants = await this.getAllParticipants();
    return participants.some((p) => p.name === firstName && p.surname === lastName && p.email === email);
  }

  /**
   * Get the draw title
   */
  async getDrawTitle(): Promise<string> {
    return (await this.drawTitle.textContent()) || "";
  }

  /**
   * Check if the page shows an error
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Check if the page is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }
}
