/**
 * Advanced Data Viewer Types
 * Type definitions for the sophisticated data viewer component
 */

// ============================================================================
// Column Types
// ============================================================================

export type ColumnDataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object"
  | "array"
  | "null"
  | "mixed";

export interface ColumnSchema {
  /** Unique identifier for the column */
  id: string;
  /** Display name */
  name: string;
  /** Data type */
  type: ColumnDataType;
  /** Width in pixels */
  width: number;
  /** Is column sortable */
  sortable: boolean;
  /** Is column filterable */
  filterable: boolean;
  /** Is column visible */
  visible: boolean;
  /** Column statistics */
  stats?: ColumnStatistics;
}

export interface ColumnStatistics {
  /** Total non-null values */
  count: number;
  /** Null value count */
  nullCount: number;
  /** Unique value count */
  uniqueCount: number;
  /** For numbers: min, max, avg */
  numericStats?: {
    min: number;
    max: number;
    avg: number;
    sum: number;
  };
  /** For strings: min/max length */
  stringStats?: {
    minLength: number;
    maxLength: number;
    avgLength: number;
  };
  /** Most common values */
  topValues?: Array<{ value: any; count: number }>;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "isEmpty"
  | "isNotEmpty"
  | "in"
  | "notIn";

export interface FilterCondition {
  /** Column ID to filter */
  columnId: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value(s) */
  value: any;
  /** Is filter active */
  active: boolean;
}

export interface FilterState {
  /** All filter conditions */
  conditions: FilterCondition[];
  /** Global search text */
  globalSearch?: string;
}

// ============================================================================
// Sort Types
// ============================================================================

export type SortDirection = "asc" | "desc";

export interface SortState {
  /** Column ID to sort by */
  columnId: string;
  /** Sort direction */
  direction: SortDirection;
}

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = "table" | "json" | "grid";

export interface ViewState {
  /** Current view mode */
  mode: ViewMode;
  /** Columns to display */
  columns: ColumnSchema[];
  /** Current sort state */
  sort: SortState | null;
  /** Filter state */
  filters: FilterState;
  /** Page size */
  pageSize: number;
  /** Current page (1-indexed) */
  currentPage: number;
}

// ============================================================================
// Data Types
// ============================================================================

export interface DataRow {
  /** Unique row identifier */
  _rowId: string;
  /** Row data */
  [key: string]: any;
}

export interface DataResult {
  /** Data rows */
  rows: DataRow[];
  /** Total count (before pagination) */
  total: number;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total pages */
  totalPages: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = "csv" | "json" | "excel";

export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Include all data or just visible */
  scope: "all" | "filtered" | "selected";
  /** Columns to include */
  columns?: string[];
  /** Include headers */
  includeHeaders: boolean;
}

// ============================================================================
// Database Types
// ============================================================================

export type DatabaseType =
  | "mongodb"
  | "postgres"
  | "mysql"
  | "sqlite"
  | "mssql"
  | "oracle"
  | "redis";

export interface DatabaseInfo {
  /** Database type */
  type: DatabaseType;
  /** Connection name */
  name: string;
  /** Selected table/collection */
  table: string;
  /** Is NoSQL database */
  isNoSQL: boolean;
}

// ============================================================================
// API Types
// ============================================================================

export interface DataQueryParams {
  /** Table or collection name */
  table: string;
  /** Page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Sort configuration */
  sort?: SortState;
  /** Filter configuration */
  filters?: FilterState;
  /** Columns to fetch */
  columns?: string[];
}

export interface DataQueryResponse {
  /** Query results */
  data: DataResult;
  /** Column schema information */
  schema?: ColumnSchema[];
  /** Execution time in ms */
  executionTime?: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface AdvancedDataViewerProps {
  /** Database information */
  database: DatabaseInfo;
  /** Initial data (optional) */
  initialData?: DataRow[];
  /** Initial total count */
  initialTotal?: number;
  /** On data change callback */
  onDataChange?: (data: DataResult) => void;
  /** On error callback */
  onError?: (error: Error) => void;
  /** Custom CSS class */
  className?: string;
  /** Enable/disable features */
  features?: {
    export?: boolean;
    filter?: boolean;
    sort?: boolean;
    search?: boolean;
    statistics?: boolean;
    viewToggle?: boolean;
    columnInsights?: boolean;
  };
}

// ============================================================================
// Column Insights Types (for data quality and interactive visualizations)
// ============================================================================

export interface ValueDistribution {
  /** The actual value */
  value: any;
  /** Display label for the value */
  label: string;
  /** Count of occurrences */
  count: number;
  /** Percentage of total */
  percentage: number;
  /** Color for visualization */
  color?: string;
}

export interface DataQualityMetrics {
  /** Total rows analyzed */
  total: number;
  /** Non-null values count */
  valid: number;
  /** Null/undefined values count */
  missing: number;
  /** Invalid values count (e.g., malformed dates, non-numeric strings) */
  invalid: number;
  /** Duplicate values count */
  duplicates: number;
  /** Unique values count */
  unique: number;
  /** Completeness percentage (0-100) */
  completeness: number;
  /** Validity percentage (0-100) */
  validity: number;
  /** Uniqueness percentage (0-100) */
  uniqueness: number;
}

export interface NumericDistribution {
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Average value */
  avg: number;
  /** Median value */
  median: number;
  /** Standard deviation */
  stdDev?: number;
  /** Histogram buckets for distribution */
  buckets: Array<{
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }>;
}

export interface ColumnInsights {
  /** Column identifier */
  columnId: string;
  /** Column name */
  columnName: string;
  /** Data type */
  dataType: ColumnDataType;
  /** Data quality metrics */
  quality: DataQualityMetrics;
  /** Value distribution (for categorical data) */
  valueDistribution?: ValueDistribution[];
  /** Numeric distribution (for numeric data) */
  numericDistribution?: NumericDistribution;
  /** Date range (for date columns) */
  dateRange?: {
    earliest: string;
    latest: string;
    distribution: Array<{ period: string; count: number }>;
  };
  /** Sample invalid values */
  invalidSamples?: any[];
  /** Is data sampled (for performance with large datasets) */
  isSampled: boolean;
  /** Sample size if sampled */
  sampleSize?: number;
}

export type ChartType = "bar" | "pie" | "histogram" | "list" | "heatmap";

export interface ChartConfig {
  /** Type of chart to display */
  type: ChartType;
  /** Maximum items to show before truncating */
  maxItems: number;
  /** Show percentages */
  showPercentages: boolean;
  /** Show counts */
  showCounts: boolean;
  /** Color scheme */
  colorScheme?: string[];
}

export interface InsightsPopoverProps {
  /** Column schema */
  column: ColumnSchema;
  /** Column insights data */
  insights: ColumnInsights;
  /** Current filter state */
  currentFilters?: FilterCondition[];
  /** Callback when filter is applied from chart */
  onApplyFilter: (
    columnId: string,
    operator: FilterOperator,
    value: any
  ) => void;
  /** Callback when filter is removed */
  onRemoveFilter: (columnId: string) => void;
  /** Is popover open */
  isOpen: boolean;
  /** Callback to close popover */
  onClose: () => void;
}
