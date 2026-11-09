import { sb, json, preflight } from "../_lib/supabase.js";
export async function onRequest({request, env}) {
  if (request.method === "OPTIONS") return preflight();
  try {
    const r = await sb(env, "/rest/v1/products?select=id,name,description,price,compare_price,image_url,stock,categories(name,slug)&is_active=eq.true&order=created_at.desc",
      {method:"GET"}, false);
    return json(r.ok ? await r.json() : {error:"دریافت محصولات ناموفق بود."}, r.ok?200:502);
  } catch(e) { return json({error:e.message},500); }
}
