import { useState, useEffect, useCallback } from "react";
import { AnyDatabaseConfig } from "@/lib/types/datasource";
import {
  getDatasources,
  createDatasource,
  updateDatasource,
  deleteDatasource,
  testDatasourceConnection,
  getDatasourceStats,
  configToPayload,
  payloadToConfig,
  type TestConnectionResult,
  type DatasourceStats,
} from "@/lib/api/datasources";

interface UseDatasourcesOptions {
  type?: string;
  environment?: string;
  autoLoad?: boolean;
}

interface UseDatasourcesReturn {
  datasources: AnyDatabaseConfig[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (config: AnyDatabaseConfig) => Promise<AnyDatabaseConfig>;
  update: (id: string, config: AnyDatabaseConfig) => Promise<AnyDatabaseConfig>;
  remove: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<TestConnectionResult>;
  getStats: (id: string) => Promise<DatasourceStats>;
}

export function useDatasources(
  options: UseDatasourcesOptions = {}
): UseDatasourcesReturn {
  const { type, environment, autoLoad = true } = options;
  const [datasources, setDatasources] = useState<AnyDatabaseConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDatasources({ type, environment });
      const configs = response.map(payloadToConfig);
      setDatasources(configs);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch datasources");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [type, environment]);

  const create = useCallback(
    async (config: AnyDatabaseConfig): Promise<AnyDatabaseConfig> => {
      try {
        const payload = configToPayload(config);
        const response = await createDatasource(payload);
        const newConfig = payloadToConfig(response);

        setDatasources((prev) => [...prev, newConfig]);
        return newConfig;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create datasource");
        setError(error);
        throw error;
      }
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      config: AnyDatabaseConfig
    ): Promise<AnyDatabaseConfig> => {
      try {
        const payload = configToPayload(config);
        const response = await updateDatasource(id, payload);
        const updatedConfig = payloadToConfig(response);

        setDatasources((prev) =>
          prev.map((ds) => (ds.id === id ? updatedConfig : ds))
        );
        return updatedConfig;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update datasource");
        setError(error);
        throw error;
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDatasource(id);
      setDatasources((prev) => prev.filter((ds) => ds.id !== id));
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete datasource");
      setError(error);
      throw error;
    }
  }, []);

  const testConnection = useCallback(
    async (id: string): Promise<TestConnectionResult> => {
      try {
        return await testDatasourceConnection(id);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to test connection");
        setError(error);
        throw error;
      }
    },
    []
  );

  const getStats = useCallback(async (id: string): Promise<DatasourceStats> => {
    try {
      return await getDatasourceStats(id);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to get stats");
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refetch();
    }
  }, [autoLoad, refetch]);

  return {
    datasources,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
    testConnection,
    getStats,
  };
}
