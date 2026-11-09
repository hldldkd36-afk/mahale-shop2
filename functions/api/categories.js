import { sb, json, preflight } from "../_lib/supabase.js";
export async function onRequest({request, env}) {
  if (request.method === "OPTIONS") return preflight();
  try {
    const r = await sb(env, "/rest/v1/categories?select=id,name,slug&order=name.asc",{method:"GET"},false);
    return json(r.ok ? await r.json() : {error:"دریافت دسته‌ها ناموفق بود."},r.ok?200:502);
  } catch(e){ return json({error:e.message},500); }
}
