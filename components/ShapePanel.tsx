"use client";

import { Field, Input, ToggleGroup, ToggleGroupItem } from "@toyonix/web-kit/react";
import { useState } from "react";
import type { PartField, PartFields } from "@/engines/ergogen/parts";

interface ShapePanelProps {
  /** A readable name for the part, e.g. "#2 rectangle". */
  label: string;
  fields: PartFields;
  /** How many points the part is placed on: edits apply to all of them. */
  copies: number;
  onChange: (field: PartField, value: string) => void;
}

const OPERATIONS = [
  { value: "add", label: "Add" },
  { value: "subtract", label: "Subtract" },
  { value: "intersect", label: "Intersect" },
  { value: "stack", label: "Stack" },
];

/**
 * The selected part's fields, as written in the YAML (formulas like `kx - 1` included). A
 * field is saved when you press Enter or leave it; Escape puts back the YAML's value.
 */
export function ShapePanel({ label, fields, copies, onChange }: ShapePanelProps) {
  const rectangle = fields.what === "rectangle";
  return (
    <div className="grid gap-3">
      <p className="m-0 font-mono text-sm">
        {label} <span className="text-text-muted">· {fields.what}</span>
      </p>
      {copies > 1 ? (
        <p className="m-0 text-sm text-text-muted">
          Placed on {copies} points: it&apos;s one part in the YAML, so moving, resizing or rounding one copy
          changes all of them.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <FieldInput
          label="Shift x"
          value={fields.shiftX}
          placeholder="0"
          onCommit={(v) => onChange("shiftX", v)}
        />
        <FieldInput
          label="Shift y"
          value={fields.shiftY}
          placeholder="0"
          onCommit={(v) => onChange("shiftY", v)}
        />
        {rectangle ? (
          <>
            <FieldInput label="Width" value={fields.width} onCommit={(v) => onChange("width", v)} />
            <FieldInput label="Height" value={fields.height} onCommit={(v) => onChange("height", v)} />
            <FieldInput
              label="Corner radius"
              value={fields.corner}
              placeholder="0"
              onCommit={(v) => onChange("corner", v)}
            />
          </>
        ) : null}
      </div>
      <div className="grid gap-1">
        <span className="tx-label">Operation</span>
        <ToggleGroup
          type="single"
          value={fields.operation}
          onValueChange={(value) => value && onChange("operation", value)}
          aria-label="Operation"
        >
          {OPERATIONS.map((operation) => (
            <ToggleGroupItem key={operation.value} value={operation.value}>
              {operation.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {!rectangle ? (
        <p className="m-0 text-sm text-text-muted">
          This part is a {fields.what}: move it on the canvas or with its shift. Its own size lives where
          it&apos;s defined.
        </p>
      ) : null}
    </div>
  );
}

/** A text field holding a YAML value; saved on Enter or blur when it changed. */
function FieldInput({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}) {
  // What's typed, until it's saved; a new value from the YAML replaces it.
  const [typed, setTyped] = useState<{ from: string; text: string } | null>(null);
  const text = typed && typed.from === value ? typed.text : value;
  const commit = () => {
    if (typed && typed.from === value && typed.text !== value) onCommit(typed.text);
    setTyped(null);
  };
  return (
    <Field label={label}>
      <Input
        value={text}
        placeholder={placeholder}
        suffix="mm"
        inputMode="decimal"
        className="font-mono"
        onChange={(event) => setTyped({ from: value, text: event.target.value })}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setTyped(null);
        }}
      />
    </Field>
  );
}
