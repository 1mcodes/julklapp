import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const testEmailsFile = path.join(process.cwd(), "playwright/.auth/test-emails.json");

/**
 * Cleanup script to remove data records related only to E2E_USERNAME_ID
 * This targets specific user data rather than all test data
 */
async function cleanupE2EUserData() {
  console.log("Starting E2E user data cleanup...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const e2eUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseServiceRoleKey || !e2eUserId) {
    throw new Error(
      "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and E2E_USERNAME_ID must be set in .env.test"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log(`Cleaning up data for E2E user: ${e2eUserId}`);

    // Step 1: Load tracked test emails and find matching user accounts
    console.log("Loading tracked test emails...");
    let testEmails: string[] = [];

    if (fs.existsSync(testEmailsFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(testEmailsFile, "utf8"));
        testEmails = data.emails || [];
        console.log(`Loaded ${testEmails.length} tracked test emails`);
      } catch (error) {
        console.warn("Could not read test emails file:", error);
      }
    } else {
      console.log("No test emails file found - no emails were tracked during tests");
    }

    // Get current users
    console.log("Finding user accounts in Supabase Auth...");
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error("Error fetching auth users:", authUsersError);
      throw authUsersError;
    }

    // Find users whose emails match the tracked test emails (excluding the E2E user)
    const testUserIds = authUsers.users
      .filter((user) => {
        const isNotE2EUser = user.id !== e2eUserId;
        const hasTrackedEmail = testEmails.includes(user.email || "");
        return isNotE2EUser && hasTrackedEmail;
      })
      .map((user) => user.id);

    console.log(`Found ${testUserIds.length} test user accounts to delete (matching tracked emails)`);
    if (testUserIds.length > 0) {
      console.log(
        "Test user emails:",
        authUsers.users
          .filter((user) => testUserIds.includes(user.id))
          .map((user) => `${user.email} (created: ${user.created_at})`)
      );
    } else {
      console.log("No user accounts found matching tracked test emails");
    }

    // Step 2: Find all draws created by the E2E user
    console.log("Finding draws created by E2E user...");
    const { data: userDraws, error: drawsQueryError } = await supabase
      .from("draws")
      .select("id")
      .eq("author_id", e2eUserId);

    if (drawsQueryError) {
      console.error("Error querying draws:", drawsQueryError);
      throw drawsQueryError;
    }

    const drawIds = userDraws?.map((draw) => draw.id) || [];
    console.log(`Found ${drawIds.length} draws created by E2E user`);

    // Step 3: Find all draw_participants that belong to the E2E user
    console.log("Finding draw participants for E2E user...");
    const { data: userParticipants, error: participantsQueryError } = await supabase
      .from("draw_participants")
      .select("id")
      .eq("user_id", e2eUserId);

    if (participantsQueryError) {
      console.error("Error querying draw_participants:", participantsQueryError);
      throw participantsQueryError;
    }

    const participantIds = userParticipants?.map((participant) => participant.id) || [];
    console.log(`Found ${participantIds.length} draw participants for E2E user`);

    // Step 4: Find all matches related to the user's draws or involving the user's participants
    console.log("Finding matches related to E2E user...");
    let matchQuery = supabase.from("matches").select("id");

    // Include matches where the draw belongs to the user
    if (drawIds.length > 0) {
      matchQuery = matchQuery.in("draw_id", drawIds);
    }

    // Include matches where the user is a giver or recipient
    if (participantIds.length > 0) {
      matchQuery = matchQuery.or(
        `giver_id.in.(${participantIds.join(",")}),recipient_id.in.(${participantIds.join(",")})`
      );
    }

    const { data: relatedMatches, error: matchesQueryError } = await matchQuery;

    if (matchesQueryError) {
      console.error("Error querying matches:", matchesQueryError);
      throw matchesQueryError;
    }

    const matchIds = relatedMatches?.map((match) => match.id) || [];
    console.log(`Found ${matchIds.length} matches related to E2E user`);

    // Step 5: Delete AI suggestions related to the matches
    if (matchIds.length > 0) {
      console.log("Deleting AI suggestions for related matches...");
      const { error: aiSuggestionsError } = await supabase.from("ai_suggestions").delete().in("match_id", matchIds);

      if (aiSuggestionsError) {
        console.error("Error deleting AI suggestions:", aiSuggestionsError);
        throw aiSuggestionsError;
      }
      console.log("AI suggestions deleted successfully");
    }

    // Step 6: Delete matches
    if (matchIds.length > 0) {
      console.log("Deleting matches...");
      const { error: matchesDeleteError } = await supabase.from("matches").delete().in("id", matchIds);

      if (matchesDeleteError) {
        console.error("Error deleting matches:", matchesDeleteError);
        throw matchesDeleteError;
      }
      console.log("Matches deleted successfully");
    }

    // Step 7: Delete draw_participants for the E2E user
    if (participantIds.length > 0) {
      console.log("Deleting draw participants for E2E user...");
      const { error: participantsDeleteError } = await supabase
        .from("draw_participants")
        .delete()
        .in("id", participantIds);

      if (participantsDeleteError) {
        console.error("Error deleting draw participants:", participantsDeleteError);
        throw participantsDeleteError;
      }
      console.log("Draw participants deleted successfully");
    }

    // Step 8: Delete draws created by the E2E user
    if (drawIds.length > 0) {
      console.log("Deleting draws created by E2E user...");
      const { error: drawsDeleteError } = await supabase.from("draws").delete().in("id", drawIds);

      if (drawsDeleteError) {
        console.error("Error deleting draws:", drawsDeleteError);
        throw drawsDeleteError;
      }
      console.log("Draws deleted successfully");
    }

    // Step 9: Delete all test user accounts from Supabase Auth
    if (testUserIds.length > 0) {
      console.log("Deleting test user accounts from Supabase Auth...");
      let deletedUsersCount = 0;
      let failedDeletionsCount = 0;

      for (const userId of testUserIds) {
        try {
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteUserError) {
            console.error(`Failed to delete user ${userId}:`, deleteUserError);
            failedDeletionsCount++;
          } else {
            deletedUsersCount++;
          }
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
          failedDeletionsCount++;
        }
      }

      console.log(`Successfully deleted ${deletedUsersCount} user accounts from Supabase Auth`);
      if (failedDeletionsCount > 0) {
        console.warn(`Failed to delete ${failedDeletionsCount} user accounts`);
      }
    }

    // Clean up tracking files
    try {
      if (fs.existsSync(testEmailsFile)) {
        fs.unlinkSync(testEmailsFile);
        console.log("Cleaned up test emails tracking file");
      }
    } catch (error) {
      console.warn("Could not clean up test emails file:", error);
    }

    console.log("E2E user data cleanup completed successfully!");
    console.log(
      `Summary: Removed ${matchIds.length} matches, ${participantIds.length} participants, ${drawIds.length} draws, and cleaned up user accounts`
    );
  } catch (error) {
    console.error("Failed to cleanup E2E user data:", error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.main) {
  cleanupE2EUserData()
    .then(() => {
      console.log("Cleanup script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup script failed:", error);
      process.exit(1);
    });
}

export { cleanupE2EUserData };
