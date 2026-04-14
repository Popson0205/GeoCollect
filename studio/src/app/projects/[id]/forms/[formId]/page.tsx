"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { FormSchema, FieldDef } from "@/types";

const FIELD_TYPES = [
  { type: "text", label: "Text", icon: "T" },
  { type: "number", label: "Number", icon: "#" },
  { type: "select", label: "Select", icon: "▾" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "datetime", label: "Date & Time", icon: "🕐" },
  { type: "photo", label: "Photo", icon: "📷" },
  { type: "audio", label: "Audio", icon: "🎙" },
  { type: "boolean", label: "Yes/No", icon: "✓" },
  { type: "rating", label: "Rating", icon: "★" },
  { type: "calculated", label: "Calculated", icon: "∑" },
];

function FieldEditor({ field, onChange, onRemove }: {
  field: FieldDef;
  onChange: (f: FieldDef) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card p-4 border-l-4 border-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Label</label>
            <input className="input" value={field.label}
              onChange={e => onChange({ ...field, label: e.target.value })} />
          </div>
          <div>
            <label className="label">Field Key</label>
            <input className="input" value={field.key}
              onChange={e => onChange({ ...field, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={field.type}
              onChange={e => onChange({ ...field, type: e.target.value as FieldDef["type"] })}>
              {FIELD_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Hint</label>
            <input className="input" placeholder="Helper text for collector" value={field.hint || ""}
              onChange={e => onChange({ ...field, hint: e.target.value })} />
          </div>
          {field.type === "select" && (
            <div className="col-span-2">
              <label className="label">Options (one per line: value|Label)</label>
              <textarea className="input" rows={3}
                placeholder={"good|Good\nfair|Fair\npoor|Poor"}
                value={(field.options || []).map(o => `${o.value}|${o.label}`).join("\n")}
                onChange={e => onChange({
                  ...field,
                  options: e.target.value.split("\n").filter(Boolean).map(l => {
                    const [value, label] = l.split("|");
                    return { value: value?.trim(), label: label?.trim() || value?.trim() };
                  })
                })} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={field.required || false}
              onChange={e => onChange({ ...field, required: e.target.checked })} />
            Required
          </label>
          <button onClick={onRemove} className="text-xs text-geo-red hover:underline">Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const { id, formId } = useParams<{ id: string; formId: string }>();
  const router = useRouter();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<FormSchema>(`/forms/${formId}`).then(s => {
      setSchema(s);
      setFields(s.schema?.fields || []);
    });
  }, [formId]);

  const addField = (type: string) => {
    const f: FieldDef = {
      id: crypto.randomUUID(),
      key: `field_${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: type as FieldDef["type"],
      required: false,
    };
    setFields(prev => [...prev, f]);
  };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api.patch(`/forms/${formId}`, { schema: { fields } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [formId, fields]);

  const publish = async () => {
    await save();
    await api.post(`/forms/${formId}/publish`, {});
    router.push(`/projects/${id}`);
  };

  if (!schema) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — field palette */}
      <div className="w-52 bg-white border-r border-surface-border flex flex-col">
        <div className="p-4 border-b border-surface-border">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Field</p>
        </div>
        <div className="p-3 space-y-1 overflow-auto flex-1">
          {FIELD_TYPES.map(t => (
            <button key={t.type} onClick={() => addField(t.type)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary rounded-lg transition-colors text-left">
              <span className="w-6 text-center font-mono text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-surface-border px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">{schema.name}</h2>
            <p className="text-xs text-slate-400">{schema.geometry_type} · v{schema.version} · {fields.length} fields</p>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-ghost text-sm">
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save Draft"}
            </button>
            <button onClick={publish} className="btn-primary text-sm">
              Publish
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {fields.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium">No fields yet</p>
              <p className="text-sm">Click a field type on the left to add it</p>
            </div>
          )}
          {fields.map((f, i) => (
            <FieldEditor key={f.id} field={f}
              onChange={updated => setFields(prev => prev.map((x, j) => j === i ? updated : x))}
              onRemove={() => setFields(prev => prev.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>
    </div>
  );
}
