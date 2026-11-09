const base = (env) => (env.SUPABASE_URL || "").replace(/\/$/, "");
export async function sb(env, path, options = {}, useService = false) {
  const key = useService ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  if (!base(env) || !key) throw new Error("تنظیمات دیتابیس کامل نیستند.");
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  headers.set("Authorization", options.token ? `Bearer ${options.token}` : `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  return fetch(`${base(env)}${path}`, { ...options, headers });
}
export async function requireAdmin(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const userRes = await sb(env, "/auth/v1/user", { token, method: "GET" }, false);
  if (!userRes.ok) return null;
  const user = await userRes.json();
  const profileRes = await sb(env, `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, { method:"GET" }, true);
  if (!profileRes.ok) return null;
  const rows = await profileRes.json();
  return rows?.[0]?.role === "admin" ? user : null;
}
export const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store",
  "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization",
  "Access-Control-Allow-Methods":"GET, POST, PATCH, OPTIONS" }
});
export const preflight = () => new Response(null,{status:204,headers:{
  "Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization",
  "Access-Control-Allow-Methods":"GET, POST, PATCH, OPTIONS"}});
