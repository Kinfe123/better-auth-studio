import { Handle, type NodeProps } from '@xyflow/react';
import {
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  Hash,
  Key,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip-docs';

const SCHEMA_NODE_WIDTH = 320;
const SCHEMA_NODE_ROW_HEIGHT = 32;

export type DatabaseSchemaNodeData = {
  id?: string;
  name: string;
  displayName?: string;
  isForeign: boolean;
  plugin?: string;
  columns: {
    id: string;
    isPrimary: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isIdentity: boolean;
    name: string;
    format: string;
    plugin: string;
    description?: string;
  }[];
  relationships?: {
    type: 'one-to-many' | 'many-to-one' | 'one-to-one';
    target: string;
    field: string;
  }[];
};

// const getPluginColor = (plugin: string): string => {
//   const colors: Record<string, string> = {
//     core: 'bg-slate-600',
//     organization: 'bg-blue-600',
//     teams: 'bg-green-600',
//     twoFactor: 'bg-purple-600',
//     apiKey: 'bg-orange-600',
//     passkey: 'bg-pink-600',
//   };
//   return colors[plugin] || 'bg-gray-600';
// };

const getPluginTextColor = (plugin: string): string => {
  const colors: Record<string, string> = {
    core: 'text-slate-300',
    organization: 'text-blue-300',
    teams: 'text-green-300',
    twoFactor: 'text-purple-300',
    apiKey: 'text-orange-300',
    passkey: 'text-pink-300',
  };
  return colors[plugin] || 'text-gray-300';
};

const DatabaseSchemaNode = ({
  data: data_,
  targetPosition,
  sourcePosition,
}: NodeProps & { placeholder?: boolean }) => {
  const data = data_ as DatabaseSchemaNodeData;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hiddenNodeConnector =
    '!h-2 !w-2 !min-w-0 !min-h-0 !cursor-grab !border-0 opacity-0 hover:opacity-100 transition-opacity';
  const pluginTextColor = getPluginTextColor(data.plugin || 'core');

  if (data.isForeign) {
    return (
      <div className="relative">
        <div
          className="text-xs px-3 py-2 border border-gray-600 bg-gray-800 text-gray-200 flex gap-2 items-center rounded-md shadow-lg"
          id={`${data.name}-foreign-key`}
        >
          <Database size={12} className="text-gray-400" />
          <span className="font-medium">{data.displayName || data.name}</span>
          {targetPosition && (
            <Handle
              type="target"
              id={data.name}
              position={targetPosition}
              className={cn(hiddenNodeConnector)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'border border-gray-700 overflow-hidden shadow-xl bg-gray-900 rounded-lg',
          'hover:border-gray-600 transition-colors duration-200'
        )}
        style={{ width: SCHEMA_NODE_WIDTH }}
        id={`${data.name}-schema-node`}
      >
        {/* Header */}
        <div
          className={cn(
            'px-4 py-3 bg-black border-b border-gray-700 flex items-center justify-between',
            'cursor-pointer select-none'
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Database size={16} className="text-white" />
            <span className="text-white font-semibold text-sm">
              {data.displayName || data.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              {showDetails ? (
                <EyeOff size={12} className="text-gray-400" />
              ) : (
                <Eye size={12} className="text-gray-400" />
              )}
            </button>
            {isCollapsed ? (
              <ChevronRight size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="max-h-96 bg-black overflow-y-auto">
            {data.columns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  'relative flex items-center overflow-x-hidden px-4 py-2 text-xs',
                  'bg-black/30 hover:bg-black/40 transition-colors duration-150',
                  'border-b border-white/20 last:border-b-0'
                )}
                style={{ minHeight: SCHEMA_NODE_ROW_HEIGHT }}
              >
                {/* Column Icons */}
                <div className="flex items-center gap-1 mr-3 min-w-[40px]">
                  {column.isPrimary && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Key size={10} className="text-yellow-400 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-black border-gray-600 text-white text-xs">
                          Primary Key
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {column.isUnique && !column.isPrimary && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Fingerprint size={10} className="text-green-400 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-black border-gray-600 text-white text-xs">
                          Unique
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {column.isIdentity && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Hash size={10} className="text-blue-400 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-black border-gray-600 text-white text-xs">
                          Identity
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Column Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!column.isNullable && <span className="text-red-400 text-xs">*</span>}
                    <span className="text-white font-medium truncate">{column.name}</span>
                    <span className="text-gray-400 font-mono text-xs">{column.format}</span>
                  </div>

                  {showDetails && column.description && (
                    <div className="text-gray-500 text-xs mt-1 truncate">{column.description}</div>
                  )}
                </div>

                {/* Plugin Badge */}
                <div className="ml-2">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', pluginTextColor)}>
                    {column.plugin}
                  </span>
                </div>

                {/* Connection Handles */}
                <Handle
                  type="target"
                  id={column.id}
                  position={targetPosition || ('left' as any)}
                  className={cn(
                    hiddenNodeConnector,
                    '!left-[-8px] !top-1/2 !transform !-translate-y-1/2'
                  )}
                  style={{
                    background: '#1f2937',
                    border: '2px solid #374151',
                    left: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Handle
                  type="source"
                  id={column.id}
                  position={sourcePosition || ('right' as any)}
                  className={cn(
                    hiddenNodeConnector,
                    '!right-[-8px] !top-1/2 !transform !-translate-y-1/2'
                  )}
                  style={{
                    background: '#1f2937',
                    border: '2px solid #374151',
                    right: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.3)',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer with relationship count */}
        {data.relationships && data.relationships.length > 0 && (
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
            <span className="text-xs text-gray-400">
              {data.relationships.length} relationship{data.relationships.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { SCHEMA_NODE_ROW_HEIGHT, SCHEMA_NODE_WIDTH, DatabaseSchemaNode };
