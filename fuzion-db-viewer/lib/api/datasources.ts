import { AnyDatabaseConfig } from "@/lib/types/datasource";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://0shfds9x-4001.inc1.devtunnels.ms";

export interface DatasourceCredentials {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connection_string?: string;
  ssl?: boolean;
  max_connections?: number;
  min_connections?: number;
  connection_timeout?: number;
  idle_timeout?: number;
  additional_params?: Record<string, any>;
  authSource?: string;
  replicaSet?: string;
  account?: string;
  warehouse?: string;
  serviceName?: string;
  db?: number;
  filePath?: string;
}

export interface DatasourceStats {
  total_connections: number;
  successful_connections: number;
  failed_connections: number;
  used_by_apis: number;
  used_by_workflows: number;
}

export interface DatasourcePayload {
  name: string;
  type: string;
  description?: string;
  credentials: DatasourceCredentials;
  environment?: string;
  tags?: string[];
  documentation?: string;
}

// API Response format matches the actual backend structure
export interface DatasourceResponse {
  _id: string;
  name: string;
  type: string;
  description?: string;
  credentials: DatasourceCredentials;
  environment?: string;
  tags?: string[];
  documentation?: string;
  status: string;
  is_active: boolean;
  is_public: boolean;
  created_by: string | null;
  stats: DatasourceStats;
  version: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  last_tested_at: string | null;
  __v: number;
}

export interface ApiListResponse {
  status: number;
  message: string;
  data: {
    datasources: DatasourceResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    filters_applied: Record<string, any>;
  };
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latency?: number;
  version?: string;
}

/**
 * Get all datasources with optional filters
 */
export async function getDatasources(params?: {
  type?: string;
  environment?: string;
}): Promise<DatasourceResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append("type", params.type);
  if (params?.environment)
    queryParams.append("environment", params.environment);

  const url = `${API_BASE_URL}/api/datasources${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

  console.log("[Datasources API] Fetching from:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      "[Datasources API] Failed to fetch:",
      response.status,
      response.statusText
    );
    throw new Error(`Failed to fetch datasources: ${response.statusText}`);
  }

  const apiResponse: ApiListResponse = await response.json();
  console.log("[Datasources API] Response:", apiResponse);
  console.log(
    "[Datasources API] Datasources count:",
    apiResponse.data.datasources.length
  );

  return apiResponse.data.datasources;
}

/**
 * Get a single datasource by ID
 */
export async function getDatasource(id: string): Promise<DatasourceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/datasources/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch datasource: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new datasource
 */
export async function createDatasource(
  payload: DatasourcePayload
): Promise<DatasourceResponse> {
  console.log("[Datasources API] Creating datasource:", payload);
  
  const response = await fetch(`${API_BASE_URL}/api/datasources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    console.error("[Datasources API] Failed to create datasource:", error);
    throw new Error(error.message || "Failed to create datasource");
  }

  const result = await response.json();
  console.log("[Datasources API] Datasource created successfully:", result);
  return result;
}

/**
 * Update an existing datasource
 */
export async function updateDatasource(
  id: string,
  payload: Partial<DatasourcePayload>
): Promise<DatasourceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/datasources/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Failed to update datasource");
  }

  return response.json();
}

/**
 * Delete a datasource
 */
export async function deleteDatasource(id: string): Promise<void> {
  console.log("[Datasources API] Deleting datasource:", id);
  
  const response = await fetch(`${API_BASE_URL}/api/datasources/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error("[Datasources API] Failed to delete datasource:", response.status, errorText);
    throw new Error(`Failed to delete datasource: ${response.statusText}`);
  }

  console.log("[Datasources API] Datasource deleted successfully:", id);
}

/**
 * Test datasource connection
 */
export async function testDatasourceConnection(
  id: string
): Promise<TestConnectionResult> {
  const response = await fetch(`${API_BASE_URL}/api/datasources/${id}/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    return {
      success: false,
      message: error.message || "Connection test failed",
    };
  }

  return response.json();
}

/**
 * Get datasource usage statistics
 */
export async function getDatasourceStats(id: string): Promise<DatasourceStats> {
  const response = await fetch(`${API_BASE_URL}/api/datasources/${id}/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch datasource stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get collections/tables from a datasource
 * This function tries the datasource-specific endpoint first,
 * then falls back to direct MongoDB API if available
 */
export async function getDatasourceCollections(id: string): Promise<string[]> {
  try {
    // First, try the datasource-specific endpoint
    const response = await fetch(
      `${API_BASE_URL}/api/datasources/${id}/collections`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.collections || [];
    }

    // If that fails, try the MongoDB API directly
    console.log(
      "[Datasources API] Datasource collections endpoint not available, trying MongoDB API"
    );

    const mongoResponse = await fetch(`${API_BASE_URL}/mongo/api/collections`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (mongoResponse.ok) {
      const data = await mongoResponse.json();
      return data.collections || [];
    }

    throw new Error("Failed to fetch collections from both endpoints");
  } catch (error) {
    console.error("[Datasources API] Error fetching collections:", error);
    throw new Error(
      `Failed to fetch datasource collections: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Convert internal config format to API payload format
 */
export function configToPayload(config: AnyDatabaseConfig): DatasourcePayload {
  const credentials: DatasourceCredentials = {
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    connection_string: config.connectionString,
    ssl: config.ssl,
    connection_timeout: config.connectionTimeout,
  };

  // Add database-specific credentials
  if (config.type === "mongodb") {
    credentials.authSource = (config as any).authSource;
    credentials.replicaSet = (config as any).replicaSet;
  } else if (config.type === "snowflake") {
    credentials.account = (config as any).account;
    credentials.warehouse = (config as any).warehouse;
  } else if (config.type === "oracle") {
    credentials.serviceName = (config as any).serviceName;
  } else if (config.type === "redis") {
    credentials.db = (config as any).db;
  } else if (config.type === "sqlite") {
    credentials.filePath = (config as any).filePath;
  }

  // Remove undefined values
  Object.keys(credentials).forEach((key) => {
    if (credentials[key as keyof DatasourceCredentials] === undefined) {
      delete credentials[key as keyof DatasourceCredentials];
    }
  });

  return {
    name: config.name,
    type: config.type,
    description: config.description,
    credentials,
    environment: config.environment || "development",
    tags: config.tags || [],
    documentation: config.documentation,
  };
}

/**
 * Convert API response to internal config format
 */
export function payloadToConfig(
  response: DatasourceResponse
): AnyDatabaseConfig {
  const baseConfig = {
    id: response._id,
    name: response.name,
    type: response.type as any,
    description: response.description,
    host: response.credentials.host,
    port: response.credentials.port,
    username: response.credentials.username,
    password: response.credentials.password,
    database: response.credentials.database,
    connectionString: response.credentials.connection_string,
    ssl: response.credentials.ssl,
    connectionTimeout: response.credentials.connection_timeout,
    documentation: response.documentation,
    environment: response.environment,
    tags: response.tags,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    isActive: response.is_active,
  };

  // Add database-specific fields based on type
  if (response.type === "mongodb") {
    return {
      ...baseConfig,
      authSource: response.credentials.authSource,
      replicaSet: response.credentials.replicaSet,
    } as any;
  } else if (response.type === "snowflake") {
    return {
      ...baseConfig,
      account: response.credentials.account || "",
      warehouse: response.credentials.warehouse,
    } as any;
  } else if (response.type === "oracle") {
    return {
      ...baseConfig,
      serviceName: response.credentials.serviceName,
    } as any;
  } else if (response.type === "redis") {
    return {
      ...baseConfig,
      db: response.credentials.db,
    } as any;
  } else if (response.type === "sqlite") {
    return {
      ...baseConfig,
      filePath: response.credentials.filePath || "",
    } as any;
  }

  return baseConfig as any;
}
