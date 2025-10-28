export type DatabaseType =
  | "postgresql"
  | "mysql"
  | "mongodb"
  | "sqlite"
  | "oracle"
  | "sqlserver"
  | "snowflake"
  | "bigquery"
  | "redshift"
  | "clickhouse"
  | "mariadb"
  | "cassandra"
  | "redis"
  | "elasticsearch"
  | "saphana"
  | "vertica"
  | "trino";

export interface DatabaseConfig {
  id?: string;
  name: string;
  type: DatabaseType;
  description?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  schema?: string;
  ssl?: boolean;
  connectionTimeout?: number;
  documentation?: string;
  environment?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface PostgreSQLConfig extends DatabaseConfig {
  type: "postgresql";
  sslMode?: "disable" | "require" | "verify-ca" | "verify-full";
  maxConnections?: number;
}

export interface MySQLConfig extends DatabaseConfig {
  type: "mysql";
  charset?: string;
  timezone?: string;
}

export interface MongoDBConfig extends DatabaseConfig {
  type: "mongodb";
  authSource?: string;
  replicaSet?: string;
  tls?: boolean;
  tlsCAFile?: string;
  maxPoolSize?: number;
}

export interface SQLiteConfig extends DatabaseConfig {
  type: "sqlite";
  filePath: string;
}

export interface OracleConfig extends DatabaseConfig {
  type: "oracle";
  serviceName?: string;
  sid?: string;
}

export interface SQLServerConfig extends DatabaseConfig {
  type: "sqlserver";
  instanceName?: string;
  integratedSecurity?: boolean;
  trustServerCertificate?: boolean;
}

export interface SnowflakeConfig extends DatabaseConfig {
  type: "snowflake";
  account: string;
  warehouse?: string;
  role?: string;
}

export interface BigQueryConfig extends DatabaseConfig {
  type: "bigquery";
  projectId: string;
  keyFile?: string;
  location?: string;
}

export interface RedshiftConfig extends DatabaseConfig {
  type: "redshift";
  cluster: string;
}

export interface ClickHouseConfig extends DatabaseConfig {
  type: "clickhouse";
  httpPort?: number;
}

export interface ElasticsearchConfig extends DatabaseConfig {
  type: "elasticsearch";
  version?: string;
  apiKey?: string;
}

export interface RedisConfig extends DatabaseConfig {
  type: "redis";
  db?: number;
}

export type AnyDatabaseConfig =
  | PostgreSQLConfig
  | MySQLConfig
  | MongoDBConfig
  | SQLiteConfig
  | OracleConfig
  | SQLServerConfig
  | SnowflakeConfig
  | BigQueryConfig
  | RedshiftConfig
  | ClickHouseConfig
  | ElasticsearchConfig
  | RedisConfig
  | DatabaseConfig;

export interface DatabaseProvider {
  id: DatabaseType;
  name: string;
  description: string;
  icon: string;
  category: "relational" | "nosql" | "warehouse" | "analytics" | "cache";
  popular?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  version?: string;
}

export interface DatabaseStats {
  totalConnections: number;
  activeConnections: number;
  connectionsByType: Record<DatabaseType, number>;
  lastUpdated: Date;
}
