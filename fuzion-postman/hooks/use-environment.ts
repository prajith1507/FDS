import { useState, useCallback, useMemo } from "react";
import type { EnvironmentVariable } from "@/components/postman/environment-manager";

export function useEnvironmentVariables() {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([
    {
      id: "default-1",
      variable: "base_url",
      value: "http://192.168.1.37:8001",
      type: "default",
      enabled: true,
    },
    {
      id: "default-2",
      variable: "token",
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      type: "secret",
      enabled: true,
    },
    {
      id: "default-3",
      variable: "live_url",
      value: "https://subscription-api.fuzionest.com",
      type: "default",
      enabled: true,
    },
    {
      id: "default-4",
      variable: "local_url",
      value: "http://192.168.1.7:4030",
      type: "default",
      enabled: true,
    },
    {
      id: "default-5",
      variable: "orgId",
      value: "123",
      type: "default",
      enabled: true,
    },
  ]);

  const updateVariables = useCallback((newVariables: EnvironmentVariable[]) => {
    setVariables(newVariables);
  }, []);

  // Create a map of enabled variables for quick lookup
  const variableMap = useMemo(() => {
    const map: Record<string, string> = {};
    variables
      .filter((v) => v.enabled && v.variable.trim() !== "")
      .forEach((v) => {
        map[v.variable] = v.value;
      });
    return map;
  }, [variables]);

  // Function to replace variables in a string
  const replaceVariables = useCallback(
    (text: string): string => {
      if (!text) return text;

      return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
        const trimmedName = variableName.trim();
        return variableMap[trimmedName] || match; // Return original if variable not found
      });
    },
    [variableMap]
  );

  // Function to check if a string contains variables
  const hasVariables = useCallback((text: string): boolean => {
    return /\{\{[^}]+\}\}/.test(text || "");
  }, []);

  // Function to extract variable names from a string
  const extractVariables = useCallback((text: string): string[] => {
    if (!text) return [];
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map((match) => match.replace(/[{}]/g, "").trim());
  }, []);

  // Function to get variable suggestions for autocomplete
  const getVariableSuggestions = useCallback(
    (query: string = ""): EnvironmentVariable[] => {
      const lowerQuery = query.toLowerCase();
      return variables
        .filter(
          (v) => v.enabled && v.variable.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => a.variable.localeCompare(b.variable));
    },
    [variables]
  );

  return {
    variables,
    updateVariables,
    variableMap,
    replaceVariables,
    hasVariables,
    extractVariables,
    getVariableSuggestions,
  };
}
