
const SUPABASE_URL = (env) =>
  (env.SUPABASE_URL || "").replace(/\/+$/, "");

export function getSupabaseHeaders(env, options = {}) {
  const publishableKey = env.SUPABASE_ANON_KEY;
  const secretKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const key = options.admin
    ? secretKey
    : publishableKey;

  if (!SUPABASE_URL(env) || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  const headers = new Headers({
    "apikey": key,
    "Content-Type": "application/json"
  });

  // New Supabase Secret and Publishable API keys
  // are API keys, not JWT bearer tokens.
  if (options.accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${options.accessToken}`
    );
  } else if (options.admin) {
    headers.set("Authorization", `Bearer ${secretKey}`);
  }

  return headers;
}

export async function supabaseRequest(
  env,
  path,
  options = {}
) {
  const baseUrl = SUPABASE_URL(env);

  if (!baseUrl) {
    throw new Error("SUPABASE_URL is missing.");
  }

  const headers = getSupabaseHeaders(env, options);

  const response = await fetch(
    `${baseUrl}/rest/v1/${path}`,
    {
      method: options.method || "GET",
      headers: {
        ...Object.fromEntries(headers.entries()),
        ...(options.headers || {})
      },
      body: options.body
        ? JSON.stringify(options.body)
        : undefined
    }
  );

  const responseText = await response.text();

  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Supabase error ${response.status}: ${
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      }`
    );
  }

  return data;
}
