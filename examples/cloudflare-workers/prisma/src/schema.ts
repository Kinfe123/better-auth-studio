type Field = {
  name: string;
  type: string;
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  description: string;
};

type Relationship = {
  type: "one-to-many" | "many-to-one" | "one-to-one";
  target: string;
  field: string;
};

type Table = {
  name: string;
  model: string;
  displayName: string;
  origin: "core" | "organization" | "admin";
  rowCount?: number | null;
  fields: Field[];
  relationships: Relationship[];
};

const coreFields = {
  id: { name: "id", type: "String", required: true, primaryKey: true, description: "Primary key" },
  createdAt: {
    name: "createdAt",
    type: "DateTime",
    required: true,
    description: "Creation timestamp",
  },
  updatedAt: {
    name: "updatedAt",
    type: "DateTime",
    required: true,
    description: "Last update timestamp",
  },
} satisfies Record<string, Field>;

export function createDatabaseSchema(rowCounts: Record<string, number>) {
  const tables: Table[] = [
    {
      name: "user",
      model: "User",
      displayName: "User",
      origin: "core",
      rowCount: rowCounts.user ?? null,
      fields: [
        coreFields.id,
        { name: "name", type: "String", required: true, description: "Display name" },
        { name: "email", type: "String", required: true, unique: true, description: "Email" },
        {
          name: "emailVerified",
          type: "Boolean",
          required: true,
          description: "Email verification status",
        },
        { name: "image", type: "String", required: false, description: "Avatar URL" },
        { name: "role", type: "String", required: false, description: "Admin role" },
        { name: "banned", type: "Boolean", required: false, description: "Ban state" },
        { name: "lastSeenAt", type: "DateTime", required: false, description: "Last seen time" },
        coreFields.createdAt,
        coreFields.updatedAt,
      ],
      relationships: [
        { type: "one-to-many", target: "session", field: "sessions" },
        { type: "one-to-many", target: "account", field: "accounts" },
      ],
    },
    {
      name: "session",
      model: "Session",
      displayName: "Session",
      origin: "core",
      rowCount: rowCounts.session ?? null,
      fields: [
        coreFields.id,
        {
          name: "token",
          type: "String",
          required: true,
          unique: true,
          description: "Session token",
        },
        { name: "expiresAt", type: "DateTime", required: true, description: "Expiry" },
        { name: "ipAddress", type: "String", required: false, description: "Client IP" },
        { name: "userAgent", type: "String", required: false, description: "User agent" },
        { name: "userId", type: "String", required: true, description: "User foreign key" },
        coreFields.createdAt,
        coreFields.updatedAt,
      ],
      relationships: [{ type: "many-to-one", target: "user", field: "user" }],
    },
    {
      name: "account",
      model: "Account",
      displayName: "Account",
      origin: "core",
      rowCount: rowCounts.account ?? null,
      fields: [
        coreFields.id,
        { name: "accountId", type: "String", required: true, description: "Provider account ID" },
        { name: "providerId", type: "String", required: true, description: "Provider ID" },
        { name: "userId", type: "String", required: true, description: "User foreign key" },
        { name: "password", type: "String", required: false, description: "Credential hash" },
        coreFields.createdAt,
        coreFields.updatedAt,
      ],
      relationships: [{ type: "many-to-one", target: "user", field: "user" }],
    },
    {
      name: "organization",
      model: "Organization",
      displayName: "Organization",
      origin: "organization",
      rowCount: rowCounts.organization ?? null,
      fields: [
        coreFields.id,
        { name: "name", type: "String", required: true, description: "Organization name" },
        { name: "slug", type: "String", required: false, unique: true, description: "URL slug" },
        { name: "logo", type: "String", required: false, description: "Logo URL" },
        { name: "metadata", type: "String", required: false, description: "Metadata JSON" },
        coreFields.createdAt,
      ],
      relationships: [
        { type: "one-to-many", target: "member", field: "members" },
        { type: "one-to-many", target: "team", field: "teams" },
      ],
    },
    {
      name: "team",
      model: "Team",
      displayName: "Team",
      origin: "organization",
      rowCount: rowCounts.team ?? null,
      fields: [
        coreFields.id,
        { name: "name", type: "String", required: true, description: "Team name" },
        {
          name: "organizationId",
          type: "String",
          required: true,
          description: "Organization foreign key",
        },
        coreFields.createdAt,
      ],
      relationships: [{ type: "many-to-one", target: "organization", field: "organization" }],
    },
  ];

  const fieldCount = tables.reduce((sum, table) => sum + table.fields.length, 0);
  const relationshipCount = tables.reduce((sum, table) => sum + table.relationships.length, 0);
  const pluginTableCount = tables.filter((table) => table.origin !== "core").length;

  return {
    success: true,
    schema: { tables },
    summary: {
      tableCount: tables.length,
      coreTableCount: tables.length - pluginTableCount,
      pluginTableCount,
      fieldCount,
      relationshipCount,
    },
    availablePlugins: ["organization", "admin"],
    selectedPlugins: [],
  };
}
