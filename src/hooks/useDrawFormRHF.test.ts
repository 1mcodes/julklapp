import { renderHook, act } from "@testing-library/react";
import { useDrawFormRHF } from "./useDrawFormRHF";

describe("useDrawFormRHF", () => {
  it("should initialize with 3 participants", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    expect(result.current.fields).toHaveLength(3);
    expect(result.current.constraints.currentParticipants).toBe(3);
    expect(result.current.constraints.minParticipants).toBe(3);
    expect(result.current.constraints.maxParticipants).toBe(32);
  });

  it("should add participant when under max limit", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    act(() => {
      result.current.actions.addParticipant();
    });

    expect(result.current.fields).toHaveLength(4);
    expect(result.current.constraints.canAddParticipant).toBe(true);
  });

  it("should not add participant when at max limit", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    // Add participants until max
    for (let i = 0; i < 29; i++) {
      act(() => {
        result.current.actions.addParticipant();
      });
    }

    expect(result.current.fields).toHaveLength(32);
    expect(result.current.constraints.canAddParticipant).toBe(false);

    // Try to add one more
    act(() => {
      result.current.actions.addParticipant();
    });

    expect(result.current.fields).toHaveLength(32); // Should not change
  });

  it("should remove participant when above min limit", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    act(() => {
      result.current.actions.addParticipant(); // Now 4 participants
    });

    act(() => {
      result.current.actions.removeParticipant(0); // Remove first
    });

    expect(result.current.fields).toHaveLength(3);
    expect(result.current.constraints.canRemoveParticipant).toBe(false); // At min now
  });

  it("should not remove participant when at min limit", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    act(() => {
      result.current.actions.removeParticipant(0);
    });

    expect(result.current.fields).toHaveLength(3); // Should not change
    expect(result.current.constraints.canRemoveParticipant).toBe(false);
  });

  it("should provide form instance with proper structure", () => {
    const { result } = renderHook(() => useDrawFormRHF());

    expect(result.current.form).toBeDefined();
    expect(result.current.form.getValues()).toHaveProperty("name");
    expect(result.current.form.getValues()).toHaveProperty("participants");
    expect(result.current.form.getValues().participants).toHaveLength(3);
  });
});
