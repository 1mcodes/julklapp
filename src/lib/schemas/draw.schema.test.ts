import { describe, it, expect } from "vitest";

import { createParticipantSchema, createDrawSchema } from "./draw.schema";

describe("createParticipantSchema", () => {
  it("should validate a valid participant", () => {
    const validParticipant = {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      gift_preferences: "Books and gadgets",
    };

    const result = createParticipantSchema.safeParse(validParticipant);
    expect(result.success).toBe(true);
  });

  it("should reject participant with empty name", () => {
    const invalidParticipant = {
      name: "",
      surname: "Doe",
      email: "john.doe@example.com",
      gift_preferences: "Books",
    };

    const result = createParticipantSchema.safeParse(invalidParticipant);
    expect(result.success).toBe(false);
  });

  it("should reject participant with empty surname", () => {
    const invalidParticipant = {
      name: "John",
      surname: "",
      email: "john.doe@example.com",
      gift_preferences: "Books",
    };

    const result = createParticipantSchema.safeParse(invalidParticipant);
    expect(result.success).toBe(false);
  });

  it("should reject participant with invalid email", () => {
    const invalidParticipant = {
      name: "John",
      surname: "Doe",
      email: "invalid-email",
      gift_preferences: "Books",
    };

    const result = createParticipantSchema.safeParse(invalidParticipant);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email format");
    }
  });

  it("should reject participant with gift_preferences exceeding 10000 characters", () => {
    const invalidParticipant = {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      gift_preferences: "a".repeat(10001),
    };

    const result = createParticipantSchema.safeParse(invalidParticipant);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Gift preferences cannot exceed 10000 characters");
    }
  });

  it("should trim whitespace from name and surname", () => {
    const participant = {
      name: "  John  ",
      surname: "  Doe  ",
      email: "john.doe@example.com",
      gift_preferences: "Books",
    };

    const result = createParticipantSchema.safeParse(participant);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John");
      expect(result.data.surname).toBe("Doe");
    }
  });

  it("should allow empty gift_preferences", () => {
    const validParticipant = {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      gift_preferences: "",
    };

    const result = createParticipantSchema.safeParse(validParticipant);
    expect(result.success).toBe(true);
  });
});

describe("createDrawSchema", () => {
  const validParticipants = [
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
  ];

  it("should validate a valid draw with 3 participants", () => {
    const validDraw = {
      name: "Christmas 2025",
      participants: validParticipants,
    };

    const result = createDrawSchema.safeParse(validDraw);
    expect(result.success).toBe(true);
  });

  it("should validate a valid draw with 32 participants", () => {
    const participants = Array.from({ length: 32 }, (_, i) => ({
      name: `Person${i}`,
      surname: `Surname${i}`,
      email: `person${i}@example.com`,
      gift_preferences: "Anything",
    }));

    const validDraw = {
      name: "Large Draw",
      participants,
    };

    const result = createDrawSchema.safeParse(validDraw);
    expect(result.success).toBe(true);
  });

  it("should reject draw with empty name", () => {
    const invalidDraw = {
      name: "",
      participants: validParticipants,
    };

    const result = createDrawSchema.safeParse(invalidDraw);
    expect(result.success).toBe(false);
  });

  it("should reject draw with only 2 participants", () => {
    const invalidDraw = {
      name: "Small Draw",
      participants: validParticipants.slice(0, 2),
    };

    const result = createDrawSchema.safeParse(invalidDraw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("At least 3 participants are required");
    }
  });

  it("should reject draw with 33 participants", () => {
    const participants = Array.from({ length: 33 }, (_, i) => ({
      name: `Person${i}`,
      surname: `Surname${i}`,
      email: `person${i}@example.com`,
      gift_preferences: "Anything",
    }));

    const invalidDraw = {
      name: "Too Large Draw",
      participants,
    };

    const result = createDrawSchema.safeParse(invalidDraw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Maximum 32 participants allowed");
    }
  });

  it("should reject draw with invalid participant", () => {
    const invalidDraw = {
      name: "Christmas 2025",
      participants: [
        ...validParticipants.slice(0, 2),
        {
          name: "Invalid",
          surname: "User",
          email: "not-an-email",
          gift_preferences: "Books",
        },
      ],
    };

    const result = createDrawSchema.safeParse(invalidDraw);
    expect(result.success).toBe(false);
  });

  it("should trim whitespace from draw name", () => {
    const draw = {
      name: "  Christmas 2025  ",
      participants: validParticipants,
    };

    const result = createDrawSchema.safeParse(draw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Christmas 2025");
    }
  });
});
