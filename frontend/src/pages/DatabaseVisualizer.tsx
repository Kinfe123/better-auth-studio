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
import { Settings, X } from 'lucide-react';
import { DatabaseSchemaNode, type DatabaseSchemaNodeData } from '../components/DatabaseSchemaNode';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Analytics } from '@/components/PixelIcons';
import { Button } from '../components/ui/button';

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
  origin?: string;
  fields: Field[];
  relationships: Relationship[];
}

interface Schema {
  tables: Table[];
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface PluginContribution {
  pluginId: string;
  pluginName: string;
  tableCount: number;
  fieldCount: number;
  relationshipCount: number;
}

export default function DatabaseVisualizer() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledPlugins, setEnabledPlugins] = useState<Plugin[]>([]);
  const [pluginContributions, setPluginContributions] = useState<PluginContribution[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedTable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTable]);

  const fetchEnabledPlugins = useCallback(async () => {
    try {
      const response = await fetch('/api/plugins');
      const data = await response.json();
      if (data.plugins && Array.isArray(data.plugins)) {
        setEnabledPlugins(data.plugins.filter((p: Plugin) => p.enabled));
      }
    } catch (_err) {
      // Ignore plugin fetch errors
    }
  }, []);

  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/database/schema`);
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
    fetchSchema();
  }, [fetchEnabledPlugins, fetchSchema]);

  useEffect(() => {
    if (!schema || enabledPlugins.length === 0) {
      setPluginContributions([]);
      return;
    }

    const contributions: PluginContribution[] = enabledPlugins.map((plugin) => {
      const pluginTables = schema.tables.filter(
        (table) => (table.origin || 'core') === plugin.id
      );

      const tableCount = pluginTables.length;
      const fieldCount = pluginTables.reduce((sum, table) => sum + table.fields.length, 0);
      const relationshipCount = pluginTables.reduce(
        (sum, table) => sum + table.relationships.length,
        0
      );

      return {
        pluginId: plugin.id,
        pluginName: plugin.name || plugin.id,
        tableCount,
        fieldCount,
        relationshipCount,
      };
    });

    // Only show plugins that actually contribute to the schema
    setPluginContributions(contributions.filter((c) => c.tableCount > 0));
  }, [schema, enabledPlugins]);

  useEffect(() => {
    if (!schema) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    schema.tables.forEach((table, index) => {
      const tableOrigin = table.origin || 'core';
      const columns = table.fields.map((field) => ({
        id: `${table.name}-${field.name}`,
        isPrimary: field.primaryKey || false,
        isNullable: !field.required,
        isUnique: field.unique || false,
        isIdentity: false,
        name: field.name,
        format: field.type,
        plugin: tableOrigin,
        description: field.description,
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
          plugin: tableOrigin,
          columns,
          relationships: table.relationships,
        } as DatabaseSchemaNodeData,
      });
    });

    schema.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        const sourceTable = table.name;
        const targetTable = rel.target;

        const sourceNode = newNodes.find((n) => n.id === sourceTable);
        const targetNode = newNodes.find((n) => n.id === targetTable);

        if (sourceNode && targetNode) {
          const relationshipLabel =
            rel.type === 'one-to-one' ? '1:1' : rel.type === 'many-to-one' ? 'N:1' : '1:N';

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
              borderRadius: 4,
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
  }, [schema, setNodes, setEdges]);

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
        <div className="text-center text-gray-500 dark:text-gray-400 mt-4">Loading schema...</div>
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

  const mainContent = (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between p-5 pt-7">
          <div>
            <h1 className="text-3xl font-normal text-white tracking-tight">Schema Visualizer</h1>
            <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
              Visualize your Better Auth database schema with interactive tables and relationships.
            </p>
          </div>
        </div>
        <div className='flex flex-col items-center space-y-8 mb-4'>
          <hr className="w-full border-white/15 h-px" />
          <hr className="w-full border-white/15 h-px" />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-6 mt-6">
        <div className="col-span-1 space-y-4">
          <Card className="rounded-none bg-black h-fit shadow-sm border border-white/15">
            <CardHeader className='border-b border-white/15 pb-3 -pt-2 mb-2'>
              <CardTitle className="font-light text-xl text-white flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className='uppercase font-mono text-xs tracking-tight'>Detected Tables</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {schema && schema.tables.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scroll">
                  {schema.tables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => setSelectedTable(table)}
                      className="w-full text-left border border-white/10 p-3 rounded-none hover:border-white/20 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm text-white">
                        <span>{table.displayName}</span>
                        <span className="text-xs uppercase font-mono text-gray-400">
                          {table.origin === 'core' ? 'Core' : 'Extended'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {table.fields.length} fields · {table.relationships.length} relationships
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/70">No tables detected in Better Auth context</div>
              )}
            </CardContent>
          </Card>

          {schema && (
            <Card className="rounded-none bg-black shadow-sm border border-white/15">
              <CardHeader className='border-b border-white/15 pb-3 -pt-2 mb-2'>
                <CardTitle className="font-light text-xl text-white flex items-center space-x-2">
                  <Analytics className="w-4 h-4" />
                  <span className='uppercase font-mono text-xs tracking-tight'>Schema Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Tables</span>
                  <span className="text-white">{schema.tables.length}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Total Fields</span>
                  <span className="text-white">
                    {schema.tables.reduce((sum, table) => sum + table.fields.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Relationships</span>
                  <span className="text-white">
                    {schema.tables.reduce((sum, table) => sum + table.relationships.length, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {pluginContributions.length > 0 && (
            <Card className="rounded-none bg-black shadow-sm border border-white/15">
              <CardHeader>
                <CardTitle className="text-white text-sm">Enabled Plugins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {pluginContributions.map((contribution) => (
                  <div
                    key={contribution.pluginId}
                    className="p-3 border border-white/15 bg-black/40 rounded-none"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium capitalize">
                        {contribution.pluginName}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Tables:</span>
                        <span className="text-white/80">{contribution.tableCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fields:</span>
                        <span className="text-white/80">{contribution.fieldCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relationships:</span>
                        <span className="text-white/80">{contribution.relationshipCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-3">
          <div className="h-full bg-black border border-white/20 rounded-lg overflow-hidden shadow-xl">
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
              <Controls className="bg-gray-900 border-white/20 [&>button]:bg-gray-800 [&>button]:border-gray-600 [&>button]:text-white [&>button:hover]:bg-gray-700" />
              <MiniMap
                className="bg-gray-900 border-white/20"
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

  return (
    <div className="h-screen flex flex-col bg-black">
      {mainContent}
      
      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedTable(null)}>
          <div 
            className="bg-black border border-dashed border-white/20 rounded-none p-5 w-full max-w-3xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-light text-white">{selectedTable.displayName}</h3>
                <p className="text-xs text-gray-400 mt-0.5 uppercase font-mono">
                  {selectedTable.name} · {selectedTable.origin === 'core' ? 'Core' : 'Extended'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTable(null)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <hr className="border-white/20 border-dashed mb-4" />

            {/* Fields Section */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-mono text-gray-400 mb-3 tracking-wider">Fields</h4>
              <div className="space-y-0">
                {selectedTable.fields.map((field, index) => (
                  <div
                    key={field.name}
                    className={`border-b border-dashed border-white/10 py-3 ${index === selectedTable.fields.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono text-sm">{field.name}</span>
                        {field.primaryKey && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                            PK
                          </span>
                        )}
                        {field.unique && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                            UNIQUE
                          </span>
                        )}
                        {!field.required && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                            NULLABLE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono uppercase">{field.type}</span>
                    </div>
                    <div className="ml-0 space-y-0.5">
                      {field.description && (
                        <p className="text-xs text-gray-500 font-light">{field.description}</p>
                      )}
                      {field.defaultValue !== undefined && (
                        <p className="text-xs text-gray-500 font-mono">
                          Default: <span className="text-gray-400">{String(field.defaultValue)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTable.relationships.length > 0 && (
              <div className="mb-6">
                <hr className="border-white/10 border-dashed mb-4" />
                <h4 className="text-xs uppercase font-mono text-gray-400 mb-3 tracking-wider">Relationships</h4>
                <div className="space-y-0">
                  {selectedTable.relationships.map((rel, index) => {
                    const targetTable = schema?.tables.find((t) => t.name === rel.target);
                    const relationshipLabel =
                      rel.type === 'one-to-one' ? '1:1' : rel.type === 'many-to-one' ? 'N:1' : '1:N';
                    
                    return (
                      <div
                        key={`${rel.target}-${rel.field}-${index}`}
                        className={`border-b border-dashed border-white/10 py-3 ${index === selectedTable.relationships.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-mono text-sm">{rel.field}</span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-white font-mono text-sm">
                              {targetTable?.displayName || rel.target}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                            {relationshipLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono uppercase ml-0">
                          {rel.type.replace('-', ' ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-white/20 pt-3 mt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 uppercase font-mono text-xs">Fields</span>
                  <p className="text-white mt-0.5 text-sm">{selectedTable.fields.length}</p>
                </div>
                <div className="border-l border-dashed border-white/20 pl-4">
                  <span className="text-gray-400 uppercase font-mono text-xs">Relationships</span>
                  <p className="text-white mt-0.5 text-sm">{selectedTable.relationships.length}</p>
                </div>
                <div className="border-l border-dashed border-white/20 pl-4">
                  <span className="text-gray-400 uppercase font-mono text-xs">Origin</span>
                  <p className="text-white mt-0.5 text-sm uppercase font-mono">
                    {selectedTable.origin === 'core' ? 'Core' : 'Extended'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
