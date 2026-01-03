import { describe, it, expect } from "vitest";
import { z } from "zod";

import { createParticipantSchema, createDrawSchema, drawIdParamSchema } from "./draw.schema";

describe("createParticipantSchema", () => {
  describe("valid inputs", () => {
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

    it("should accept gift_preferences with exactly 10000 characters", () => {
      const validParticipant = {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        gift_preferences: "a".repeat(10000),
      };

      const result = createParticipantSchema.safeParse(validParticipant);
      expect(result.success).toBe(true);
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

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
        "123@example.com",
      ];

      validEmails.forEach((email) => {
        const participant = {
          name: "John",
          surname: "Doe",
          email,
          gift_preferences: "Books",
        };

        const result = createParticipantSchema.safeParse(participant);
        expect(result.success).toBe(true, `Failed for email: ${email}`);
      });
    });
  });

  describe("invalid inputs - name validation", () => {
    it("should reject participant with empty name", () => {
      const invalidParticipant = {
        name: "",
        surname: "Doe",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Name is required");
      }
    });

    it("should reject participant with whitespace-only name", () => {
      const invalidParticipant = {
        name: "   ",
        surname: "Doe",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Name is required");
      }
    });

    it("should reject participant with missing name field", () => {
      const invalidParticipant = {
        surname: "Doe",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid inputs - surname validation", () => {
    it("should reject participant with empty surname", () => {
      const invalidParticipant = {
        name: "John",
        surname: "",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Surname is required");
      }
    });

    it("should reject participant with whitespace-only surname", () => {
      const invalidParticipant = {
        name: "John",
        surname: "   ",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Surname is required");
      }
    });

    it("should reject participant with missing surname field", () => {
      const invalidParticipant = {
        name: "John",
        email: "john.doe@example.com",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid inputs - email validation", () => {
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

    it("should reject various invalid email formats", () => {
      const invalidEmails = [
        "plaintext",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
        "user..name@example.com",
        "user@.example.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        const participant = {
          name: "John",
          surname: "Doe",
          email,
          gift_preferences: "Books",
        };

        const result = createParticipantSchema.safeParse(participant);
        expect(result.success).toBe(false, `Should fail for email: ${email}`);
      });
    });

    it("should reject participant with missing email field", () => {
      const invalidParticipant = {
        name: "John",
        surname: "Doe",
        gift_preferences: "Books",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid inputs - gift_preferences validation", () => {
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

    it("should reject participant with missing gift_preferences field", () => {
      const invalidParticipant = {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
      };

      const result = createParticipantSchema.safeParse(invalidParticipant);
      expect(result.success).toBe(false);
    });
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

  describe("valid inputs", () => {
    it("should validate a valid draw with 3 participants (minimum)", () => {
      const validDraw = {
        name: "Christmas 2025",
        participants: validParticipants,
      };

      const result = createDrawSchema.safeParse(validDraw);
      expect(result.success).toBe(true);
    });

    it("should validate a valid draw with 32 participants (maximum)", () => {
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

    it("should validate a draw with mid-range number of participants", () => {
      const participants = Array.from({ length: 10 }, (_, i) => ({
        name: `Person${i}`,
        surname: `Surname${i}`,
        email: `person${i}@example.com`,
        gift_preferences: "Anything",
      }));

      const validDraw = {
        name: "Medium Draw",
        participants,
      };

      const result = createDrawSchema.safeParse(validDraw);
      expect(result.success).toBe(true);
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

    it("should validate draw with participants having varied data", () => {
      const diverseParticipants = [
        {
          name: "A",
          surname: "B",
          email: "a@b.co",
          gift_preferences: "",
        },
        {
          name: "Very Long Name",
          surname: "Very Long Surname",
          email: "verylongemail@verylongdomain.com",
          gift_preferences: "A".repeat(5000),
        },
        {
          name: "Regular",
          surname: "Person",
          email: "regular@example.com",
          gift_preferences: "Normal preferences",
        },
      ];

      const validDraw = {
        name: "Diverse Draw",
        participants: diverseParticipants,
      };

      const result = createDrawSchema.safeParse(validDraw);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs - draw name validation", () => {
    it("should reject draw with empty name", () => {
      const invalidDraw = {
        name: "",
        participants: validParticipants,
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Draw name is required");
      }
    });

    it("should reject draw with whitespace-only name", () => {
      const invalidDraw = {
        name: "   ",
        participants: validParticipants,
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Draw name is required");
      }
    });

    it("should reject draw with missing name field", () => {
      const invalidDraw = {
        participants: validParticipants,
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid inputs - participants count validation", () => {
    it("should reject draw with 0 participants", () => {
      const invalidDraw = {
        name: "Empty Draw",
        participants: [],
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least 3 participants are required");
      }
    });

    it("should reject draw with only 1 participant", () => {
      const invalidDraw = {
        name: "Solo Draw",
        participants: validParticipants.slice(0, 1),
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least 3 participants are required");
      }
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

    it("should reject draw with 100 participants", () => {
      const participants = Array.from({ length: 100 }, (_, i) => ({
        name: `Person${i}`,
        surname: `Surname${i}`,
        email: `person${i}@example.com`,
        gift_preferences: "Anything",
      }));

      const invalidDraw = {
        name: "Way Too Large Draw",
        participants,
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Maximum 32 participants allowed");
      }
    });

    it("should reject draw with missing participants field", () => {
      const invalidDraw = {
        name: "No Participants Draw",
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid inputs - participant data validation", () => {
    it("should reject draw with one invalid participant (bad email)", () => {
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

    it("should reject draw with participant missing required fields", () => {
      const invalidDraw = {
        name: "Christmas 2025",
        participants: [
          ...validParticipants.slice(0, 2),
          {
            name: "John",
            email: "john@example.com",
            gift_preferences: "Books",
          } as Partial<z.infer<typeof createParticipantSchema>>,
        ],
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });

    it("should reject draw with participant having empty name", () => {
      const invalidDraw = {
        name: "Christmas 2025",
        participants: [
          ...validParticipants.slice(0, 2),
          {
            name: "",
            surname: "User",
            email: "user@example.com",
            gift_preferences: "Books",
          },
        ],
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });

    it("should reject draw with participant having too long gift preferences", () => {
      const invalidDraw = {
        name: "Christmas 2025",
        participants: [
          ...validParticipants.slice(0, 2),
          {
            name: "John",
            surname: "Doe",
            email: "john@example.com",
            gift_preferences: "a".repeat(10001),
          },
        ],
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });

    it("should reject draw when all participants are invalid", () => {
      const invalidDraw = {
        name: "Christmas 2025",
        participants: [
          {
            name: "",
            surname: "Doe",
            email: "invalid",
            gift_preferences: "Books",
          },
          {
            name: "Jane",
            surname: "",
            email: "invalid",
            gift_preferences: "Electronics",
          },
          {
            name: "Bob",
            surname: "Johnson",
            email: "invalid",
            gift_preferences: "Sports",
          },
        ],
      };

      const result = createDrawSchema.safeParse(invalidDraw);
      expect(result.success).toBe(false);
    });
  });
});

describe("drawIdParamSchema", () => {
  describe("valid inputs", () => {
    it("should validate a valid UUID v4", () => {
      const validParam = {
        drawId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = drawIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("should validate various valid UUID formats", () => {
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ];

      validUUIDs.forEach((uuid) => {
        const param = { drawId: uuid };
        const result = drawIdParamSchema.safeParse(param);
        expect(result.success).toBe(true, `Failed for UUID: ${uuid}`);
      });
    });

    it("should accept UUID with uppercase letters", () => {
      const validParam = {
        drawId: "550E8400-E29B-41D4-A716-446655440000",
      };

      const result = drawIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject invalid UUID format", () => {
      const invalidParam = {
        drawId: "not-a-uuid",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid draw ID format");
      }
    });

    it("should reject UUID with wrong segment lengths", () => {
      const invalidParam = {
        drawId: "550e8400-e29b-41d4-a716-44665544000",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with missing hyphens", () => {
      const invalidParam = {
        drawId: "550e8400e29b41d4a716446655440000",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong hyphen positions", () => {
      const invalidParam = {
        drawId: "550e8-400e29b-41d4a-716446-655440000",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const invalidParam = {
        drawId: "",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      const invalidParam = {
        drawId: "550e8400-e29b-41d4-a716-44665544000g",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID that is too short", () => {
      const invalidParam = {
        drawId: "550e8400-e29b-41d4-a716",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID that is too long", () => {
      const invalidParam = {
        drawId: "550e8400-e29b-41d4-a716-446655440000-extra",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject missing drawId field", () => {
      const invalidParam = {};

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject non-string drawId", () => {
      const invalidParam = {
        drawId: 12345,
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject null drawId", () => {
      const invalidParam = {
        drawId: null,
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject undefined drawId", () => {
      const invalidParam = {
        drawId: undefined,
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const invalidParam = {
        drawId: " 550e8400-e29b-41d4-a716-446655440000 ",
      };

      const result = drawIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });
});
