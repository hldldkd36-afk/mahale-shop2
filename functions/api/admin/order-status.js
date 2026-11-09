import { sb, json, preflight, requireAdmin } from "../../_lib/supabase.js";
export async function onRequest({request,env}) {
  if(request.method==="OPTIONS") return preflight();
  const admin=await requireAdmin(request,env);
  if(!admin) return json({error:"دسترسی مدیر لازم است."},401);
  if(request.method!=="PATCH") return json({error:"متد مجاز نیست."},405);
  try{
    const {id,status}=await request.json();
    const allowed=["new","confirmed","preparing","shipped","completed","cancelled"];
    if(!id||!allowed.includes(status)) return json({error:"وضعیت نامعتبر است."},400);
    const r=await sb(env,`/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({status})},true);
    return json(r.ok?await r.json():{error:"تغییر وضعیت ناموفق بود."},r.ok?200:502);
  }catch(e){return json({error:e.message},500);}
}
