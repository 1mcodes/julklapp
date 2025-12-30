import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./draws";
import type { APIContext } from "astro";

// Create mock functions before mocking modules
const mockGetDrawsByAuthor = vi.fn();
const mockCreateDraw = vi.fn();

// Mock the services
vi.mock("../../lib/services/logger.service", () => ({
  LoggerService: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../lib/services/draw.service", () => ({
  DrawService: vi.fn(function () {
    return {
      getDrawsByAuthor: mockGetDrawsByAuthor,
      createDraw: mockCreateDraw,
    };
  }),
}));

describe("GET /api/draws", () => {
  let mockContext: Partial<APIContext>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn(),
          },
        } as any,
      },
    };
  });

  it("should return 401 when user is not authenticated", async () => {
    // Mock no user
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await GET(mockContext as APIContext);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Unauthorized",
      message: "Authentication required",
    });
  });

  it("should return 401 when authentication fails", async () => {
    // Mock auth error
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const response = await GET(mockContext as APIContext);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Unauthorized",
      message: "Authentication required",
    });
  });

  it("should return 200 with draws for authenticated user", async () => {
    const mockUserId = "user-123";
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

    // Mock authenticated user
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock service response
    mockGetDrawsByAuthor.mockResolvedValue(mockDraws);

    const response = await GET(mockContext as APIContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockDraws);
    expect(mockGetDrawsByAuthor).toHaveBeenCalledWith(mockUserId);
  });

  it("should return 200 with empty array when user has no draws", async () => {
    const mockUserId = "user-123";

    // Mock authenticated user
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock service response with empty array
    mockGetDrawsByAuthor.mockResolvedValue([]);

    const response = await GET(mockContext as APIContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("should return 500 when service throws an error", async () => {
    const mockUserId = "user-123";

    // Mock authenticated user
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock service error
    mockGetDrawsByAuthor.mockRejectedValue(new Error("Database connection failed"));

    const response = await GET(mockContext as APIContext);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Internal Server Error",
      message: "Failed to retrieve draws",
    });
  });

  it("should set correct content-type header", async () => {
    const mockUserId = "user-123";

    // Mock authenticated user
    (mockContext.locals!.supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    mockGetDrawsByAuthor.mockResolvedValue([]);

    const response = await GET(mockContext as APIContext);

    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});
