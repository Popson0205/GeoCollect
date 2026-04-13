export type Role = "field_collector" | "project_manager" | "gis_analyst" | "platform_admin";
export type GeometryType = "Point" | "LineString" | "Polygon" | "Multi";

export interface User {
  id: string; email: string; full_name: string; role: Role; created_at: string;
}

export interface Project {
  id: string; name: string; description?: string; owner_id: string;
  owner_name?: string; status: "active" | "archived";
  member_count?: number; form_count?: number; created_at: string;
}

export interface FieldDef {
  id: string; key: string; label: string;
  type: "text" | "number" | "select" | "multiselect" | "date" | "datetime" | "photo" | "audio" | "boolean" | "calculated" | "rating";
  required?: boolean; hint?: string; placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number; max?: number; formula?: string;
  relevant?: string; constraint?: string;
}

export interface FormSchema {
  id: string; project_id: string; name: string; version: number;
  geometry_type: GeometryType; schema: { fields: FieldDef[] };
  is_published: boolean; created_at: string; updated_at: string;
}

export interface Feature {
  type: "Feature"; id: string;
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown>;
}
