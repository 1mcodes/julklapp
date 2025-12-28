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

    // Mock the delay function to be instantaneous for faster tests
    vi.spyOn(drawService as any, "delay").mockResolvedValue(undefined);
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

      // Mock successful participants insertion
      const mockParticipantsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
          };
        }
        if (table === "draw_participants") {
          return {
            insert: mockParticipantsInsert,
          };
        }
      });

      const result = await drawService.createDraw(validCommand, mockAuthorId);

      expect(result).toEqual({
        id: mockDrawId,
        name: validCommand.name,
        created_at: mockCreatedAt,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("draws");
      expect(mockSupabase.from).toHaveBeenCalledWith("draw_participants");
      expect(mockParticipantsInsert).toHaveBeenCalledWith(
        validCommand.participants.map((p) => ({
          draw_id: mockDrawId,
          name: p.name,
          surname: p.surname,
          email: p.email,
          gift_preferences: p.gift_preferences,
        }))
      );
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

    it("should retry up to 10 times on participant insertion failure", async () => {
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

      // Mock participants insertion that fails 9 times, then succeeds
      let attemptCount = 0;
      const mockParticipantsInsert = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 10) {
          return Promise.resolve({
            data: null,
            error: { message: "Temporary error" },
          });
        }
        return Promise.resolve({
          data: null,
          error: null,
        });
      });

      // Mock delete for cleanup (not needed in this case)
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "draws") {
          return {
            insert: vi.fn().mockReturnValue(mockDrawInsert),
            delete: mockDelete,
          };
        }
        if (table === "draw_participants") {
          return {
            insert: mockParticipantsInsert,
          };
        }
      });

      const result = await drawService.createDraw(validCommand, mockAuthorId);

      expect(result).toEqual({
        id: mockDrawId,
        name: validCommand.name,
        created_at: mockCreatedAt,
      });
      expect(attemptCount).toBe(10);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("should cleanup and throw error after 10 failed participant insertion attempts", async () => {
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

      // Mock participants insertion that always fails
      const mockParticipantsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Persistent error" },
      });

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
        if (table === "draw_participants") {
          return {
            insert: mockParticipantsInsert,
          };
        }
      });

      await expect(drawService.createDraw(validCommand, mockAuthorId)).rejects.toThrow(
        "Failed to create participants after 10 attempts"
      );

      expect(mockParticipantsInsert).toHaveBeenCalledTimes(10);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", mockDrawId);
    });
  });
});
