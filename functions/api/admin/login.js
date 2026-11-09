import { sb, json, preflight } from "../../_lib/supabase.js";
export async function onRequest({request,env}) {
  if(request.method==="OPTIONS") return preflight();
  if(request.method!=="POST") return json({error:"متد مجاز نیست."},405);
  try{
    const {email,password}=await request.json();
    if(!email||!password) return json({error:"ایمیل و رمز عبور الزامی است."},400);
    const r=await sb(env,"/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})},false);
    const data=await r.json();
    if(!r.ok) return json({error:"ایمیل یا رمز عبور صحیح نیست."},401);
    const profile=await sb(env,`/rest/v1/profiles?id=eq.${encodeURIComponent(data.user.id)}&select=role`,{method:"GET"},true);
    const rows=await profile.json();
    if(rows?.[0]?.role!=="admin") return json({error:"این حساب دسترسی مدیر ندارد."},403);
    return json({access_token:data.access_token,refresh_token:data.refresh_token,user:{id:data.user.id,email:data.user.email}});
  }catch(e){return json({error:e.message},500);}
}
