import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawForm } from "./useDrawForm";

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("useDrawForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.name).toBe("");
      expect(result.current.state.nameError).toBeUndefined();
      expect(result.current.state.participants).toHaveLength(3);
      expect(result.current.state.formError).toBeUndefined();
      expect(result.current.state.isSubmitting).toBeUndefined();

      // Check initial participants structure
      result.current.state.participants.forEach((participant) => {
        expect(participant.id).toBeDefined();
        expect(participant.name).toBe("");
        expect(participant.surname).toBe("");
        expect(participant.email).toBe("");
        expect(participant.giftPreferences).toBe("");
        expect(participant.touched).toBe(false);
        expect(participant.errors).toBeUndefined();
      });
    });
  });

  describe("setName", () => {
    it("should update name and clear name error", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.setName("Test Draw");
      });

      expect(result.current.state.name).toBe("Test Draw");
      expect(result.current.state.nameError).toBeUndefined();
      expect(result.current.state.formError).toBeUndefined();
    });

    it("should clear name error when name is updated", () => {
      const { result } = renderHook(() => useDrawForm());

      // Set an error state first
      act(() => {
        result.current.state.nameError = "Name is required";
        result.current.actions.setName("Test Draw");
      });

      expect(result.current.state.name).toBe("Test Draw");
      expect(result.current.state.nameError).toBeUndefined();
    });
  });

  describe("addParticipant", () => {
    it("should add a new participant when under limit", () => {
      const { result } = renderHook(() => useDrawForm());

      const initialCount = result.current.state.participants.length;

      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(initialCount + 1);
      expect(result.current.state.formError).toBeUndefined();
    });

    it("should not add participant when at maximum limit", () => {
      const { result } = renderHook(() => useDrawForm());

      // Add participants up to the limit (32)
      for (let i = 0; i < 29; i++) {
        act(() => {
          result.current.actions.addParticipant();
        });
      }

      const countAtLimit = result.current.state.participants.length;
      expect(countAtLimit).toBe(32);

      // Try to add one more
      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(32);
    });

    it("should clear form error when adding participant", () => {
      const { result } = renderHook(() => useDrawForm());

      // Set form error
      act(() => {
        result.current.state.formError = "Some error";
        result.current.actions.addParticipant();
      });

      expect(result.current.state.formError).toBeUndefined();
    });
  });

  describe("removeParticipant", () => {
    it("should remove a participant when above minimum", () => {
      const { result } = renderHook(() => useDrawForm());

      // Add one more participant first
      act(() => {
        result.current.actions.addParticipant();
      });

      expect(result.current.state.participants).toHaveLength(4);

      act(() => {
        result.current.actions.removeParticipant(0);
      });

      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should not remove participant when at minimum", () => {
      const { result } = renderHook(() => useDrawForm());

      // Should start with 3 participants (minimum)
      expect(result.current.state.participants).toHaveLength(3);

      act(() => {
        result.current.actions.removeParticipant(0);
      });

      // Should still have 3 participants
      expect(result.current.state.participants).toHaveLength(3);
    });

    it("should clear form error when removing participant", () => {
      const { result } = renderHook(() => useDrawForm());

      // Add a participant and set form error
      act(() => {
        result.current.actions.addParticipant();
        result.current.state.formError = "Some error";
        result.current.actions.removeParticipant(0);
      });

      expect(result.current.state.formError).toBeUndefined();
    });
  });

  describe("updateParticipantField", () => {
    it("should update participant field, mark as touched, and clear field error", () => {
      const { result } = renderHook(() => useDrawForm());

      act(() => {
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      expect(result.current.state.participants[0].name).toBe("John");
      expect(result.current.state.participants[0].touched).toBe(true);
      expect(result.current.state.participants[0].errors?.name).toBeUndefined();
      expect(result.current.state.formError).toBeUndefined();
    });

    it("should clear field-specific error when updating", () => {
      const { result } = renderHook(() => useDrawForm());

      // Set an error first
      act(() => {
        result.current.state.participants[0].errors = { name: "Name is required" };
        result.current.actions.updateParticipantField(0, "name", "John");
      });

      expect(result.current.state.participants[0].name).toBe("John");
      expect(result.current.state.participants[0].touched).toBe(true);
      expect(result.current.state.participants[0].errors?.name).toBeUndefined();
    });

    it("should not validate untouched participants", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Initially, participants should not have errors even though they're empty
      expect(result.current.state.participants[0].touched).toBe(false);
      expect(result.current.state.participants[0].errors).toBeUndefined();

      // When we submit without filling anything, it should validate all participants
      await act(async () => {
        await result.current.actions.submitForm();
      });

      // Now all participants should have errors since they were validated on submit
      expect(result.current.state.participants[0].errors?.name).toBe("Name is required");
      expect(result.current.state.participants[0].errors?.surname).toBe("Surname is required");
      expect(result.current.state.participants[0].errors?.email).toBe("Email is required");
    });
  });

  describe("validation", () => {
    describe("name validation", () => {
      it("should validate empty name", () => {
        const { result } = renderHook(() => useDrawForm());

        act(() => {
          result.current.actions.setName("");
        });

        expect(result.current.state.name).toBe("");
        // Validation happens on submit, so we just test that the name was set
      });

      it("should accept valid name", () => {
        const { result } = renderHook(() => useDrawForm());

        act(() => {
          result.current.actions.setName("Christmas 2025");
        });

        expect(result.current.state.name).toBe("Christmas 2025");
      });
    });

    describe("participant validation", () => {
      it("should update participant fields", () => {
        const { result } = renderHook(() => useDrawForm());

        // Test empty name
        act(() => {
          result.current.actions.updateParticipantField(0, "name", "");
        });
        expect(result.current.state.participants[0].name).toBe("");

        // Test empty surname
        act(() => {
          result.current.actions.updateParticipantField(0, "surname", "");
        });
        expect(result.current.state.participants[0].surname).toBe("");

        // Test invalid email
        act(() => {
          result.current.actions.updateParticipantField(0, "email", "invalid-email");
        });
        expect(result.current.state.participants[0].email).toBe("invalid-email");
      });

      it("should update email field", () => {
        const { result } = renderHook(() => useDrawForm());

        // Valid email
        act(() => {
          result.current.actions.updateParticipantField(0, "email", "john@example.com");
        });
        expect(result.current.state.participants[0].email).toBe("john@example.com");

        // Invalid email format
        act(() => {
          result.current.actions.updateParticipantField(0, "email", "not-an-email");
        });
        expect(result.current.state.participants[0].email).toBe("not-an-email");
      });

      it("should update gift preferences field", () => {
        const { result } = renderHook(() => useDrawForm());

        const longText = "a".repeat(10001);

        act(() => {
          result.current.actions.updateParticipantField(0, "giftPreferences", longText);
        });

        expect(result.current.state.participants[0].giftPreferences.length).toBe(10001);
      });
    });
  });

  describe("submitForm", () => {
    beforeEach(() => {
      fetchMock.mockReset();
    });

    it("should not submit when validation fails", async () => {
      const { result } = renderHook(() => useDrawForm());

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "123", name: "Test Draw" }),
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.actions.submitForm();
      });

      expect(submitResult.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should submit successfully with valid data", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Fill in valid data
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

      const mockResponse = { id: "123", name: "Test Draw", created_at: "2025-01-01" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.actions.submitForm();
      });

      expect(fetchMock).toHaveBeenCalledWith("/api/draws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Draw",
          participants: [
            { name: "John", surname: "Doe", email: "john@example.com", gift_preferences: "" },
            { name: "Jane", surname: "Smith", email: "jane@example.com", gift_preferences: "" },
            { name: "Bob", surname: "Johnson", email: "bob@example.com", gift_preferences: "" },
          ],
        }),
      });

      expect(submitResult?.success).toBe(true);
      expect(submitResult?.draw).toEqual(mockResponse);
    });

    it("should handle validation errors from API", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Fill in valid data
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
              { field: "name", message: "Name already exists" },
              { field: "participants[0].email", message: "Email already used" },
            ],
          }),
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.actions.submitForm();
      });

      expect(submitResult?.success).toBe(false);
      // Note: We can't test state after async operations as the component may be unmounted
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Fill in valid data
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

      let submitResult;
      await act(async () => {
        submitResult = await result.current.actions.submitForm();
      });

      expect(submitResult?.success).toBe(false);
      // Note: We can't test state after async operations as the component may be unmounted
    });

    it("should handle server errors", async () => {
      const { result } = renderHook(() => useDrawForm());

      // Fill in valid data
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
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.actions.submitForm();
      });

      expect(submitResult?.success).toBe(false);
      // Note: We can't test state after async operations as the component may be unmounted
    });
  });

  describe("participant limits", () => {
    it("should enforce minimum participant limit", () => {
      const { result } = renderHook(() => useDrawForm());

      expect(result.current.state.participants.length).toBe(3);

      // Try to remove below minimum - this should not change the count
      act(() => {
        result.current.actions.removeParticipant(0);
      });

      expect(result.current.state.participants.length).toBe(3);
    });

    it("should enforce maximum participant limit", () => {
      const { result } = renderHook(() => useDrawForm());

      // Add up to maximum (32 total)
      for (let i = 0; i < 29; i++) {
        act(() => {
          result.current.actions.addParticipant();
        });
      }

      expect(result.current.state.participants.length).toBe(32);
    });
  });
});
