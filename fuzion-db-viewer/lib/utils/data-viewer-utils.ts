/**
 * Advanced Data Viewer Utilities
 * Helper functions for data processing, analysis, and transformation
 */

import {
  ColumnDataType,
  ColumnSchema,
  ColumnStatistics,
  DataRow,
  FilterCondition,
  FilterOperator,
  SortDirection,
  SortState,
} from "@/lib/types/data-viewer";

// ============================================================================
// Type Detection
// ============================================================================

/**
 * Infer data type from a value
 */
export function inferType(value: any): ColumnDataType {
  if (value === null || value === undefined) return "null";

  const type = typeof value;

  if (type === "string") {
    // Check if it's a date string
    if (isDateString(value)) return "date";
    return "string";
  }

  if (type === "number") return "number";
  if (type === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (type === "object") return "object";

  return "mixed";
}

/**
 * Check if string is a valid date
 */
function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Analyze column data types from a sample of rows
 */
export function analyzeColumnTypes(
  rows: DataRow[],
  sampleSize = 100
): Map<string, ColumnDataType> {
  const typeMap = new Map<string, ColumnDataType>();
  const sample = rows.slice(0, sampleSize);

  // Get all unique keys
  const keys = new Set<string>();
  sample.forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });

  // Analyze each column
  keys.forEach((key) => {
    const types = new Set<ColumnDataType>();

    sample.forEach((row) => {
      if (key in row) {
        types.add(inferType(row[key]));
      }
    });

    // If all same type, use it; otherwise 'mixed'
    if (types.size === 1) {
      typeMap.set(key, Array.from(types)[0]);
    } else if (types.size === 2 && types.has("null")) {
      // If only null and one other type, use the other type
      types.delete("null");
      typeMap.set(key, Array.from(types)[0]);
    } else {
      typeMap.set(key, "mixed");
    }
  });

  return typeMap;
}

// ============================================================================
// Schema Generation
// ============================================================================

/**
 * Generate column schemas from data
 */
export function generateColumnSchemas(
  rows: DataRow[],
  options?: {
    includeStats?: boolean;
    defaultWidth?: number;
  }
): ColumnSchema[] {
  if (rows.length === 0) return [];

  const { includeStats = false, defaultWidth = 150 } = options || {};

  // Get all column names
  const columnNames = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "_rowId") columnNames.add(key);
    });
  });

  // Analyze types
  const typeMap = analyzeColumnTypes(rows);

  // Build schemas
  const schemas: ColumnSchema[] = [];

  columnNames.forEach((name) => {
    const type = typeMap.get(name) || "mixed";

    const schema: ColumnSchema = {
      id: name,
      name: formatColumnName(name),
      type,
      width: calculateColumnWidth(name, type, defaultWidth),
      sortable: true,
      filterable: true,
      visible: true,
    };

    if (includeStats) {
      schema.stats = calculateColumnStatistics(rows, name, type);
    }

    schemas.push(schema);
  });

  return schemas;
}

/**
 * Format column name for display
 */
function formatColumnName(name: string): string {
  // Convert snake_case or camelCase to Title Case
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Calculate appropriate column width
 */
function calculateColumnWidth(
  name: string,
  type: ColumnDataType,
  defaultWidth: number
): number {
  const nameLength = name.length * 8 + 40; // approximate pixel width

  let contentWidth = defaultWidth;

  switch (type) {
    case "boolean":
      contentWidth = 80;
      break;
    case "number":
      contentWidth = 120;
      break;
    case "date":
      contentWidth = 180;
      break;
    case "string":
      contentWidth = 200;
      break;
    case "object":
    case "array":
      contentWidth = 250;
      break;
  }

  return Math.max(nameLength, contentWidth, 100);
}

// ============================================================================
// Statistics Calculation
// ============================================================================

/**
 * Calculate statistics for a column
 */
export function calculateColumnStatistics(
  rows: DataRow[],
  columnId: string,
  type: ColumnDataType
): ColumnStatistics {
  const values = rows.map((row) => row[columnId]);
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  const stats: ColumnStatistics = {
    count: nonNullValues.length,
    nullCount: values.length - nonNullValues.length,
    uniqueCount: new Set(nonNullValues).size,
  };

  // Type-specific statistics
  if (type === "number") {
    const numbers = nonNullValues.filter((v) => typeof v === "number");
    if (numbers.length > 0) {
      stats.numericStats = {
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        sum: numbers.reduce((a, b) => a + b, 0),
      };
    }
  }

  if (type === "string") {
    const strings = nonNullValues.filter((v) => typeof v === "string");
    if (strings.length > 0) {
      const lengths = strings.map((s) => s.length);
      stats.stringStats = {
        minLength: Math.min(...lengths),
        maxLength: Math.max(...lengths),
        avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      };
    }
  }

  // Calculate top values
  const valueCounts = new Map<any, number>();
  nonNullValues.forEach((value) => {
    const key = JSON.stringify(value);
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  });

  stats.topValues = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ value: JSON.parse(key), count }));

  return stats;
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Apply filter condition to a value
 */
export function applyFilter(value: any, condition: FilterCondition): boolean {
  if (!condition.active) return true;

  const { operator, value: filterValue } = condition;

  // Handle null/undefined
  if (value === null || value === undefined) {
    return operator === "isEmpty" || operator === "isNotEmpty";
  }

  switch (operator) {
    case "equals":
      return value === filterValue;

    case "notEquals":
      return value !== filterValue;

    case "contains":
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());

    case "notContains":
      return !String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());

    case "startsWith":
      return String(value)
        .toLowerCase()
        .startsWith(String(filterValue).toLowerCase());

    case "endsWith":
      return String(value)
        .toLowerCase()
        .endsWith(String(filterValue).toLowerCase());

    case "greaterThan":
      return Number(value) > Number(filterValue);

    case "lessThan":
      return Number(value) < Number(filterValue);

    case "greaterThanOrEqual":
      return Number(value) >= Number(filterValue);

    case "lessThanOrEqual":
      return Number(value) <= Number(filterValue);

    case "isEmpty":
      return value === null || value === undefined || value === "";

    case "isNotEmpty":
      return value !== null && value !== undefined && value !== "";

    case "in":
      return Array.isArray(filterValue) && filterValue.includes(value);

    case "notIn":
      return Array.isArray(filterValue) && !filterValue.includes(value);

    default:
      return true;
  }
}

/**
 * Filter rows based on multiple conditions
 */
export function filterRows(
  rows: DataRow[],
  conditions: FilterCondition[]
): DataRow[] {
  return rows.filter((row) => {
    return conditions.every((condition) => {
      const value = row[condition.columnId];
      return applyFilter(value, condition);
    });
  });
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Compare two values for sorting
 */
export function compareValues(
  a: any,
  b: any,
  direction: SortDirection
): number {
  // Handle null/undefined
  if (a === null || a === undefined) return direction === "asc" ? 1 : -1;
  if (b === null || b === undefined) return direction === "asc" ? -1 : 1;

  // Type-specific comparison
  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a;
  }

  if (typeof a === "string" && typeof b === "string") {
    const comparison = a.localeCompare(b);
    return direction === "asc" ? comparison : -comparison;
  }

  if (a instanceof Date && b instanceof Date) {
    const comparison = a.getTime() - b.getTime();
    return direction === "asc" ? comparison : -comparison;
  }

  // Default: convert to string and compare
  const strA = String(a);
  const strB = String(b);
  const comparison = strA.localeCompare(strB);
  return direction === "asc" ? comparison : -comparison;
}

/**
 * Sort rows based on sort state
 */
export function sortRows(
  rows: DataRow[],
  sortState: SortState | null
): DataRow[] {
  if (!sortState) return rows;

  const { columnId, direction } = sortState;

  return [...rows].sort((a, b) => {
    return compareValues(a[columnId], b[columnId], direction);
  });
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Convert rows to CSV format
 */
export function rowsToCSV(
  rows: DataRow[],
  columns: ColumnSchema[],
  includeHeaders = true
): string {
  const lines: string[] = [];

  // Add headers
  if (includeHeaders) {
    lines.push(columns.map((col) => escapeCSV(col.name)).join(","));
  }

  // Add data rows
  rows.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col.id];
      return escapeCSV(formatValueForExport(value));
    });
    lines.push(values.join(","));
  });

  return lines.join("\n");
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format value for export
 */
function formatValueForExport(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Download data as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format value for display
 */
export function formatValue(value: any, type: ColumnDataType): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  switch (type) {
    case "date":
      return new Date(value).toLocaleString();

    case "boolean":
      return value ? "true" : "false";

    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);

    case "object":
    case "array":
      return JSON.stringify(value, null, 2);

    default:
      return String(value);
  }
}

/**
 * Truncate long text
 */
export function truncateText(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Get percentage for visualization
 */
export function getPercentage(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

// ============================================================================
// Column Insights & Data Quality
// ============================================================================

import type {
  ColumnInsights,
  DataQualityMetrics,
  ValueDistribution,
  NumericDistribution,
} from "@/lib/types/data-viewer";

const MAX_SAMPLE_SIZE = 10000; // For performance with large datasets
const MAX_UNIQUE_VALUES = 50; // Maximum unique values to show in distribution

/**
 * Calculate comprehensive column insights with performance optimization
 */
export function calculateColumnInsights(
  columnId: string,
  columnName: string,
  data: DataRow[],
  dataType: ColumnDataType
): ColumnInsights {
  // Use sampling for large datasets
  const shouldSample = data.length > MAX_SAMPLE_SIZE;
  const sampleData = shouldSample ? sampleArray(data, MAX_SAMPLE_SIZE) : data;

  const values = sampleData.map((row) => row[columnId]);
  const quality = calculateDataQuality(values, dataType);

  const insights: ColumnInsights = {
    columnId,
    columnName,
    dataType,
    quality,
    isSampled: shouldSample,
    sampleSize: shouldSample ? MAX_SAMPLE_SIZE : data.length,
  };

  // Add type-specific insights
  if (dataType === "number") {
    insights.numericDistribution = calculateNumericDistribution(values);
  } else if (dataType === "string" || dataType === "boolean") {
    insights.valueDistribution = calculateValueDistribution(
      values,
      quality.total
    );
  } else if (dataType === "date") {
    insights.dateRange = calculateDateRange(values);
  }

  // Add invalid samples for debugging
  if (quality.invalid > 0) {
    insights.invalidSamples = values
      .filter((v) => isInvalidValue(v, dataType))
      .slice(0, 5);
  }

  return insights;
}

/**
 * Calculate data quality metrics
 */
function calculateDataQuality(
  values: any[],
  expectedType: ColumnDataType
): DataQualityMetrics {
  const total = values.length;
  let missing = 0;
  let invalid = 0;
  const uniqueValues = new Set();
  const valueCounts = new Map<any, number>();

  values.forEach((value) => {
    // Check for missing values
    if (value === null || value === undefined || value === "") {
      missing++;
      return;
    }

    // Check for invalid values
    if (isInvalidValue(value, expectedType)) {
      invalid++;
      return;
    }

    // Track unique values
    uniqueValues.add(value);

    // Track duplicates
    valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
  });

  const valid = total - missing - invalid;
  const unique = uniqueValues.size;
  const duplicates = Array.from(valueCounts.values()).filter(
    (count) => count > 1
  ).length;

  return {
    total,
    valid,
    missing,
    invalid,
    duplicates,
    unique,
    completeness: total > 0 ? (valid / total) * 100 : 0,
    validity: total > 0 ? (valid / (total - missing)) * 100 : 100,
    uniqueness: valid > 0 ? (unique / valid) * 100 : 0,
  };
}

/**
 * Check if value is invalid for the expected type
 */
function isInvalidValue(value: any, expectedType: ColumnDataType): boolean {
  if (value === null || value === undefined || value === "") return false;

  switch (expectedType) {
    case "number":
      return typeof value !== "number" || isNaN(value) || !isFinite(value);
    case "boolean":
      return typeof value !== "boolean";
    case "date":
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        return isNaN(date.getTime());
      }
      return !(value instanceof Date);
    case "string":
      return typeof value !== "string";
    default:
      return false;
  }
}

/**
 * Calculate value distribution for categorical data
 */
function calculateValueDistribution(
  values: any[],
  total: number
): ValueDistribution[] {
  const valueCounts = new Map<any, number>();

  values.forEach((value) => {
    if (value === null || value === undefined) {
      valueCounts.set("(empty)", (valueCounts.get("(empty)") || 0) + 1);
    } else {
      const key = String(value);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    }
  });

  // Convert to array and sort by count
  const distribution = Array.from(valueCounts.entries())
    .map(([value, count]) => ({
      value: value === "(empty)" ? null : value,
      label: value === "(empty)" ? "(empty)" : String(value),
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Limit to MAX_UNIQUE_VALUES for performance
  if (distribution.length > MAX_UNIQUE_VALUES) {
    const topValues = distribution.slice(0, MAX_UNIQUE_VALUES - 1);
    const othersCount = distribution
      .slice(MAX_UNIQUE_VALUES - 1)
      .reduce((sum, item) => sum + item.count, 0);

    topValues.push({
      value: null,
      label: `(${distribution.length - MAX_UNIQUE_VALUES + 1} others)`,
      count: othersCount,
      percentage: (othersCount / total) * 100,
    });

    return topValues;
  }

  return distribution;
}

/**
 * Calculate numeric distribution with histogram buckets
 */
function calculateNumericDistribution(values: any[]): NumericDistribution {
  const numericValues = values
    .filter((v) => typeof v === "number" && isFinite(v))
    .sort((a, b) => a - b);

  if (numericValues.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      buckets: [],
    };
  }

  const min = numericValues[0];
  const max = numericValues[numericValues.length - 1];
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const avg = sum / numericValues.length;
  const median = numericValues[Math.floor(numericValues.length / 2)];

  // Create histogram buckets
  const bucketCount = Math.min(10, numericValues.length);
  const bucketSize = (max - min) / bucketCount;
  const buckets: NumericDistribution["buckets"] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = i === bucketCount - 1 ? max : min + (i + 1) * bucketSize;
    const count = numericValues.filter(
      (v) => v >= bucketMin && v <= bucketMax
    ).length;

    buckets.push({
      range: `${bucketMin.toFixed(2)} - ${bucketMax.toFixed(2)}`,
      min: bucketMin,
      max: bucketMax,
      count,
      percentage: (count / numericValues.length) * 100,
    });
  }

  return {
    min,
    max,
    avg,
    median,
    buckets,
  };
}

/**
 * Calculate date range and distribution
 */
function calculateDateRange(values: any[]) {
  const dates = values
    .map((v) => {
      if (!v) return null;
      const date = new Date(v);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return undefined;
  }

  return {
    earliest: dates[0].toISOString(),
    latest: dates[dates.length - 1].toISOString(),
    distribution: [], // Could add monthly/yearly distribution here
  };
}

/**
 * Sample array for performance with large datasets
 */
function sampleArray<T>(array: T[], sampleSize: number): T[] {
  if (array.length <= sampleSize) return array;

  const step = array.length / sampleSize;
  const sampled: T[] = [];

  for (let i = 0; i < sampleSize; i++) {
    sampled.push(array[Math.floor(i * step)]);
  }

  return sampled;
}

/**
 * Get quality color based on percentage
 */
export function getQualityColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 70) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get quality color variant for Badge
 */
export function getQualityVariant(
  percentage: number
): "default" | "secondary" | "destructive" {
  if (percentage >= 90) return "default";
  if (percentage >= 70) return "secondary";
  return "destructive";
}
