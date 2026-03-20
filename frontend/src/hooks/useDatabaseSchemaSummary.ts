import { useCallback, useEffect, useState } from "react";

export interface DatabaseSchemaSummary {
  tableCount: number;
  coreTableCount: number;
  pluginTableCount: number;
  fieldCount: number;
  relationshipCount: number;
}

interface DatabaseSchemaResponse {
  success?: boolean;
  summary?: DatabaseSchemaSummary | null;
}

const EMPTY_SUMMARY: DatabaseSchemaSummary = {
  tableCount: 0,
  coreTableCount: 0,
  pluginTableCount: 0,
  fieldCount: 0,
  relationshipCount: 0,
};

export function useDatabaseSchemaSummary() {
  const [summary, setSummary] = useState<DatabaseSchemaSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/database/schema");
      const data = (await response.json()) as DatabaseSchemaResponse;

      if (data.success && data.summary) {
        setSummary(data.summary);
      } else {
        setSummary(EMPTY_SUMMARY);
      }
    } catch (_error) {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    refetch: fetchSummary,
  };
}
