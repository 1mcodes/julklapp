import { describe, it, expect, vi, beforeEach } from "vitest";

import { DrawService } from "./draw.service";
import type { CreateDrawCommand } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

// Mock the logger service
vi.mock("./logger.service", () => ({
  LoggerService: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the admin client
const mockAdminClient = {
  from: vi.fn(),
  auth: {
    admin: {
      inviteUserByEmail: vi.fn(),
      listUsers: vi.fn(),
    },
  },
};

vi.mock("../../db/supabase.admin.client", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Type for our mock Supabase client
interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
}

describe("DrawService", () => {
  let mockSupabase: MockSupabaseClient;
  let drawService: DrawService;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh mock Supabase client for each test
    mockSupabase = {
      from: vi.fn(),
    };

    drawService = new DrawService(mockSupabase as unknown as SupabaseClient);
  });

  describe("createDraw", () => {
    const validCommand: CreateDrawCommand = {
      name: "Christmas 2025",
      participants: [
        {
          name: "John",
          surname: "Doe",
          email: "john@example.com",
          gift_preferences: "Books",
        },
        {
          name: "Jane",
          surname: "Smith",
          email: "jane@example.com",
          gift_preferences: "Electronics",
        },
        {
          name: "Bob",
          surname: "Johnson",
          email: "bob@example.com",
          gift_preferences: "Sports equipment",
        },
      ],
    };

    const mockAuthorId = "user-123";

    it("should successfully create a draw with participants", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      // Mock successful participants insertion via admin client
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: validCommand.participants.map((p, i) => ({
          id: `participant-${i}`,
          email: p.email,
        })),
        error: null,
      });

      const mockParticipantsInsert = vi.fn().mockReturnValue({
        select: mockParticipantsSelect,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: mockParticipantsInsert,
          };
        }
      });

      // Mock auth admin methods
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockAdminClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const result = await drawService.createDraw(validCommand, mockAuthorId);

      expect(result).toEqual({
        id: mockDrawId,
        name: validCommand.name,
        created_at: mockCreatedAt,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("draws");
      expect(mockAdminClient.from).toHaveBeenCalledWith("draw_participants");
    });

    it("should throw error if draw insertion fails", async () => {
      const mockError = { message: "Database error" };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      await expect(drawService.createDraw(validCommand, mockAuthorId)).rejects.toThrow("Failed to create draw");
    });

    it("should cleanup draw and throw error when participant insertion fails", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      // Mock delete for cleanup
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: mockDelete,
          };
        }
      });

      // Mock participants insertion that fails
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Participant insertion error" },
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      await expect(drawService.createDraw(validCommand, mockAuthorId)).rejects.toThrow("Failed to create participants");

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", mockDrawId);
    });

    it("should throw error when participants data returned but empty", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      // Mock delete for cleanup
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: mockDelete,
          };
        }
      });

      // Mock participants insertion that returns empty array
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      await expect(drawService.createDraw(validCommand, mockAuthorId)).rejects.toThrow("Failed to create participants");

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", mockDrawId);
    });

    it("should handle auth provisioning failure gracefully without failing draw", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: validCommand.participants.map((p, i) => ({
          id: `participant-${i}`,
          email: p.email,
        })),
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      // Mock auth admin methods - listUsers succeeds but inviteUserByEmail fails
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockAdminClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: "Failed to invite user" },
      });

      // Should succeed despite auth failure
      const result = await drawService.createDraw(validCommand, mockAuthorId);

      expect(result).toEqual({
        id: mockDrawId,
        name: validCommand.name,
        created_at: mockCreatedAt,
      });
    });

    it("should handle case-insensitive email checking for existing users", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: "participant-1",
            email: "JOHN@EXAMPLE.COM", // Different case
          },
        ],
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      // Mock existing user with lowercase email
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: "existing-user-1",
              email: "john@example.com", // lowercase
            },
          ],
        },
        error: null,
      });

      const singleParticipantCommand = {
        name: "Test Draw",
        participants: [
          {
            name: "John",
            surname: "Doe",
            email: "JOHN@EXAMPLE.COM", // uppercase
            gift_preferences: "Books",
          },
        ],
      };

      const result = await drawService.createDraw(singleParticipantCommand, mockAuthorId);

      expect(result).toBeTruthy();
      // Should not invite user since they already exist (case-insensitive check)
      expect(mockAdminClient.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("should handle empty participants array", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      const emptyParticipantsCommand = {
        name: "Empty Draw",
        participants: [],
      };

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: emptyParticipantsCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      // Mock delete for cleanup
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: mockDelete,
          };
        }
      });

      // Mock empty participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      await expect(drawService.createDraw(emptyParticipantsCommand, mockAuthorId)).rejects.toThrow(
        "Failed to create participants"
      );
    });

    it("should process participants sequentially for rate limiting", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: validCommand.participants.map((p, i) => ({
          id: `participant-${i}`,
          email: p.email,
        })),
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      // Track order of invitations
      const invitationOrder: string[] = [];

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockAdminClient.auth.admin.inviteUserByEmail.mockImplementation((email: string) => {
        invitationOrder.push(email);
        return Promise.resolve({
          data: { user: { id: `user-${email}`, email } },
          error: null,
        });
      });

      await drawService.createDraw(validCommand, mockAuthorId);

      // Verify all participants were invited in order
      expect(invitationOrder).toEqual(["john@example.com", "jane@example.com", "bob@example.com"]);
    });

    it("should include correct redirect URL in invitation", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: "participant-1",
            email: "john@example.com",
          },
        ],
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockAdminClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: "user-123", email: "john@example.com" } },
        error: null,
      });

      const singleParticipantCommand = {
        name: "Test Draw",
        participants: [validCommand.participants[0]],
      };

      await drawService.createDraw(singleParticipantCommand, mockAuthorId);

      expect(mockAdminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        "john@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/set-password"),
          data: { role: "participant" },
        })
      );
    });

    it("should continue with other participants when one auth provisioning fails", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: validCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: validCommand.participants.map((p, i) => ({
          id: `participant-${i}`,
          email: p.email,
        })),
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      // First invitation fails, others succeed
      mockAdminClient.auth.admin.inviteUserByEmail
        .mockResolvedValueOnce({
          data: { user: null },
          error: { message: "Failed to invite" },
        })
        .mockResolvedValueOnce({
          data: { user: { id: "user-2", email: "jane@example.com" } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: "user-3", email: "bob@example.com" } },
          error: null,
        });

      const result = await drawService.createDraw(validCommand, mockAuthorId);

      expect(result).toBeTruthy();
      expect(mockAdminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple participants with duplicate emails", async () => {
      const mockDrawId = "draw-456";
      const mockCreatedAt = "2025-01-01T00:00:00.000Z";

      const duplicateEmailCommand = {
        name: "Test Draw",
        participants: [
          {
            name: "John",
            surname: "Doe",
            email: "duplicate@example.com",
            gift_preferences: "Books",
          },
          {
            name: "Jane",
            surname: "Smith",
            email: "duplicate@example.com",
            gift_preferences: "Electronics",
          },
        ],
      };

      // Mock successful draw insertion
      const mockDrawInsert = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockDrawId,
            name: duplicateEmailCommand.name,
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
      });

      // Mock successful participants insertion
      const mockParticipantsSelect = vi.fn().mockResolvedValue({
        data: [
          { id: "participant-1", email: "duplicate@example.com" },
          { id: "participant-2", email: "duplicate@example.com" },
        ],
        error: null,
      });

      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "draw_participants") {
          return {
            insert: vi.fn().mockReturnValue({
              select: mockParticipantsSelect,
            }),
          };
        }
      });

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      // First invite succeeds, second finds existing user
      mockAdminClient.auth.admin.inviteUserByEmail.mockResolvedValueOnce({
        data: { user: { id: "user-1", email: "duplicate@example.com" } },
        error: null,
      });

      const result = await drawService.createDraw(duplicateEmailCommand, mockAuthorId);

      expect(result).toBeTruthy();
      // Should invite user for both participants (service doesn't deduplicate)
      expect(mockAdminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe("getDrawsByAuthor", () => {
    const mockAuthorId = "user-123";

    describe("successful queries", () => {
      it("should successfully fetch draws for an author", async () => {
        const mockDraws = [
          {
            id: "draw-1",
            name: "Christmas 2024",
            created_at: "2024-12-01T00:00:00.000Z",
          },
          {
            id: "draw-2",
            name: "Birthday Party",
            created_at: "2024-11-15T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual(mockDraws);
        expect(mockSupabase.from).toHaveBeenCalledWith("draws");
        expect(mockSelect).toHaveBeenCalledWith("id, name, created_at");
        expect(mockEq).toHaveBeenCalledWith("author_id", mockAuthorId);
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      });

      it("should return draws in descending order by created_at", async () => {
        const mockDraws = [
          {
            id: "draw-1",
            name: "Most Recent",
            created_at: "2024-12-31T23:59:59.000Z",
          },
          {
            id: "draw-2",
            name: "Middle",
            created_at: "2024-06-15T12:00:00.000Z",
          },
          {
            id: "draw-3",
            name: "Oldest",
            created_at: "2024-01-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual(mockDraws);
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });

        // Verify ordering is preserved
        expect(result[0].created_at).toBe("2024-12-31T23:59:59.000Z");
        expect(result[1].created_at).toBe("2024-06-15T12:00:00.000Z");
        expect(result[2].created_at).toBe("2024-01-01T00:00:00.000Z");
      });

      it("should successfully fetch single draw", async () => {
        const mockDraws = [
          {
            id: "draw-1",
            name: "Single Draw",
            created_at: "2024-12-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual(mockDraws);
        expect(result.length).toBe(1);
      });

      it("should handle large number of draws", async () => {
        // Simulate fetching 100 draws
        const mockDraws = Array.from({ length: 100 }, (_, i) => ({
          id: `draw-${i + 1}`,
          name: `Draw ${i + 1}`,
          created_at: new Date(2024, 0, 1, 0, i).toISOString(),
        }));

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual(mockDraws);
        expect(result.length).toBe(100);
      });

      it("should handle draws with identical timestamps", async () => {
        const sameTimestamp = "2024-12-01T12:00:00.000Z";
        const mockDraws = [
          {
            id: "draw-1",
            name: "First",
            created_at: sameTimestamp,
          },
          {
            id: "draw-2",
            name: "Second",
            created_at: sameTimestamp,
          },
          {
            id: "draw-3",
            name: "Third",
            created_at: sameTimestamp,
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual(mockDraws);
        expect(result.every((draw) => draw.created_at === sameTimestamp)).toBe(true);
      });
    });

    describe("empty result scenarios", () => {
      it("should return empty array when author has no draws", async () => {
        const mockOrder = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should return empty array when data is null", async () => {
        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("author ID edge cases", () => {
      it("should handle UUID format author IDs", async () => {
        const uuidAuthorId = "550e8400-e29b-41d4-a716-446655440000";

        const mockOrder = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(uuidAuthorId);

        expect(result).toEqual([]);
        expect(mockEq).toHaveBeenCalledWith("author_id", uuidAuthorId);
      });

      it("should handle non-existent author ID", async () => {
        const nonExistentAuthorId = "non-existent-user-999";

        const mockOrder = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(nonExistentAuthorId);

        expect(result).toEqual([]);
      });
    });

    describe("error handling", () => {
      it("should throw error when database query fails", async () => {
        const mockError = { message: "Database connection error" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getDrawsByAuthor(mockAuthorId)).rejects.toThrow("Failed to fetch draws");
      });

      it("should throw error with descriptive message on timeout", async () => {
        const mockError = { message: "Query timeout exceeded" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getDrawsByAuthor(mockAuthorId)).rejects.toThrow("Failed to fetch draws");
      });

      it("should throw error on network failure", async () => {
        const mockError = { message: "Network request failed" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getDrawsByAuthor(mockAuthorId)).rejects.toThrow("Failed to fetch draws");
      });

      it("should throw error on permission denied", async () => {
        const mockError = { message: "Permission denied", code: "42501" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getDrawsByAuthor(mockAuthorId)).rejects.toThrow("Failed to fetch draws");
      });
    });

    describe("logging behavior", () => {
      it("should log error with author ID when query fails", async () => {
        const { LoggerService } = await import("./logger.service");
        const mockError = { message: "Database error" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        try {
          await drawService.getDrawsByAuthor(mockAuthorId);
        } catch {
          // Expected to throw
        }

        expect(LoggerService.error).toHaveBeenCalledWith("Failed to fetch draws for author", {
          authorId: mockAuthorId,
          error: mockError,
        });
      });

      it("should not log on successful query", async () => {
        const { LoggerService } = await import("./logger.service");
        const mockDraws = [
          {
            id: "draw-1",
            name: "Test Draw",
            created_at: "2024-12-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await drawService.getDrawsByAuthor(mockAuthorId);

        expect(LoggerService.error).not.toHaveBeenCalled();
      });
    });

    describe("data integrity", () => {
      it("should return exact fields specified in select", async () => {
        const mockDraws = [
          {
            id: "draw-1",
            name: "Test Draw",
            created_at: "2024-12-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        // Verify only expected fields are present
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("created_at");
        expect(Object.keys(result[0])).toHaveLength(3);
      });

      it("should preserve draw names with special characters", async () => {
        const mockDraws = [
          {
            id: "draw-1",
            name: "Christmas 🎄 2024 - Family & Friends",
            created_at: "2024-12-01T00:00:00.000Z",
          },
          {
            id: "draw-2",
            name: "Тест (Test) with 中文",
            created_at: "2024-11-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result[0].name).toBe("Christmas 🎄 2024 - Family & Friends");
        expect(result[1].name).toBe("Тест (Test) with 中文");
      });

      it("should handle very long draw names", async () => {
        const longName = "A".repeat(500);
        const mockDraws = [
          {
            id: "draw-1",
            name: longName,
            created_at: "2024-12-01T00:00:00.000Z",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockDraws,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawsByAuthor(mockAuthorId);

        expect(result[0].name).toBe(longName);
        expect(result[0].name.length).toBe(500);
      });
    });
  });

  describe("drawExists", () => {
    describe("when draw exists", () => {
      it("should return true for an existing draw", async () => {
        const mockDrawId = "draw-123";

        const mockSingle = vi.fn().mockResolvedValue({
          data: { id: mockDrawId },
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.drawExists(mockDrawId);

        expect(result).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith("draws");
        expect(mockSelect).toHaveBeenCalledWith("id");
        expect(mockEq).toHaveBeenCalledWith("id", mockDrawId);
      });
    });

    describe("when draw does not exist", () => {
      it("should return false when draw is not found", async () => {
        const mockDrawId = "non-existent-draw";

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "No rows found", code: "PGRST116" },
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.drawExists(mockDrawId);

        expect(result).toBe(false);
      });

      it("should return false when data is null without error", async () => {
        const mockDrawId = "draw-123";

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.drawExists(mockDrawId);

        expect(result).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle UUID format draw IDs", async () => {
        const uuidDrawId = "550e8400-e29b-41d4-a716-446655440000";

        const mockSingle = vi.fn().mockResolvedValue({
          data: { id: uuidDrawId },
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.drawExists(uuidDrawId);

        expect(result).toBe(true);
        expect(mockEq).toHaveBeenCalledWith("id", uuidDrawId);
      });

      it("should return false on database connection error", async () => {
        const mockDrawId = "draw-123";

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Connection failed" },
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.drawExists(mockDrawId);

        expect(result).toBe(false);
      });
    });
  });

  describe("getDrawByIdForAuthor", () => {
    const mockDrawId = "draw-123";
    const mockUserId = "user-456";

    describe("successful retrieval", () => {
      it("should return draw when user is the author", async () => {
        const mockDraw = {
          id: mockDrawId,
          name: "Christmas 2024",
          created_at: "2024-12-01T00:00:00.000Z",
          author_id: mockUserId,
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockDraw,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, mockUserId);

        expect(result).toEqual({
          id: mockDraw.id,
          name: mockDraw.name,
          created_at: mockDraw.created_at,
        });
        expect(mockSupabase.from).toHaveBeenCalledWith("draws");
        expect(mockSelect).toHaveBeenCalledWith("id, name, created_at, author_id");
        expect(mockEq).toHaveBeenCalledWith("id", mockDrawId);
      });

      it("should return DTO without author_id field", async () => {
        const mockDraw = {
          id: mockDrawId,
          name: "Test Draw",
          created_at: "2024-12-01T00:00:00.000Z",
          author_id: mockUserId,
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockDraw,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, mockUserId);

        expect(result).not.toHaveProperty("author_id");
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("created_at");
      });
    });

    describe("authorization checks", () => {
      it("should return null when user is not the author", async () => {
        const differentUserId = "user-789";
        const mockDraw = {
          id: mockDrawId,
          name: "Test Draw",
          created_at: "2024-12-01T00:00:00.000Z",
          author_id: mockUserId,
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockDraw,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, differentUserId);

        expect(result).toBeNull();
      });

      it("should handle case-sensitive user ID comparison", async () => {
        const mockDraw = {
          id: mockDrawId,
          name: "Test Draw",
          created_at: "2024-12-01T00:00:00.000Z",
          author_id: "User-456", // Different case
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockDraw,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, "user-456");

        expect(result).toBeNull();
      });
    });

    describe("not found scenarios", () => {
      it("should return null when draw does not exist", async () => {
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "No rows found", code: "PGRST116" },
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, mockUserId);

        expect(result).toBeNull();
      });

      it("should return null when data is null", async () => {
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, mockUserId);

        expect(result).toBeNull();
      });

      it("should return null on database error", async () => {
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Connection failed" },
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(mockDrawId, mockUserId);

        expect(result).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("should handle UUID format IDs", async () => {
        const uuidDrawId = "550e8400-e29b-41d4-a716-446655440000";
        const uuidUserId = "660e8400-e29b-41d4-a716-446655440001";

        const mockDraw = {
          id: uuidDrawId,
          name: "Test Draw",
          created_at: "2024-12-01T00:00:00.000Z",
          author_id: uuidUserId,
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockDraw,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getDrawByIdForAuthor(uuidDrawId, uuidUserId);

        expect(result).toBeTruthy();
        expect(result?.id).toBe(uuidDrawId);
      });
    });
  });

  describe("getParticipantsByDrawId", () => {
    const mockDrawId = "draw-123";

    describe("successful queries", () => {
      it("should return participants for a draw", async () => {
        const mockParticipants = [
          {
            id: "participant-1",
            name: "John",
            surname: "Doe",
            email: "john@example.com",
            gift_preferences: "Books",
          },
          {
            id: "participant-2",
            name: "Jane",
            surname: "Smith",
            email: "jane@example.com",
            gift_preferences: "Electronics",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result).toEqual(mockParticipants);
        expect(mockSupabase.from).toHaveBeenCalledWith("draw_participants");
        expect(mockSelect).toHaveBeenCalledWith("id, name, surname, email, gift_preferences");
        expect(mockEq).toHaveBeenCalledWith("draw_id", mockDrawId);
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
      });

      it("should return participants ordered by creation time ascending", async () => {
        const mockParticipants = [
          {
            id: "participant-1",
            name: "First",
            surname: "Added",
            email: "first@example.com",
            gift_preferences: "Books",
          },
          {
            id: "participant-2",
            name: "Second",
            surname: "Added",
            email: "second@example.com",
            gift_preferences: "Games",
          },
          {
            id: "participant-3",
            name: "Third",
            surname: "Added",
            email: "third@example.com",
            gift_preferences: "Toys",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result).toEqual(mockParticipants);
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
      });

      it("should return empty array when no participants exist", async () => {
        const mockOrder = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should return empty array when data is null", async () => {
        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result).toEqual([]);
      });
    });

    describe("data integrity", () => {
      it("should handle participants with null gift preferences", async () => {
        const mockParticipants = [
          {
            id: "participant-1",
            name: "John",
            surname: "Doe",
            email: "john@example.com",
            gift_preferences: null,
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result[0].gift_preferences).toBeNull();
      });

      it("should preserve special characters in participant data", async () => {
        const mockParticipants = [
          {
            id: "participant-1",
            name: "François",
            surname: "O'Brien-Smith",
            email: "françois@example.com",
            gift_preferences: "Books & Music 🎵",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result[0].name).toBe("François");
        expect(result[0].surname).toBe("O'Brien-Smith");
        expect(result[0].email).toBe("françois@example.com");
        expect(result[0].gift_preferences).toBe("Books & Music 🎵");
      });

      it("should handle large number of participants", async () => {
        const mockParticipants = Array.from({ length: 100 }, (_, i) => ({
          id: `participant-${i + 1}`,
          name: `Name${i + 1}`,
          surname: `Surname${i + 1}`,
          email: `user${i + 1}@example.com`,
          gift_preferences: `Preference ${i + 1}`,
        }));

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(mockDrawId);

        expect(result).toEqual(mockParticipants);
        expect(result.length).toBe(100);
      });
    });

    describe("error handling", () => {
      it("should throw error when database query fails", async () => {
        const mockError = { message: "Database connection error" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getParticipantsByDrawId(mockDrawId)).rejects.toThrow("Failed to fetch participants");
      });

      it("should throw error on permission denied", async () => {
        const mockError = { message: "Permission denied", code: "42501" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        await expect(drawService.getParticipantsByDrawId(mockDrawId)).rejects.toThrow("Failed to fetch participants");
      });
    });

    describe("logging behavior", () => {
      it("should log error with draw ID when query fails", async () => {
        const { LoggerService } = await import("./logger.service");
        const mockError = { message: "Database error" };

        const mockOrder = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        try {
          await drawService.getParticipantsByDrawId(mockDrawId);
        } catch {
          // Expected to throw
        }

        expect(LoggerService.error).toHaveBeenCalledWith("Failed to fetch participants", {
          drawId: mockDrawId,
          error: mockError,
        });
      });

      it("should not log on successful query", async () => {
        const { LoggerService } = await import("./logger.service");
        const mockParticipants = [
          {
            id: "participant-1",
            name: "Test",
            surname: "User",
            email: "test@example.com",
            gift_preferences: "Books",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        // Clear any previous calls
        vi.clearAllMocks();

        await drawService.getParticipantsByDrawId(mockDrawId);

        expect(LoggerService.error).not.toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("should handle UUID format draw ID", async () => {
        const uuidDrawId = "550e8400-e29b-41d4-a716-446655440000";
        const mockParticipants = [
          {
            id: "participant-1",
            name: "Test",
            surname: "User",
            email: "test@example.com",
            gift_preferences: "Books",
          },
        ];

        const mockOrder = vi.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(uuidDrawId);

        expect(result).toEqual(mockParticipants);
        expect(mockEq).toHaveBeenCalledWith("draw_id", uuidDrawId);
      });

      it("should handle non-existent draw ID gracefully", async () => {
        const nonExistentDrawId = "non-existent-draw-999";

        const mockOrder = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from.mockReturnValue({
          select: mockSelect,
        });

        const result = await drawService.getParticipantsByDrawId(nonExistentDrawId);

        expect(result).toEqual([]);
      });
    });
  });
});
