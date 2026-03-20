import { Link2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDatabaseSchemaSummary,
  type DatabaseSchemaRelationship,
  type DatabaseSchemaTable,
} from "@/hooks/useDatabaseSchemaSummary";
import { Database } from "../PixelIcons";

function formatRowCount(value?: number | null) {
  if (typeof value !== "number") {
    return "—";
  }
  return value.toLocaleString();
}

function relationshipLabel(type: DatabaseSchemaRelationship["type"]) {
  if (type === "one-to-one") return "1:1";
  if (type === "many-to-one") return "N:1";
  return "1:N";
}

export function DatabaseWidget() {
  const { tables, summary, loading } = useDatabaseSchemaSummary();
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);

  const selectedTable = useMemo(
    () => tables.find((table) => table.name === selectedTableName) || null,
    [selectedTableName, tables],
  );

  const openTable = (table: DatabaseSchemaTable) => {
    setSelectedTableName(table.name);
  };

  return (
    <div className="flex flex-col min-h-0 h-full max-h-[24rem] overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-4 h-4 text-white/60" />
          <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
            Database
          </h4>
        </div>
        {!loading && (
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            {summary.tableCount} tables
          </span>
        )}
      </div>
      <hr className="border-white/5 mb-3 -mx-2 shrink-0" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No tables found</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-2">
            {tables.map((table) => (
              <li key={table.name}>
                <button
                  type="button"
                  onClick={() => openTable(table)}
                  className="w-full text-left border border-white/10 bg-white/[0.02] px-2.5 py-2 rounded-none hover:border-white/20 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-mono truncate">{table.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mt-0.5">
                        {table.fields.length} fields · {table.relationships.length} relations
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-white font-mono">
                      {formatRowCount(table.rowCount)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedTable && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedTableName(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-hidden border border-dashed border-white/20 bg-black rounded-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-dashed border-white/20 px-4 py-4">
              <div className="min-w-0">
                <h3 className="text-lg text-white font-light truncate">
                  {selectedTable.displayName}
                </h3>
                <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider mt-1 truncate">
                  {selectedTable.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableName(null)}
                className="shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-3 gap-4 border-b border-dashed border-white/10 pb-4 mb-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                    Records
                  </p>
                  <p className="text-white font-mono text-lg mt-1">
                    {typeof selectedTable.rowCount === "number"
                      ? selectedTable.rowCount.toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                    Fields
                  </p>
                  <p className="text-white font-mono text-lg mt-1">{selectedTable.fields.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                    Relations
                  </p>
                  <p className="text-white font-mono text-lg mt-1">
                    {selectedTable.relationships.length}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                  Fields
                </h4>
                <div className="space-y-0">
                  {selectedTable.fields.map((field, index) => (
                    <div
                      key={field.name}
                      className={`py-3 border-dashed border-white/10 ${
                        index === 0 ? "" : "border-t"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-mono truncate">{field.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {field.primaryKey && (
                              <span className="border border-dashed border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] text-white/80 font-mono uppercase">
                                PK
                              </span>
                            )}
                            {field.unique && (
                              <span className="border border-dashed border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] text-white/80 font-mono uppercase">
                                Unique
                              </span>
                            )}
                            {!field.required && (
                              <span className="border border-dashed border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] text-white/80 font-mono uppercase">
                                Nullable
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-gray-400 font-mono uppercase">
                          {field.type}
                        </span>
                      </div>
                      {field.description && (
                        <p className="mt-1.5 text-xs text-gray-500">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTable.relationships.length > 0 && (
                <div>
                  <h4 className="mb-3 text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                    Relationships
                  </h4>
                  <div className="space-y-0">
                    {selectedTable.relationships.map((relation, index) => (
                      <div
                        key={`${relation.field}-${relation.target}-${index}`}
                        className={`py-3 border-dashed border-white/10 ${
                          index === 0 ? "" : "border-t"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-mono truncate">
                              {relation.field}
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedTableName(relation.target)}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400 font-mono uppercase tracking-wider hover:text-white transition-colors"
                            >
                              <span>{relation.target}</span>
                              <Link2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="shrink-0 border border-dashed border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] text-white/80 font-mono uppercase">
                            {relationshipLabel(relation.type)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
