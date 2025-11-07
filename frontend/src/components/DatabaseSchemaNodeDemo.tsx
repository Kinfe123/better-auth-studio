import { DatabaseSchemaNode, type DatabaseSchemaNodeData } from './DatabaseSchemaNode';

const demoSchemaData: DatabaseSchemaNodeData = {
  id: 'demo-user-table',
  name: 'user',
  displayName: 'User',
  isForeign: false,
  plugin: 'core',
  columns: [
    {
      id: 'user-id',
      isPrimary: true,
      isNullable: false,
      isUnique: true,
      isIdentity: false,
      name: 'id',
      format: 'string',
      plugin: 'core',
      description: 'Unique user identifier',
    },
    {
      id: 'user-name',
      isPrimary: false,
      isNullable: false,
      isUnique: false,
      isIdentity: false,
      name: 'name',
      format: 'string',
      plugin: 'core',
      description: 'User display name',
    },
    {
      id: 'user-email',
      isPrimary: false,
      isNullable: false,
      isUnique: true,
      isIdentity: false,
      name: 'email',
      format: 'string',
      plugin: 'core',
      description: 'User email address',
    },
    {
      id: 'user-emailVerified',
      isPrimary: false,
      isNullable: false,
      isUnique: false,
      isIdentity: false,
      name: 'emailVerified',
      format: 'boolean',
      plugin: 'core',
      description: 'Email verification status',
    },
    {
      id: 'user-image',
      isPrimary: false,
      isNullable: true,
      isUnique: false,
      isIdentity: false,
      name: 'image',
      format: 'string',
      plugin: 'core',
      description: 'User profile image URL',
    },
    {
      id: 'user-createdAt',
      isPrimary: false,
      isNullable: false,
      isUnique: false,
      isIdentity: false,
      name: 'createdAt',
      format: 'date',
      plugin: 'core',
      description: 'Account creation timestamp',
    },
  ],
  relationships: [
    {
      type: 'one-to-many',
      target: 'session',
      field: 'userId',
    },
    {
      type: 'one-to-many',
      target: 'account',
      field: 'userId',
    },
  ],
};

const organizationSchemaData: DatabaseSchemaNodeData = {
  id: 'demo-organization-table',
  name: 'organization',
  displayName: 'Organization',
  isForeign: false,
  plugin: 'organization',
  columns: [
    {
      id: 'org-id',
      isPrimary: true,
      isNullable: false,
      isUnique: true,
      isIdentity: false,
      name: 'id',
      format: 'string',
      plugin: 'organization',
      description: 'Unique organization identifier',
    },
    {
      id: 'org-name',
      isPrimary: false,
      isNullable: false,
      isUnique: false,
      isIdentity: false,
      name: 'name',
      format: 'string',
      plugin: 'organization',
      description: 'Organization name',
    },
    {
      id: 'org-slug',
      isPrimary: false,
      isNullable: false,
      isUnique: true,
      isIdentity: false,
      name: 'slug',
      format: 'string',
      plugin: 'organization',
      description: 'Organization URL slug',
    },
  ],
  relationships: [
    {
      type: 'one-to-many',
      target: 'member',
      field: 'organizationId',
    },
  ],
};

export default function DatabaseSchemaNodeDemo() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-4">Database Schema Node Demo</h1>
          <p className="text-gray-400">
            Enhanced database schema nodes with dark mode theming, collapsible views, and detailed
            tooltips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl text-white mb-4">Core User Table</h2>
            <DatabaseSchemaNode
              data={demoSchemaData}
              // @ts-expect-error
              targetPosition="left"
              // @ts-expect-error
              sourcePosition="right"
            />
          </div>

          <div>
            <h2 className="text-xl text-white mb-4">Organization Plugin Table</h2>
            <DatabaseSchemaNode
              data={organizationSchemaData}
              // @ts-expect-error
              targetPosition="left"
              // @ts-expect-error
              sourcePosition="right"
            />
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-lg text-white mb-4">Features</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              • <strong>Dark Mode Optimized:</strong> Designed specifically for dark themes
            </li>
            <li>
              • <strong>Collapsible Views:</strong> Click the header to collapse/expand table
              contents
            </li>
            <li>
              • <strong>Detail Toggle:</strong> Show/hide column descriptions with the eye icon
            </li>
            <li>
              • <strong>Plugin Badges:</strong> Color-coded plugin indicators
            </li>
            <li>
              • <strong>Interactive Icons:</strong> Hover tooltips for primary keys, unique
              constraints, etc.
            </li>
            <li>
              • <strong>Relationship Counter:</strong> Shows number of relationships in footer
            </li>
            <li>
              • <strong>Connection Handles:</strong> Invisible handles for React Flow connections
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
