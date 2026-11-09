import { sb, json, preflight, requireAdmin } from "../../_lib/supabase.js";
export async function onRequest({request,env}) {
  if(request.method==="OPTIONS") return preflight();
  const admin=await requireAdmin(request,env);
  if(!admin) return json({error:"دسترسی مدیر لازم است."},401);
  try{
    const r=await sb(env,"/rest/v1/orders?select=*,order_items(*)&order=created_at.desc",{method:"GET"},true);
    return json(r.ok?await r.json():{error:"دریافت سفارش‌ها ناموفق بود."},r.ok?200:502);
  }catch(e){return json({error:e.message},500);}
}
