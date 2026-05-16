import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export interface FieldSchema {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
}

interface DynamicFieldsProps {
  fields: FieldSchema[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  className?: string;
}

export const DynamicFields: React.FC<DynamicFieldsProps> = ({ fields, values, onChange, className }) => {
  if (fields.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <Label htmlFor={`field-${field.name}`} className="text-xs text-white/80 font-mono uppercase">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field, values[field.name], (val) => onChange(field.name, val))}
        </div>
      ))}
    </div>
  );
};

const renderField = (field: FieldSchema, value: any, onChange: (val: any) => void) => {
  const type = field.type.toLowerCase();

  if (type === "boolean") {
    return (
      <Select value={value?.toString()} onValueChange={(val) => onChange(val === "true")}>
        <SelectTrigger className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none">
          <SelectValue placeholder={`Select ${field.name}...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (type === "number") {
    return (
      <Input
        id={`field-${field.name}`}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
      />
    );
  }

  if (type === "date") {
    return (
      <Input
        id={`field-${field.name}`}
        type="datetime-local"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
      />
    );
  }

  // Default to text input for string and other types
  return (
    <Input
      id={`field-${field.name}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
      placeholder={`Enter ${field.name}...`}
    />
  );
};
