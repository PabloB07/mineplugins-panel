const VERCEL_API_BASE = "https://api.vercel.com/v6";

export interface VercelEnvVar {
  key: string;
  value: string;
  type: "secret" | "plain";
  target: "production" | "preview" | "development";
}

export async function getVercelClient() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_SYNC_PROJECT_ID;

  if (!token || !projectId) {
    return null;
  }

  return { token, projectId };
}

export async function listVercelEnvVars(): Promise<VercelEnvVar[]> {
  const client = await getVercelClient();
  if (!client) return [];

  const response = await fetch(
    `${VERCEL_API_BASE}/projects/${client.projectId}/env?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${client.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.error("[Vercel] Failed to list env vars:", response.statusText);
    return [];
  }

  const data = await response.json();
  return (data.envs || []) as VercelEnvVar[];
}

export async function updateVercelEnvVar(
  key: string,
  value: string,
  target: VercelEnvVar["target"] = "production"
): Promise<boolean> {
  const client = await getVercelClient();
  if (!client) {
    console.log("[Vercel] No client configured, skipping update");
    return false;
  }

  const existing = await listVercelEnvVars();
  const existingVar = existing.find((e) => e.key === key);

  const method = existingVar ? "PATCH" : "POST";
  const url = existingVar
    ? `${VERCEL_API_BASE}/projects/${client.projectId}/env/${existingVar.key}?target=${target}`
    : `${VERCEL_API_BASE}/projects/${client.projectId}/env?target=${target}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${client.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: "plain",
      target,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Vercel] Failed to update ${key}:`, error);
    return false;
  }

  console.log(`[Vercel] Updated ${key}=${value} on ${target}`);
  return true;
}

export async function syncPaymentEnvironment(
  gateway: "payku" | "paypal" | "tebex",
  environment: "SANDBOX" | "PRODUCTION"
): Promise<boolean> {
  const envKeyMap = {
    payku: "PAYKU_ENV",
    paypal: "PAYPAL_ENV",
    tebex: "TEBEX_ENV",
  };

  const key = envKeyMap[gateway];
  const value = environment;

  return updateVercelEnvVar(key, value, "production");
}