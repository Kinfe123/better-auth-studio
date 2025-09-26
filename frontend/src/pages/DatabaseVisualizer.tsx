import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { TableNode, type TableNodeData } from '../components/TableNode';

const nodeTypes = {
  tableNode: TableNode,
};

interface Field {
  name: string;
  type: string;
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: any;
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

export default function DatabaseVisualizer() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>(['organization']);
  const [showPluginLabels, setShowPluginLabels] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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
    } catch (err) {
      setError('Failed to fetch database schema');
      console.error('Error fetching schema:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema(selectedPlugins);
  }, [selectedPlugins, fetchSchema]);

  // Convert schema to ReactFlow nodes and edges
  useEffect(() => {
    if (!schema) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create nodes for each table
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
        type: 'tableNode',
        position: {
          x: (index % 3) * 250,
          y: Math.floor(index / 3) * 200,
        },
        data: {
          name: table.name,
          isForeign: false,
          columns,
        } as TableNodeData,
      });
    });

    // Create edges for relationships
    schema.tables.forEach((table) => {
      table.relationships.forEach((rel) => {
        const sourceTable = table.name;
        const targetTable = rel.target;
        
        // Find the source and target nodes
        const sourceNode = newNodes.find(n => n.id === sourceTable);
        const targetNode = newNodes.find(n => n.id === targetTable);
        
        if (sourceNode && targetNode) {
          newEdges.push({
            id: `${sourceTable}-${targetTable}-${rel.field}`,
            source: sourceTable,
            target: targetTable,
            sourceHandle: `${sourceTable}-${rel.field}`,
            targetHandle: `${targetTable}-${rel.field}`,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#666',
              strokeWidth: 1,
              strokeDasharray: '5,5',
            },
            label: rel.type.replace('-', ' → '),
            labelStyle: {
              fontSize: '10px',
              fill: '#666',
            },
            labelBgStyle: {
              fill: 'rgba(0, 0, 0, 0.8)',
              fillOpacity: 0.8,
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [schema, selectedPlugins]);

  const getPluginForField = (tableName: string, _fieldName: string, plugins: string[]): string => {
    // Determine which plugin a field belongs to
    if (tableName === 'user' || tableName === 'session' || tableName === 'account' || tableName === 'verification') {
      return 'core';
    }
    
    for (const plugin of plugins) {
      if (tableName === plugin || tableName.includes(plugin)) {
        return plugin;
      }
    }
    
    return 'core';
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handlePluginToggle = (pluginName: string, checked: boolean) => {
    if (checked) {
      setSelectedPlugins(prev => [...prev, pluginName]);
    } else {
      setSelectedPlugins(prev => prev.filter(p => p !== pluginName));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Schema</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Schema Visualizer</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPluginLabels(!showPluginLabels)}
              className="flex items-center space-x-2"
            >
              {showPluginLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>Plugin Labels</span>
            </Button>
          </div>
        </div>
        <p className="text-gray-400">
          Visualize your Better Auth database schema with interactive tables and relationships.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6">
        {/* Plugin Selector */}
        <div className="col-span-1">
          <Card className="bg-gray-900/50 border-gray-700 h-fit">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Plugins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_PLUGINS.map((plugin) => (
                <div key={plugin.name} className="flex items-center space-x-3">
                  <Checkbox
                    id={plugin.name}
                    checked={selectedPlugins.includes(plugin.name)}
                    onCheckedChange={(checked: boolean) => 
                      handlePluginToggle(plugin.name, checked)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={plugin.name}
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      {plugin.displayName}
                    </label>
                    <p className="text-xs text-gray-400">{plugin.description}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${plugin.color}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Schema Info */}
          {schema && (
            <Card className="bg-gray-900/50 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-sm">Schema Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tables:</span>
                  <span className="text-white">{schema.tables.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Relationships:</span>
                  <span className="text-white">
                    {schema.tables.reduce((sum, table) => sum + table.relationships.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plugins:</span>
                  <span className="text-white">{selectedPlugins.length}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ReactFlow Diagram */}
        <div className="col-span-3">
          <div className="h-full bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{
                padding: 0.2,
              }}
              className="bg-gray-900"
            >
              <Controls className="bg-gray-800 border-gray-600" />
              <MiniMap 
                className="bg-gray-800 border-gray-600"
                nodeColor={(node) => {
                  if (node.data?.isForeign) return '#374151';
                  return '#1f2937';
                }}
                maskColor="rgba(0, 0, 0, 0.6)"
              />
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1}
                color="#374151"
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}