import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawForm } from "./useDrawForm";
import type { DrawDTO } from "../types";

// Mock crypto.randomUUID for consistent testing
const mockUUID = vi.fn();
vi.stubGlobal("crypto", {
  randomUUID: mockUUID,
});

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock as typeof fetch;

describe("useDrawForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let uuidCounter = 0;
    mockUUID.mockImplementation(() => `uuid-${uuidCounter++}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty draw name", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.name).toBe("");
    });

    it("should initialize with exactly 3 empty participants (minimum required)", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should initialize participants with correct structure", () => {
      const { result } = renderHook(() => useDrawForm());

      result.current.state.participants.forEach((participant, index) => {
        expect(participant.id).toBe(`uuid-${index}`);
        expect(participant.name).toBe("");
        expect(participant.surname).toBe("");
        expect(participant.email).toBe("");
        expect(participant.giftPreferences).toBe("");
        expect(participant.touched).toBe(false);
        expect(participant.errors).toBeUndefined();
      });
    });

    it("should initialize without any errors", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.nameError).toBeUndefined();
      expect(result.current.state.formError).toBeUndefined();
      expect(result.current.state.isSubmitting).toBeUndefined();
    });

    it("should generate unique IDs for each participant", () => {
      const { result } = renderHook(() => useDrawForm());

      const ids = result.current.state.participants.map((p) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("setName Action", () => {
    it("should update draw name", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Christmas 2026");
      });

      expect(result.current.state.name).toBe("Christmas 2026");
    });

    it("should clear name error when name is changed", () => {
      const { result } = renderHook(() => useDrawForm());

      // First, trigger validation to set an error
      act(() => {
        result.current.actions.submitForm();
      });

      // Name error should exist
      expect(result.current.state.nameError).toBeDefined();

      // Clear it by setting a name
      act(() => {
        result.current.actions.setName("New Name");
      });

      expect(result.current.state.nameError).toBeUndefined();
    });

    it("should clear form error when name is changed", () => {
      const { result } = renderHook(() => useDrawForm());

      // Manually set form error (simulating a previous error state)
      act(() => {
        result.current.state.formError = "Previous error";
        result.current.actions.setName("New Name");
      });

      expect(result.current.state.formError).toBeUndefined();
    });

    it("should handle empty string", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test");
        result.current.actions.setName("");
      });

      expect(result.current.state.name).toBe("");
    });

    it("should handle special characters", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Julklapp 2026! 🎄");
      });

      expect(result.current.state.name).toBe("Julklapp 2026! 🎄");
    });
  });

  describe("addParticipant Action", () => {
    it("should add participant when under maximum limit", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(4);
    });

    it("should create new participant with unique ID", () => {
      const { result } = renderHook(() => useDrawForm());

      const initialIds = result.current.state.participants.map((p) => p.id);

      act(() => {
        result.current.actions.addParticipant();
      });

      const newParticipant = result.current.state.participants[3];
      expect(initialIds).not.toContain(newParticipant.id);
      expect(newParticipant.id).toBe("uuid-3");
    });

    it("should create new participant with empty fields", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant();
      });

      const newParticipant = result.current.state.participants[3];
      expect(newParticipant.name).toBe("");
      expect(newParticipant.surname).toBe("");
      expect(newParticipant.email).toBe("");
      expect(newParticipant.giftPreferences).toBe("");
      expect(newParticipant.touched).toBe(false);
      expect(newParticipant.errors).toBeUndefined();
    });

    it("should not add participant at maximum limit (32)", () => {
      const { result } = renderHook(() => useDrawForm());

      // Add 29 more participants to reach 32 total
      act(() => {
        for (let i = 0; i < 29; i++) {
          result.current.actions.addParticipant();
        }
      });

      expect(result.current.state.participants).toHaveLength(32);

      // Try to add one more
      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(32);
    });

    it("should clear form error when adding participant", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.state.formError = "Some error";
        result.current.actions.addParticipant();
      });

      expect(result.current.state.formError).toBeUndefined();
    });

    it("should maintain existing participants data when adding new one", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants[0].name).toBe("John");
      expect(result.current.state.participants[0].email).toBe("john@example.com");
    });
  });

  describe("removeParticipant Action", () => {
    it("should remove participant when above minimum", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant(); // Now we have 4
        result.current.actions.removeParticipant(0);
      });

      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should not remove participant at minimum limit (3)", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.removeParticipant(0);
      });

      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should remove correct participant by index", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.addParticipant();
        result.current.actions.updateParticipantField(3, "name", "Alice");
      });

      const aliceId = result.current.state.participants[3].id;

      act(() => {
        result.current.actions.removeParticipant(1); // Remove Jane
      });

      const names = result.current.state.participants.map((p) => p.name);
      expect(names).toEqual(["John", "Bob", "Alice"]);
      expect(result.current.state.participants[2].id).toBe(aliceId);
    });

    it("should clear form error when removing participant", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant(); // Add 4th participant
        result.current.state.formError = "Some error";
        result.current.actions.removeParticipant(3);
      });

      expect(result.current.state.formError).toBeUndefined();
    });

    it("should handle removing last participant in list", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant(); // Now we have 4
        result.current.actions.removeParticipant(3);
      });

      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should handle invalid index gracefully", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant(); // Now we have 4
        result.current.actions.removeParticipant(10); // Invalid index
      });

      expect(result.current.state.participants).toHaveLength(4);
    });
  });

  describe("updateParticipantField Action", () => {
    it("should update participant name field", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      expect(result.current.state.participants[0].name).toBe("John");
    });

    it("should update participant surname field", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "surname", "Doe");
      });

      expect(result.current.state.participants[0].surname).toBe("Doe");
    });

    it("should update participant email field", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
      });

      expect(result.current.state.participants[0].email).toBe("john@example.com");
    });

    it("should update participant giftPreferences field", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "giftPreferences", "Books and coffee");
      });

      expect(result.current.state.participants[0].giftPreferences).toBe("Books and coffee");
    });

    it("should mark participant as touched when field is updated", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.participants[0].touched).toBe(false);

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      expect(result.current.state.participants[0].touched).toBe(true);
    });

    it("should clear specific field error when field is updated", () => {
      const { result } = renderHook(() => useDrawForm());

      // First submit to trigger validation
      act(() => {
        result.current.actions.submitForm();
      });

      // Should have name error
      expect(result.current.state.participants[0].errors?.name).toBeDefined();

      // Update name field
      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      // Name error should be cleared
      expect(result.current.state.participants[0].errors?.name).toBeUndefined();
    });

    it("should preserve other field errors when updating one field", () => {
      const { result } = renderHook(() => useDrawForm());

      // Submit to trigger validation
      act(() => {
        result.current.actions.submitForm();
      });

      // Should have multiple errors
      expect(result.current.state.participants[0].errors?.name).toBeDefined();
      expect(result.current.state.participants[0].errors?.surname).toBeDefined();
      expect(result.current.state.participants[0].errors?.email).toBeDefined();

      // Update only name
      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      // Name error cleared, others remain
      expect(result.current.state.participants[0].errors?.name).toBeUndefined();
      expect(result.current.state.participants[0].errors?.surname).toBeDefined();
      expect(result.current.state.participants[0].errors?.email).toBeDefined();
    });

    it("should clear form error when updating participant field", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.state.formError = "Some error";
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      expect(result.current.state.formError).toBeUndefined();
    });

    it("should not affect other participants when updating one", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(2, "name", "Bob");
      });

      // Update participant 1
      act(() => {
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
      });

      expect(result.current.state.participants[0].name).toBe("John");
      expect(result.current.state.participants[1].email).toBe("jane@example.com");
      expect(result.current.state.participants[2].name).toBe("Bob");
    });
  });

  describe("Validation - Name Field", () => {
    it("should validate empty name on submit", async () => {
      const { result } = renderHook(() => useDrawForm());

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.nameError).toBe("Name is required");
    });

    it("should validate name with only whitespace", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("   ");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.nameError).toBe("Name is required");
    });

    it("should accept valid name", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Christmas 2026");
        // Fill participants
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Christmas 2026" }),
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.nameError).toBeUndefined();
    });
  });

  describe("Validation - Participant Fields", () => {
    it("should not validate untouched participants", () => {
      const { result } = renderHook(() => useDrawForm());

      // Participants are empty and untouched
      expect(result.current.state.participants[0].errors).toBeUndefined();
      expect(result.current.state.participants[1].errors).toBeUndefined();
      expect(result.current.state.participants[2].errors).toBeUndefined();
    });

    it("should validate all participants on submit regardless of touched state", async () => {
      const { result } = renderHook(() => useDrawForm());

      await act(async () => {
        await result.current.actions.submitForm();
      });

      // All participants should now have errors
      expect(result.current.state.participants[0].errors?.name).toBe("Name is required");
      expect(result.current.state.participants[0].errors?.surname).toBe("Surname is required");
      expect(result.current.state.participants[0].errors?.email).toBe("Email is required");

      expect(result.current.state.participants[1].errors?.name).toBe("Name is required");
      expect(result.current.state.participants[2].errors?.name).toBe("Name is required");
    });

    it("should validate empty name field", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.name).toBe("Name is required");
    });

    it("should validate empty surname field", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "surname", "");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.surname).toBe("Surname is required");
    });

    it("should validate empty email field", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "email", "");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.email).toBe("Email is required");
    });

    it("should validate invalid email format", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "invalid-email");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.email).toBe("Please enter a valid email address");
    });

    it("should accept valid email formats", async () => {
      const { result } = renderHook(() => useDrawForm());

      const validEmails = [
        "user@example.com",
        "first.last@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      for (const email of validEmails) {
        act(() => {
          result.current.actions.updateParticipantField(0, "email", email);
        });

        await act(async () => {
          await result.current.actions.submitForm();
        });

        // Should not have email validation error (may have other errors)
        expect(result.current.state.participants[0].errors?.email).toBeUndefined();
      }
    });

    it("should reject invalid email formats", async () => {
      const { result } = renderHook(() => useDrawForm());

      const invalidEmails = ["no-at-sign", "@no-local-part.com", "no-domain@", "spaces in@email.com", "missing@domain"];

      for (const email of invalidEmails) {
        act(() => {
          result.current.actions.updateParticipantField(0, "name", "John");
          result.current.actions.updateParticipantField(0, "surname", "Doe");
          result.current.actions.updateParticipantField(0, "email", email);
        });

        await act(async () => {
          await result.current.actions.submitForm();
        });

        expect(result.current.state.participants[0].errors?.email).toBe("Please enter a valid email address");
      }
    });

    it("should not require giftPreferences field", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", "");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Test Draw" }),
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.giftPreferences).toBeUndefined();
    });

    it("should validate giftPreferences maxLength (10000 characters)", async () => {
      const { result } = renderHook(() => useDrawForm());

      const tooLongText = "a".repeat(10001);

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", tooLongText);
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.giftPreferences).toBe(
        "GiftPreferences must be no more than 10000 characters"
      );
    });

    it("should accept giftPreferences at maxLength (10000 characters)", async () => {
      const { result } = renderHook(() => useDrawForm());

      const maxLengthText = "a".repeat(10000);

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", maxLengthText);
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Test Draw" }),
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.participants[0].errors?.giftPreferences).toBeUndefined();
    });
  });

  describe("submitForm Action", () => {
    beforeEach(() => {
      fetchMock.mockReset();
    });

    it("should not submit when name validation fails", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Fill valid participants but no name
      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should not submit when participant validation fails", async () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        // Leave participants empty
      });

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should submit successfully with valid data", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", "Books");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      const mockDrawResponse: DrawDTO = {
        id: "draw-123",
        name: "Test Draw",
        created_at: "2026-01-02T00:00:00Z",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDrawResponse),
      } as Response);

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.draw).toEqual(mockDrawResponse);
      expect(fetchMock).toHaveBeenCalledWith("/api/draws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Draw",
          participants: [
            { name: "John", surname: "Doe", email: "john@example.com", gift_preferences: "Books" },
            { name: "Jane", surname: "Smith", email: "jane@example.com", gift_preferences: "" },
            { name: "Bob", surname: "Johnson", email: "bob@example.com", gift_preferences: "" },
          ],
        }),
      });

      unmount();
    });

    it("should handle 400 validation errors from API", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            details: [
              { field: "name", message: "Draw name already exists" },
              { field: "participants[0].email", message: "Email already in use" },
              { field: "participants[2].email", message: "Email already in use" },
            ],
          }),
      } as Response);

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.errors).toBeDefined();

      // Check that field errors were mapped
      expect(result.current.state.nameError).toBe("Draw name already exists");
      expect(result.current.state.participants[0].errors?.email).toBe("Email already in use");
      expect(result.current.state.participants[2].errors?.email).toBe("Email already in use");

      unmount();
    });

    it("should handle 400 non-validation errors from API", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: "Invalid request format",
          }),
      } as Response);

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(result.current.state.formError).toBe("Invalid request format");

      unmount();
    });

    it("should handle 500 server errors", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Internal server error" }),
      } as Response);

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(result.current.state.formError).toBe("Internal server error");

      unmount();
    });

    it("should handle network errors", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(result.current.state.formError).toBe("Network error. Please check your connection and try again.");

      unmount();
    });

    it("should clear formError when starting submission", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
        // Set a previous error
        result.current.state.formError = "Previous error";
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Test Draw" }),
      } as Response);

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.formError).toBeUndefined();

      unmount();
    });

    it("should set isSubmitting to false after error", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.isSubmitting).toBe(false);

      unmount();
    });
  });

  describe("Business Rules - Participant Limits", () => {
    it("should enforce minimum of 3 participants", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // Start with 3
      expect(result.current.state.participants).toHaveLength(3);

      // Try to remove
      act(() => {
        result.current.actions.removeParticipant(0);
        result.current.actions.removeParticipant(1);
        result.current.actions.removeParticipant(2);
      });

      // Should still have 3
      expect(result.current.state.participants).toHaveLength(3);

      unmount();
    });

    it("should enforce maximum of 32 participants", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // Add up to 32
      act(() => {
        for (let i = 0; i < 29; i++) {
          result.current.actions.addParticipant();
        }
      });

      expect(result.current.state.participants).toHaveLength(32);

      // Try to add more
      act(() => {
        result.current.actions.addParticipant();
        result.current.actions.addParticipant();
        result.current.actions.addParticipant();
      });

      // Should still have 32
      expect(result.current.state.participants).toHaveLength(32);

      unmount();
    });

    it("should allow removing and re-adding participants within limits", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // Add participants
      act(() => {
        result.current.actions.addParticipant();
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(5);

      // Remove some
      act(() => {
        result.current.actions.removeParticipant(4);
        result.current.actions.removeParticipant(3);
      });

      expect(result.current.state.participants).toHaveLength(3);

      // Add again
      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(4);

      unmount();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive state updates", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Name 1");
        result.current.actions.setName("Name 2");
        result.current.actions.setName("Name 3");
        result.current.actions.setName("Final Name");
      });

      expect(result.current.state.name).toBe("Final Name");

      unmount();
    });

    it("should handle updating multiple fields on same participant", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", "Books");
      });

      const participant = result.current.state.participants[0];
      expect(participant.name).toBe("John");
      expect(participant.surname).toBe("Doe");
      expect(participant.email).toBe("john@example.com");
      expect(participant.giftPreferences).toBe("Books");

      unmount();
    });

    it("should handle special characters in all fields", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Julklapp 2026! 🎄 <script>");
        result.current.actions.updateParticipantField(0, "name", "O'Brien");
        result.current.actions.updateParticipantField(0, "surname", "Müller-Schmidt");
        result.current.actions.updateParticipantField(0, "email", "test+tag@example.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", "I'd like: books & coffee ☕");
      });

      expect(result.current.state.name).toBe("Julklapp 2026! 🎄 <script>");
      expect(result.current.state.participants[0].name).toBe("O'Brien");
      expect(result.current.state.participants[0].surname).toBe("Müller-Schmidt");
      expect(result.current.state.participants[0].email).toBe("test+tag@example.com");
      expect(result.current.state.participants[0].giftPreferences).toBe("I'd like: books & coffee ☕");

      unmount();
    });

    it("should handle whitespace in required fields correctly", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("   ");
        result.current.actions.updateParticipantField(0, "name", "  ");
        result.current.actions.updateParticipantField(0, "surname", "\t");
        result.current.actions.updateParticipantField(0, "email", "  ");
      });

      await act(async () => {
        await result.current.actions.submitForm();
      });

      // Whitespace-only values should be treated as empty
      expect(result.current.state.nameError).toBe("Name is required");
      expect(result.current.state.participants[0].errors?.name).toBe("Name is required");
      expect(result.current.state.participants[0].errors?.surname).toBe("Surname is required");
      expect(result.current.state.participants[0].errors?.email).toBe("Email is required");

      unmount();
    });

    it("should maintain participant order when removing from middle", () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.addParticipant();
        result.current.actions.addParticipant();
        result.current.actions.updateParticipantField(0, "name", "First");
        result.current.actions.updateParticipantField(1, "name", "Second");
        result.current.actions.updateParticipantField(2, "name", "Third");
        result.current.actions.updateParticipantField(3, "name", "Fourth");
        result.current.actions.updateParticipantField(4, "name", "Fifth");
      });

      act(() => {
        result.current.actions.removeParticipant(2); // Remove "Third"
      });

      const names = result.current.state.participants.map((p) => p.name);
      expect(names).toEqual(["First", "Second", "Fourth", "Fifth"]);

      unmount();
    });

    it("should preserve errors across add/remove operations", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // Submit to generate errors
      await act(async () => {
        await result.current.actions.submitForm();
      });

      // Should have errors
      expect(result.current.state.participants[0].errors).toBeDefined();

      // Add a participant - this should clear form error but preserve participant errors
      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants[0].errors).toBeDefined();

      unmount();
    });

    it("should handle empty submission returning specific error messages", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(result.current.state.nameError).toBe("Name is required");
      result.current.state.participants.forEach((participant) => {
        expect(participant.errors?.name).toBe("Name is required");
        expect(participant.errors?.surname).toBe("Surname is required");
        expect(participant.errors?.email).toBe("Email is required");
      });

      unmount();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete user flow: create, fill, submit", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // User fills in draw name
      act(() => {
        result.current.actions.setName("Company Christmas 2026");
      });

      // User fills in first three participants
      act(() => {
        result.current.actions.updateParticipantField(0, "name", "Alice");
        result.current.actions.updateParticipantField(0, "surname", "Anderson");
        result.current.actions.updateParticipantField(0, "email", "alice@company.com");
        result.current.actions.updateParticipantField(0, "giftPreferences", "Books, plants");

        result.current.actions.updateParticipantField(1, "name", "Bob");
        result.current.actions.updateParticipantField(1, "surname", "Brown");
        result.current.actions.updateParticipantField(1, "email", "bob@company.com");

        result.current.actions.updateParticipantField(2, "name", "Charlie");
        result.current.actions.updateParticipantField(2, "surname", "Chen");
        result.current.actions.updateParticipantField(2, "email", "charlie@company.com");
        result.current.actions.updateParticipantField(2, "giftPreferences", "Coffee, gadgets");
      });

      // User adds two more participants
      act(() => {
        result.current.actions.addParticipant();
        result.current.actions.addParticipant();
      });

      // User fills them in
      act(() => {
        result.current.actions.updateParticipantField(3, "name", "Diana");
        result.current.actions.updateParticipantField(3, "surname", "Davis");
        result.current.actions.updateParticipantField(3, "email", "diana@company.com");

        result.current.actions.updateParticipantField(4, "name", "Eve");
        result.current.actions.updateParticipantField(4, "surname", "Evans");
        result.current.actions.updateParticipantField(4, "email", "eve@company.com");
      });

      // User accidentally removes wrong participant
      act(() => {
        result.current.actions.removeParticipant(3);
      });

      expect(result.current.state.participants).toHaveLength(4);

      // Mock successful API response
      const mockResponse: DrawDTO = {
        id: "draw-123",
        name: "Company Christmas 2026",
        created_at: "2026-01-02T00:00:00Z",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Submit
      const result$ = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(result$.success).toBe(true);
      expect(result$.draw).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledOnce();

      unmount();
    });

    it("should handle user flow with validation errors and corrections", async () => {
      const { result, unmount } = renderHook(() => useDrawForm());

      // User tries to submit empty form
      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(result.current.state.nameError).toBeDefined();
      expect(result.current.state.participants[0].errors).toBeDefined();

      // User corrects name
      act(() => {
        result.current.actions.setName("Test Draw");
      });

      expect(result.current.state.nameError).toBeUndefined();

      // User fills participants with invalid email
      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
        result.current.actions.updateParticipantField(0, "surname", "Doe");
        result.current.actions.updateParticipantField(0, "email", "invalid");
        result.current.actions.updateParticipantField(1, "name", "Jane");
        result.current.actions.updateParticipantField(1, "surname", "Smith");
        result.current.actions.updateParticipantField(1, "email", "jane@example.com");
        result.current.actions.updateParticipantField(2, "name", "Bob");
        result.current.actions.updateParticipantField(2, "surname", "Johnson");
        result.current.actions.updateParticipantField(2, "email", "bob@example.com");
      });

      // Submit again
      await act(async () => {
        await result.current.actions.submitForm();
      });

      // Should have email error
      expect(result.current.state.participants[0].errors?.email).toBeDefined();

      // User corrects email
      act(() => {
        result.current.actions.updateParticipantField(0, "email", "john@example.com");
      });

      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Test Draw" }),
      } as Response);

      // Submit final
      const submitResult = await act(async () => {
        return await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(true);

      unmount();
    });
  });
});
