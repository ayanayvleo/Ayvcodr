export interface APIKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  workflow_permissions?: Record<string, string[]>;
  rate_limit: number;
  usage_count: number;
  last_used?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface APIKeyCreate {
  name: string;
  permissions: string[];
  workflow_permissions?: Record<string, string[]>;
  rate_limit: number;
  expires_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://ayvcodr.com/api";

export async function fetchAPIKeys(userId: number): Promise<APIKey[]> {
  const res = await fetch(`${API_BASE}/api-keys/?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

export async function createAPIKey(userId: number, data: APIKeyCreate): Promise<APIKey> {
  const res = await fetch(`${API_BASE}/api-keys/?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create API key");
  return res.json();
}

export async function deleteAPIKey(userId: number, keyId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api-keys/${keyId}?user_id=${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete API key");
}

export async function updateAPIKey(userId: number, keyId: number, data: APIKeyCreate): Promise<APIKey> {
  const res = await fetch(`${API_BASE}/api-keys/${keyId}?user_id=${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update API key");
  return res.json();
}
