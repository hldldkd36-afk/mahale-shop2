import { sb, json, preflight } from "../_lib/supabase.js";
export async function onRequest({request, env}) {
  if (request.method === "OPTIONS") return preflight();
  try {
    const r = await sb(env, "/rest/v1/posts?select=id,title,excerpt,body,image_url,created_at&published=eq.true&order=created_at.desc",{method:"GET"},false);
    return json(r.ok ? await r.json() : {error:"دریافت مطالب ناموفق بود."},r.ok?200:502);
  } catch(e){ return json({error:e.message},500); }
}
