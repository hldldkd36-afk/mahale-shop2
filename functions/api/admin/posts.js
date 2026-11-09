import { sb, json, preflight, requireAdmin } from "../../_lib/supabase.js";
export async function onRequest({request,env}) {
  if(request.method==="OPTIONS") return preflight();
  const admin=await requireAdmin(request,env);
  if(!admin) return json({error:"دسترسی مدیر لازم است."},401);
  if(request.method!=="POST") return json({error:"متد مجاز نیست."},405);
  try{
    const b=await request.json();
    if(!b.title?.trim()) return json({error:"عنوان مطلب الزامی است."},400);
    const r=await sb(env,"/rest/v1/posts",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      title:b.title.trim(),excerpt:String(b.excerpt||""),body:String(b.body||""),image_url:String(b.image_url||""),published:true
    })},true);
    return json(r.ok?await r.json():{error:"انتشار مطلب ناموفق بود."},r.ok?201:502);
  }catch(e){return json({error:e.message},500);}
}
