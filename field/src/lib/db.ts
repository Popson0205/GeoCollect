import { openDB, IDBPDatabase } from "idb";

export interface OfflineFeature {
  id: string;
  form_schema_id: string;
  project_id: string;
  geometry: GeoJSON.Geometry;
  attributes: Record<string, unknown>;
  device_id: string;
  synced: boolean;
  created_at: number;
}

let _db: IDBPDatabase | null = null;

export async function getDB() {
  if (_db) return _db;
  _db = await openDB("geocollect", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("features")) {
        const s = db.createObjectStore("features", { keyPath: "id" });
        s.createIndex("synced", "synced");
        s.createIndex("project_id", "project_id");
      }
      if (!db.objectStoreNames.contains("forms")) {
        db.createObjectStore("forms", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("auth")) {
        db.createObjectStore("auth", { keyPath: "key" });
      }
    },
  });
  return _db;
}

export async function saveFeatureOffline(f: OfflineFeature) {
  const db = await getDB();
  await db.put("features", f);
}

export async function getUnsyncedFeatures(): Promise<OfflineFeature[]> {
  const db = await getDB();
  return db.getAllFromIndex("features", "synced", IDBKeyRange.only(false));
}

export async function markFeatureSynced(id: string) {
  const db = await getDB();
  const f = await db.get("features", id);
  if (f) await db.put("features", { ...f, synced: true });
}

export async function saveFormOffline(form: unknown) {
  const db = await getDB();
  await db.put("forms", form);
}

export async function getForms(): Promise<unknown[]> {
  const db = await getDB();
  return db.getAll("forms");
}

export async function saveAuth(token: string, user: unknown) {
  const db = await getDB();
  await db.put("auth", { key: "token", value: token });
  await db.put("auth", { key: "user", value: user });
}

export async function getAuth(): Promise<{ token: string | null; user: unknown }> {
  const db = await getDB();
  const t = await db.get("auth", "token");
  const u = await db.get("auth", "user");
  return { token: t?.value || null, user: u?.value || null };
}

export async function clearAuth() {
  const db = await getDB();
  await db.delete("auth", "token");
  await db.delete("auth", "user");
}
