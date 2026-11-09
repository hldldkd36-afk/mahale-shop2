import { sb, json, preflight, requireAdmin } from "../../_lib/supabase.js";
export async function onRequest({request,env}) {
  if(request.method==="OPTIONS") return preflight();
  const admin=await requireAdmin(request,env);
  if(!admin) return json({error:"دسترسی مدیر لازم است."},401);
  try{
    if(request.method==="GET"){
      const r=await sb(env,"/rest/v1/products?select=*&order=created_at.desc",{method:"GET"},true);
      return json(r.ok?await r.json():{error:"خطا"},r.ok?200:502);
    }
    if(request.method==="POST"){
      const b=await request.json();
      if(!b.name?.trim() || !Number.isFinite(Number(b.price)) || Number(b.price)<0) return json({error:"نام و قیمت معتبر الزامی است."},400);
      const r=await sb(env,"/rest/v1/products",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
        name:b.name.trim(),description:String(b.description||""),price:Number(b.price),compare_price:b.compare_price?Number(b.compare_price):null,
        image_url:String(b.image_url||""),category_id:b.category_id||null,stock:Math.max(0,Number(b.stock)||0),is_active:true
      })},true);
      return json(r.ok?await r.json():{error:"ذخیره محصول ناموفق بود."},r.ok?201:502);
    }
    return json({error:"متد مجاز نیست."},405);
  }catch(e){return json({error:e.message},500);}
}
