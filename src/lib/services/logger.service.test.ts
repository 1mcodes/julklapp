import { beforeEach, describe, expect, it, vi } from "vitest";
import { logError, logInfo, logWarn, LoggerService } from "./logger.service";

// Mock node:fs/promises at the top level
vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    appendFile: vi.fn(),
  },
}));

// Import the mocked fs module
import fs from "node:fs/promises";

describe("LoggerService", () => {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  // Fixed timestamp for consistent testing
  const fixedDate = new Date("2026-01-02T12:00:00.000Z");

  // Get the actual log directory that will be used
  const logDir = `${process.cwd()}/logs`;
  const logFile = `${logDir}/app.log`;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock console methods
    console.error = vi.fn();
    console.log = vi.fn();
    console.warn = vi.fn();

    // Mock Date to return fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    // Setup default successful fs mock implementations
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.appendFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore original implementations
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    vi.useRealTimers();
  });

  describe("logError", () => {
    it("should log error message without additional data", async () => {
      const message = "Something went wrong";

      await logError(message);

      expect(fs.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        "[2026-01-02T12:00:00.000Z] [ERROR] Something went wrong\n",
        "utf-8"
      );
      expect(console.error).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [ERROR] Something went wrong");
    });

    it("should log error message with additional data object", async () => {
      const message = "Database connection failed";
      const errorData = { code: "ECONNREFUSED", port: 5432 };

      await logError(message, errorData);

      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        `[2026-01-02T12:00:00.000Z] [ERROR] Database connection failed
{
  "code": "ECONNREFUSED",
  "port": 5432
}\n`,
        "utf-8"
      );
    });

    it("should log error message with Error object", async () => {
      const message = "Unexpected error occurred";
      const error = new Error("Network timeout");

      await logError(message, error);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[ERROR] Unexpected error occurred");
      // Error objects serialize to {} by default, but the error object is still logged
      expect(loggedContent).toContain("{}");
    });

    it("should handle mkdir failure gracefully", async () => {
      const mkdirError = new Error("Permission denied");
      vi.mocked(fs.mkdir).mockRejectedValue(mkdirError);

      await logError("Test error");

      expect(console.error).toHaveBeenCalledWith("Failed to create logs directory:", mkdirError);
      // Should still try to write to console
      expect(console.error).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [ERROR] Test error");
    });

    it("should handle appendFile failure gracefully", async () => {
      const writeError = new Error("Disk full");
      vi.mocked(fs.appendFile).mockRejectedValue(writeError);

      await logError("Test error");

      expect(console.error).toHaveBeenCalledWith("Failed to write to log file:", writeError);
      // Should still write to console
      expect(console.error).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [ERROR] Test error");
    });

    it("should handle both mkdir and appendFile failures", async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error("mkdir failed"));
      vi.mocked(fs.appendFile).mockRejectedValue(new Error("write failed"));

      await logError("Test error");

      expect(console.error).toHaveBeenCalledTimes(3); // mkdir error, write error, and the actual log
    });
  });

  describe("logInfo", () => {
    it("should log info message without additional data", async () => {
      const message = "Application started";

      await logInfo(message);

      expect(fs.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        "[2026-01-02T12:00:00.000Z] [INFO] Application started\n",
        "utf-8"
      );
      expect(console.log).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [INFO] Application started");
    });

    it("should log info message with additional data", async () => {
      const message = "User logged in";
      const data = { userId: "123", email: "user@example.com" };

      await logInfo(message, data);

      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        `[2026-01-02T12:00:00.000Z] [INFO] User logged in
{
  "userId": "123",
  "email": "user@example.com"
}\n`,
        "utf-8"
      );
    });

    it("should log info message with array data", async () => {
      const message = "Processed items";
      const data = ["item1", "item2", "item3"];

      await logInfo(message, data);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[INFO] Processed items");
      expect(loggedContent).toContain('"item1"');
      expect(loggedContent).toContain('"item2"');
      expect(loggedContent).toContain('"item3"');
    });

    it("should handle mkdir failure gracefully", async () => {
      const mkdirError = new Error("Permission denied");
      vi.mocked(fs.mkdir).mockRejectedValue(mkdirError);

      await logInfo("Test info");

      expect(console.error).toHaveBeenCalledWith("Failed to create logs directory:", mkdirError);
      // Should still write to console.log
      expect(console.log).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [INFO] Test info");
    });

    it("should handle appendFile failure gracefully", async () => {
      const writeError = new Error("Disk full");
      vi.mocked(fs.appendFile).mockRejectedValue(writeError);

      await logInfo("Test info");

      expect(console.error).toHaveBeenCalledWith("Failed to write to log file:", writeError);
      // Should still write to console.log
      expect(console.log).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [INFO] Test info");
    });
  });

  describe("logWarn", () => {
    it("should log warning message without additional data", async () => {
      const message = "Deprecated API usage";

      await logWarn(message);

      expect(fs.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        "[2026-01-02T12:00:00.000Z] [WARN] Deprecated API usage\n",
        "utf-8"
      );
      expect(console.warn).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [WARN] Deprecated API usage");
    });

    it("should log warning message with additional data", async () => {
      const message = "High memory usage";
      const data = { usage: "85%", threshold: "80%" };

      await logWarn(message, data);

      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        `[2026-01-02T12:00:00.000Z] [WARN] High memory usage
{
  "usage": "85%",
  "threshold": "80%"
}\n`,
        "utf-8"
      );
    });

    it("should handle mkdir failure gracefully", async () => {
      const mkdirError = new Error("Permission denied");
      vi.mocked(fs.mkdir).mockRejectedValue(mkdirError);

      await logWarn("Test warning");

      expect(console.error).toHaveBeenCalledWith("Failed to create logs directory:", mkdirError);
      // Should still write to console.warn
      expect(console.warn).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [WARN] Test warning");
    });

    it("should handle appendFile failure gracefully", async () => {
      const writeError = new Error("Disk full");
      vi.mocked(fs.appendFile).mockRejectedValue(writeError);

      await logWarn("Test warning");

      expect(console.error).toHaveBeenCalledWith("Failed to write to log file:", writeError);
      // Should still write to console.warn
      expect(console.warn).toHaveBeenCalledWith("[2026-01-02T12:00:00.000Z] [WARN] Test warning");
    });
  });

  describe("LoggerService object", () => {
    it("should expose error method that calls logError", async () => {
      const message = "Service error";
      const data = { service: "auth" };

      await LoggerService.error(message, data);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[ERROR] Service error");
      expect(loggedContent).toContain('"service": "auth"');
      expect(console.error).toHaveBeenCalled();
    });

    it("should expose info method that calls logInfo", async () => {
      const message = "Service info";
      const data = { service: "db" };

      await LoggerService.info(message, data);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[INFO] Service info");
      expect(loggedContent).toContain('"service": "db"');
      expect(console.log).toHaveBeenCalled();
    });

    it("should expose warn method that calls logWarn", async () => {
      const message = "Service warning";
      const data = { service: "cache" };

      await LoggerService.warn(message, data);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[WARN] Service warning");
      expect(loggedContent).toContain('"service": "cache"');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle null as additional data", async () => {
      await logError("Error with null", null);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("[ERROR] Error with null");
      expect(loggedContent).toContain("null");
    });

    it("should handle undefined as additional data", async () => {
      await logInfo("Info with undefined", undefined);

      expect(fs.appendFile).toHaveBeenCalledWith(
        logFile,
        "[2026-01-02T12:00:00.000Z] [INFO] Info with undefined\n",
        "utf-8"
      );
    });

    it("should handle empty string as message", async () => {
      await logWarn("");

      expect(fs.appendFile).toHaveBeenCalledWith(logFile, "[2026-01-02T12:00:00.000Z] [WARN] \n", "utf-8");
    });

    it("should handle very long messages", async () => {
      const longMessage = "A".repeat(10000);

      await logError(longMessage);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("A".repeat(10000));
    });

    it("should handle deeply nested objects", async () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: "deeply nested",
              },
            },
          },
        },
      };

      await logInfo("Deep object", deepObject);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("deeply nested");
    });

    it("should throw error when logging circular references", async () => {
      const circularObj: Record<string, unknown> = { name: "test" };
      circularObj.self = circularObj;

      // JSON.stringify will throw on circular references
      // This is a known limitation of the current logger implementation
      await expect(logError("Circular ref", circularObj)).rejects.toThrow("Converting circular structure to JSON");
    });

    it("should handle special characters in messages", async () => {
      const message = "Error with special chars: \n\t\r\"'\\";

      await logError(message);

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toContain("Error with special chars:");
    });

    it("should handle concurrent logging calls", async () => {
      const promises = [
        logError("Error 1"),
        logInfo("Info 1"),
        logWarn("Warn 1"),
        logError("Error 2"),
        logInfo("Info 2"),
      ];

      await Promise.all(promises);

      expect(fs.appendFile).toHaveBeenCalledTimes(5);
      expect(fs.mkdir).toHaveBeenCalledTimes(5);
    });

    it("should create logs directory for each write call", async () => {
      await logError("First log");
      await logInfo("Second log");
      await logWarn("Third log");

      expect(fs.mkdir).toHaveBeenCalledTimes(3);
      expect(fs.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
    });

    it("should append to the same log file for all log levels", async () => {
      await logError("Error message");
      await logInfo("Info message");
      await logWarn("Warn message");

      const calls = vi.mocked(fs.appendFile).mock.calls;
      expect(calls).toHaveLength(3);
      expect(calls[0][0]).toBe(logFile);
      expect(calls[1][0]).toBe(logFile);
      expect(calls[2][0]).toBe(logFile);
    });
  });

  describe("timestamp format", () => {
    it("should use ISO format for timestamps", async () => {
      await logInfo("Test message");

      expect(fs.appendFile).toHaveBeenCalled();
      const loggedContent = vi.mocked(fs.appendFile).mock.calls[0][1] as string;
      expect(loggedContent).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it("should have different timestamps for logs at different times", async () => {
      await logInfo("First log");

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      await logInfo("Second log");

      const calls = vi.mocked(fs.appendFile).mock.calls;
      const firstLog = calls[0][1] as string;
      const secondLog = calls[1][1] as string;

      expect(firstLog).toContain("[2026-01-02T12:00:00.000Z]");
      expect(secondLog).toContain("[2026-01-02T12:00:01.000Z]");
    });
  });
});
