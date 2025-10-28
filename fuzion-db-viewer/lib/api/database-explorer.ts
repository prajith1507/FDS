/**
 * Database Explorer API
 * Direct database queries for exploring tables/collections and data
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

export interface DatabaseQueryParams {
  collection?: string;
  table?: string;
  page?: number;
  limit?: number;
  query?: any;
  sort?: any;
  projection?: any;
}

export interface DatabaseQueryResult {
  docs: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TableInfo {
  name: string;
  type: "table" | "view" | "collection";
  rowCount?: number;
  schema?: string;
}

/**
 * List all collections from MongoDB
 * @param datasourceId - The datasource ID to query (required for dynamic connections)
 */
export async function listMongoCollections(
  datasourceId: string
): Promise<string[]> {
  try {
    // Include datasourceId as query parameter
    const url = `${API_BASE_URL}/mongo/api/collections?datasourceId=${datasourceId}`;

    console.log("[Database Explorer] Fetching collections from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[Database Explorer] Raw API response:", data);

    // Handle both array and object responses
    let collections: string[] = [];
    if (Array.isArray(data)) {
      // Direct array response: ["collection1", "collection2"]
      collections = data;
    } else if (data.collections && Array.isArray(data.collections)) {
      // Object with collections property: { collections: [...] }
      collections = data.collections;
    }

    console.log(
      "[Database Explorer] Collections fetched:",
      collections.length,
      collections
    );
    return collections;
  } catch (error) {
    console.error("Error fetching MongoDB collections:", error);
    throw error;
  }
}

/**
 * Query MongoDB collection data
 * @param collection - The collection name
 * @param datasourceId - The datasource ID to query (required for dynamic connections)
 * @param params - Optional query parameters
 */
export async function queryMongoCollection(
  collection: string,
  datasourceId: string,
  params?: DatabaseQueryParams
): Promise<DatabaseQueryResult> {
  try {
    const queryParams = new URLSearchParams();
    // Add datasourceId first
    queryParams.append("datasourceId", datasourceId);

    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.query)
      queryParams.append("query", JSON.stringify(params.query));
    if (params?.sort) queryParams.append("sort", JSON.stringify(params.sort));

    const url = `${API_BASE_URL}/mongo/api/${collection}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to query collection: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      docs: data.docs || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      hasMore: data.hasMore || false,
    };
  } catch (error) {
    console.error("Error querying MongoDB collection:", error);
    throw error;
  }
}

/**
 * List tables from SQL database
 * @param datasourceId - The datasource ID to query
 * @param schema - Optional schema name (for PostgreSQL, etc.)
 */
export async function listSqlTables(
  datasourceId: string,
  schema?: string
): Promise<TableInfo[]> {
  try {
    const queryParams = new URLSearchParams({ datasourceId });
    if (schema) queryParams.append("schema", schema);

    const url = `${API_BASE_URL}/api/db/tables?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tables || [];
  } catch (error) {
    console.error("Error fetching SQL tables:", error);
    throw error;
  }
}

/**
 * Query SQL table data
 */
export async function querySqlTable(
  datasourceId: string,
  table: string,
  params?: {
    page?: number;
    limit?: number;
    where?: any;
    orderBy?: string;
    schema?: string;
  }
): Promise<DatabaseQueryResult> {
  try {
    const queryParams = new URLSearchParams({
      datasourceId,
      table,
    });
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.where)
      queryParams.append("where", JSON.stringify(params.where));
    if (params?.orderBy) queryParams.append("orderBy", params.orderBy);
    if (params?.schema) queryParams.append("schema", params.schema);

    const url = `${API_BASE_URL}/api/db/query?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to query table: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      docs: data.rows || data.docs || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      hasMore: data.hasMore || false,
    };
  } catch (error) {
    console.error("Error querying SQL table:", error);
    throw error;
  }
}

/**
 * Execute custom query (for advanced users)
 */
export async function executeCustomQuery(
  datasourceId: string,
  query: string,
  params?: any[]
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        datasourceId,
        query,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute query: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error executing custom query:", error);
    throw error;
  }
}

/**
 * Get table schema information
 */
export async function getTableSchema(
  datasourceId: string,
  table: string,
  schema?: string
): Promise<any> {
  try {
    const queryParams = new URLSearchParams({
      datasourceId,
      table,
    });
    if (schema) queryParams.append("schema", schema);

    const url = `${API_BASE_URL}/api/db/schema?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching table schema:", error);
    throw error;
  }
}

/**
 * Generic function to list collections/tables based on database type
 */
export async function listDatabaseObjects(
  datasourceId: string,
  databaseType: string,
  schema?: string
): Promise<string[]> {
  if (databaseType === "mongodb") {
    return listMongoCollections(datasourceId);
  } else {
    const tables = await listSqlTables(datasourceId, schema);
    return tables.map((t) => t.name);
  }
}

/**
 * Generic function to query data based on database type
 */
export async function queryDatabaseObject(
  datasourceId: string,
  databaseType: string,
  objectName: string,
  params?: DatabaseQueryParams
): Promise<DatabaseQueryResult> {
  if (databaseType === "mongodb") {
    return queryMongoCollection(objectName, datasourceId, params);
  } else {
    return querySqlTable(datasourceId, objectName, params);
  }
}
