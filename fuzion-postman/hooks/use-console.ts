import { useState, useCallback } from "react";
import type { ConsoleEntry } from "@/components/postman/console-panel";

export function useConsole() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);

  const addEntry = useCallback(
    (entry: Omit<ConsoleEntry, "id" | "timestamp">) => {
      const newEntry: ConsoleEntry = {
        ...entry,
        id: `console-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        timestamp: new Date(),
      };

      setEntries((prev) => {
        const updated = [...prev, newEntry];
        // Keep only last 10 entries
        return updated.slice(-10);
      });
    },
    []
  );

  const logRequest = useCallback(
    (method: string, url: string, headers?: Record<string, string>) => {
      addEntry({
        type: "request",
        method,
        url,
        timeMs: 0,
        requestHeaders: headers,
      });
    },
    [addEntry]
  );

  const logResponse = useCallback(
    (
      method: string,
      url: string,
      status: number,
      statusText: string,
      timeMs: number,
      requestHeaders?: Record<string, string>,
      responseHeaders?: Record<string, string>
    ) => {
      addEntry({
        type: "response",
        method,
        url,
        status,
        statusText,
        timeMs,
        requestHeaders,
        responseHeaders,
      });
    },
    [addEntry]
  );

  const logError = useCallback(
    (
      method: string,
      url: string,
      error: string,
      timeMs: number,
      requestHeaders?: Record<string, string>
    ) => {
      addEntry({
        type: "error",
        method,
        url,
        error,
        timeMs,
        requestHeaders,
      });
    },
    [addEntry]
  );

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    logRequest,
    logResponse,
    logError,
    clearEntries,
  };
}
