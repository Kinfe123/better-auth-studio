import { useCallback, useEffect, useState } from "react";

export interface DatabaseSchemaSummary {
  tableCount: number;
  coreTableCount: number;
  pluginTableCount: number;
  fieldCount: number;
  relationshipCount: number;
}

export interface DatabaseSchemaField {
  name: string;
  type: string;
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  description: string;
}

export interface DatabaseSchemaRelationship {
  type: "one-to-many" | "many-to-one" | "one-to-one";
  target: string;
  field: string;
}

export interface DatabaseSchemaTable {
  name: string;
  model?: string;
  displayName: string;
  origin?: string;
  rowCount?: number | null;
  fields: DatabaseSchemaField[];
  relationships: DatabaseSchemaRelationship[];
}

interface DatabaseSchemaResponse {
  success?: boolean;
  summary?: DatabaseSchemaSummary | null;
  schema?: {
    tables?: DatabaseSchemaTable[];
  } | null;
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
  const [tables, setTables] = useState<DatabaseSchemaTable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/database/schema");
      const data = (await response.json()) as DatabaseSchemaResponse;

      if (data.success && data.summary) {
        setSummary(data.summary);
        setTables(data.schema?.tables || []);
      } else {
        setSummary(EMPTY_SUMMARY);
        setTables([]);
      }
    } catch (_error) {
      setSummary(EMPTY_SUMMARY);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    tables,
    loading,
    refetch: fetchSummary,
  };
}
