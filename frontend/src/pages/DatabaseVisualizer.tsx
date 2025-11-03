import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { Database, Settings, Sparkles } from 'lucide-react';
import { DatabaseSchemaNode, type DatabaseSchemaNodeData } from '../components/DatabaseSchemaNode';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const nodeTypes = {
  databaseSchemaNode: DatabaseSchemaNode,
};

interface Field {
  name: string;
  type: string;
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  description: string;
}

interface Relationship {
  type: 'one-to-many' | 'many-to-one' | 'one-to-one';
  target: string;
  field: string;
}

interface Table {
  name: string;
  displayName: string;
  fields: Field[];
  relationships: Relationship[];
}

interface Schema {
  tables: Table[];
}

interface PluginInfo {
  name: string;
  displayName: string;
  description: string;
  color: string;
}

const AVAILABLE_PLUGINS: PluginInfo[] = [
  {
    name: 'organization',
    displayName: 'Organization',
    description: 'Multi-tenant organization support',
    color: 'bg-blue-500',
  },
  {
    name: 'teams',
    displayName: 'Teams',
    description: 'Team management within organizations',
    color: 'bg-green-500',
  },
  {
    name: 'twoFactor',
    displayName: 'Two Factor',
    description: 'Two-factor authentication support',
    color: 'bg-purple-500',
  },
  {
    name: 'apiKey',
    displayName: 'API Key',
    description: 'API key authentication',
    color: 'bg-orange-500',
  },
  {
    name: 'passkey',
    displayName: 'Passkey',
    description: 'WebAuthn passkey support',
    color: 'bg-pink-500',
  },
];

// Feature flag to enable/disable the "Coming Soon" overlay
const SHOW_COMING_SOON_OVERLAY = true;

export default function DatabaseVisualizer() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<PluginInfo[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const getPluginColor = useCallback((pluginId: string): string => {
    const plugin = AVAILABLE_PLUGINS.find((p) => p.name === pluginId);
    return plugin?.color || 'bg-gray-500';
  }, []);

  const getPluginForField = useCallback(
    (tableName: string, _fieldName: string, plugins: string[]): string => {
      if (
        tableName === 'user' ||
        tableName === 'session' ||
        tableName === 'account' ||
        tableName === 'verification'
      ) {
        return 'core';
      }

      for (const plugin of plugins) {
        if (tableName === plugin || tableName.includes(plugin)) {
          return plugin;
        }
      }

      return 'core';
    },
    []
  );

  const fetchEnabledPlugins = useCallback(async () => {
    try {
      const response = await fetch('/api/plugins');
      const data = await response.json();

      if (data.plugins && Array.isArray(data.plugins)) {
        const enabledPlugins = data.plugins.map((plugin: any) => ({
          name: plugin.id,
          displayName: plugin.name || plugin.id,
          description: plugin.description || `${plugin.id} plugin for Better Auth`,
          color: getPluginColor(plugin.id),
        }));

        setAvailablePlugins(enabledPlugins);
        setSelectedPlugins(enabledPlugins.map((p: any) => p.name));
      }
    } catch (_err) {
      setAvailablePlugins(AVAILABLE_PLUGINS);
      setSelectedPlugins(['organization']);
    }
  }, [getPluginColor]);

  const fetchSchema = useCallback(async (plugins: string[]) => {
    try {
      setLoading(true);
      const pluginParams = plugins.length > 0 ? `?plugins=${plugins.join(',')}` : '';
      const response = await fetch(`/api/database/schema${pluginParams}`);
      const data = await response.json();

      if (data.success) {
        setSchema(data.schema);
      } else {
        setError(data.error || 'Failed to fetch schema');
      }
    } catch (_err) {
      setError('Failed to fetch database schema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnabledPlugins();
  }, [fetchEnabledPlugins]);

  useEffect(() => {
    if (selectedPlugins.length > 0) {
      fetchSchema(selectedPlugins);
    }
  }, [selectedPlugins, fetchSchema]);

  useEffect(() => {
    if (!schema) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    schema.tables.forEach((table, index) => {
      const columns = table.fields.map((field) => ({
        id: `${table.name}-${field.name}`,
        isPrimary: field.primaryKey || false,
        isNullable: !field.required,
        isUnique: field.unique || false,
        isIdentity: false,
        name: field.name,
        format: field.type,
        plugin: getPluginForField(table.name, field.name, selectedPlugins),
      }));

      newNodes.push({
        id: table.name,
        type: 'databaseSchemaNode',
        position: {
          x: (index % 3) * 380,
          y: Math.floor(index / 3) * 320,
        },
        data: {
          name: table.name,
          displayName: table.displayName,
          isForeign: false,
          plugin: getPluginForField(table.name, '', selectedPlugins),
          columns: columns.map((col) => ({
            ...col,
            description: table.fields.find((f) => f.name === col.name)?.description || '',
          })),
          relationships: table.relationships,
        } as DatabaseSchemaNodeData,
      });
    });

    schema.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        if (rel.type === 'many-to-one') {
          return;
        }

        const sourceTable = table.name;
        const targetTable = rel.target;

        const sourceNode = newNodes.find((n) => n.id === sourceTable);
        const targetNode = newNodes.find((n) => n.id === targetTable);

        if (sourceNode && targetNode) {
          const relationshipLabel = rel.type === 'one-to-one' ? '1:1' : '1:N';

          newEdges.push({
            id: `${sourceTable}-${targetTable}-${rel.field}`,
            source: sourceTable,
            target: targetTable,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#6b7280',
              strokeWidth: 2,
              strokeDasharray: '0',
            },
            label: relationshipLabel,
            labelStyle: {
              fontSize: '11px',
              fill: '#9ca3af',
              fontWeight: '500',
            },
            labelBgStyle: {
              fill: 'rgba(0, 0, 0, 0.9)',
              fillOpacity: 1,
              // @ts-expect-error
              rx: 4,
              ry: 4,
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#6b7280',
              width: 12,
              height: 12,
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [schema, selectedPlugins, setNodes, setEdges, getPluginForField]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // const handlePluginToggle = (pluginName: string, checked: boolean) => {
  //   if (checked) {
  //     setSelectedPlugins((prev) => [...prev, pluginName]);
  //   } else {
  //     setSelectedPlugins((prev) => prev.filter((p) => p !== pluginName));
  //   }
  // };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
          Loading plugins and schema...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/20 rounded-none p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Schema</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  // Render the main content
  const mainContent = (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-light text-white">Schema Visualizer</h1>
          </div>
        </div>
        <p className="text-gray-400">
          Visualize your Better Auth database schema with interactive tables and relationships.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <Card className="rounded-none bg-black h-fit shadow-sm">
            <CardHeader>
              <CardTitle className="font-light text-xl text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Plugins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availablePlugins.length > 0 ? (
                availablePlugins.map((plugin) => (
                  <div key={plugin.name} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${plugin.color}`} />
                    <label
                      htmlFor={plugin.name}
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      {plugin.displayName.slice(0, 1).toUpperCase() +
                        plugin.displayName.slice(1).replace('-', ' ')}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/70">No plugins detected in configuration</div>
              )}
            </CardContent>
          </Card>

          {schema && (
            <Card className="rounded-none bg-black mt-4 shadow-sm">
              <CardHeader>
                <CardTitle className="text-white text-sm">Schema Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Tables:</span>
                  <span className="text-white">{schema.tables.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Relationships:</span>
                  <span className="text-white">
                    {schema.tables.reduce((sum, table) => sum + table.relationships.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Available Plugins:</span>
                  <span className="text-white">{availablePlugins.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Selected Plugins:</span>
                  <span className="text-white">{selectedPlugins.length}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-3">
          <div className="h-full bg-black border border-gray-700 rounded-lg overflow-hidden shadow-xl">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{
                padding: 0.1,
                includeHiddenNodes: false,
              }}
              className="bg-black"
              // @ts-expect-error
              connectionLineType="smoothstep"
              defaultEdgeOptions={{
                style: {
                  stroke: '#6b7280',
                  strokeWidth: 2,
                },
                animated: false,
                type: 'smoothstep',
              }}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
            >
              <Controls className="bg-gray-900 border-gray-700 [&>button]:bg-gray-800 [&>button]:border-gray-600 [&>button]:text-white [&>button:hover]:bg-gray-700" />
              <MiniMap
                className="bg-gray-900 border-gray-700"
                nodeColor={(node) => {
                  if (node.data?.isForeign) return '#374151';
                  return '#1f2937';
                }}
                maskColor="rgba(0, 0, 0, 0.9)"
              />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
            </ReactFlow>
          </div>
        </div>
      </div>
    </>
  );
  if (SHOW_COMING_SOON_OVERLAY) {
    return (
      <div className="overflow-hidden p-6 h-[90vh] flex flex-col opacity-70 bg-black relative">
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
          />
          <div className="relative -mt-6 bg-black/50 border border-dashed border-white/20 rounded-none p-12 max-w-2xl mx-6 text-center pointer-events-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Database className="w-16 h-16 text-white opacity-50" />
                <Sparkles className="w-8 h-8 text-white absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-mono uppercase font-light text-white mb-3">Coming Soon</h2>
            <p className="text-lg text-gray-300 font-light mb-6 leading-relaxed">
              We're working hard to bring you an interactive database schema visualizer. This
              feature will allow you to explore your Better Auth database structure with beautiful,
              interactive graphs showing all tables, relationships, and data flow.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Interactive Tables</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Relationship Mapping</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blurred Content Behind */}
        <div className="blur-sm opacity-50 pointer-events-none">{mainContent}</div>
      </div>
    );
  }

  return <div className="p-6 h-screen flex flex-col bg-black">{mainContent}</div>;
}
