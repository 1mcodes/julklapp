import { test as teardown } from "@playwright/test";
import { cleanupE2EUserData } from "./cleanup-e2e-user";

/**
 * Global teardown for Playwright tests
 * Cleans up data records related only to E2E_USERNAME_ID from all tables
 */
teardown("cleanup e2e user data", async () => {
  console.log("Starting E2E user data cleanup...");

  try {
    await cleanupE2EUserData();
    console.log("E2E user data cleanup completed successfully!");
  } catch (error) {
    console.error("Failed to cleanup E2E user data:", error);
    throw error;
  }
});
