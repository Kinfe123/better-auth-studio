import { useState, useEffect } from "react";

export interface FieldSchema {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
}

export interface TableSchema {
  name: string;
  fields: FieldSchema[];
  origin: string;
}

const STANDARD_FIELDS: Record<string, string[]> = {
  user: ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt", "role", "banned", "banReason", "banExpires"],
  organization: ["id", "name", "slug", "logo", "createdAt", "updatedAt", "metadata"],
  team: ["id", "name", "organizationId", "createdAt", "updatedAt", "metadata"],
  member: ["id", "organizationId", "userId", "role", "createdAt", "updatedAt"],
  teamMember: ["id", "teamId", "userId", "role", "createdAt", "updatedAt"],
  invitation: ["id", "organizationId", "email", "role", "status", "expiresAt", "inviterId", "teamId"],
};

export const useSchemaFields = (modelName: string) => {
  const [fields, setFields] = useState<FieldSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch("/api/database/schema");
        const data = await response.json();

        if (data.success && data.schema?.tables) {
          const table = data.schema.tables.find(
            (t: any) => t.name === modelName || t.contextKey === modelName
          );
          if (table) {
            const standardFields = STANDARD_FIELDS[modelName] || [];
            const additionalFields = table.fields.filter(
              (f: any) => !standardFields.includes(f.name)
            );
            setFields(additionalFields);
          }
        } else {
          setError(data.error || "Failed to load schema");
        }
      } catch (err) {
        setError("Failed to fetch schema");
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [modelName]);

  return { fields, loading, error };
};
