import fs from "node:fs/promises";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "app.log");

/**
 * Ensures the logs directory exists.
 */
async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create logs directory:", error);
  }
}

/**
 * Formats a log entry with timestamp and level.
 */
function formatLogEntry(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
}

/**
 * Writes a log entry to the file.
 */
async function writeLog(entry: string): Promise<void> {
  try {
    await ensureLogDirectory();
    await fs.appendFile(logFile, entry, "utf-8");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to write to log file:", error);
  }
}

/**
 * Logs an error with optional additional data.
 *
 * @param message - The error message
 * @param error - Optional error object or additional data
 */
export async function logError(message: string, error?: unknown): Promise<void> {
  const entry = formatLogEntry("ERROR", message, error);
  await writeLog(entry);
  // eslint-disable-next-line no-console
  console.error(entry.trim());
}

/**
 * Logs an informational message.
 *
 * @param message - The info message
 * @param data - Optional additional data
 */
export async function logInfo(message: string, data?: unknown): Promise<void> {
  const entry = formatLogEntry("INFO", message, data);
  await writeLog(entry);
  // eslint-disable-next-line no-console
  console.log(entry.trim());
}

/**
 * Logs a warning message.
 *
 * @param message - The warning message
 * @param data - Optional additional data
 */
export async function logWarn(message: string, data?: unknown): Promise<void> {
  const entry = formatLogEntry("WARN", message, data);
  await writeLog(entry);
  // eslint-disable-next-line no-console
  console.warn(entry.trim());
}

/**
 * Logger service with static-like methods for convenient access.
 */
export const LoggerService = {
  error: logError,
  info: logInfo,
  warn: logWarn,
};
