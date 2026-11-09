import { sb, json, preflight } from "../_lib/supabase.js";
const code = () => "MH" + Date.now().toString().slice(-8) + Math.floor(Math.random()*90+10);
export async function onRequest({request, env}) {
  if (request.method === "OPTIONS") return preflight();
  if (request.method !== "POST") return json({error:"متد مجاز نیست."},405);
  try {
    const body = await request.json();
    const {customer_name,phone,address,note="",items=[]} = body || {};
    if (!customer_name?.trim() || !/^[-+() 0-9]{8,20}$/.test(phone||"") || !address?.trim() || !Array.isArray(items) || !items.length)
      return json({error:"اطلاعات سفارش کامل یا معتبر نیست."},400);
    if (items.length > 30) return json({error:"تعداد اقلام سفارش بیش از حد مجاز است."},400);

    const ids = [...new Set(items.map(x=>String(x.id||"")))];
    if (ids.some(x=>! /^[0-9a-f-]{36}$/i.test(x))) return json({error:"شناسه محصول نامعتبر است."},400);
    const productRes = await sb(env, `/rest/v1/products?select=id,name,price,stock,is_active&id=in.(${ids.join(",")})`,{method:"GET"},true);
    if (!productRes.ok) return json({error:"بررسی محصولات ناموفق بود."},502);
    const products = await productRes.json();
    const map = new Map(products.map(p=>[p.id,p]));
    let subtotal = 0, rows = [];
    for (const item of items) {
      const p = map.get(String(item.id));
      const qty = Number(item.quantity);
      if (!p || !p.is_active || !Number.isInteger(qty) || qty < 1 || qty > 20 || p.stock < qty)
        return json({error:`موجودی یا وضعیت محصول ${p?.name || ""} کافی نیست.`},409);
      subtotal += Number(p.price) * qty;
      rows.push({product_id:p.id,product_name:p.name,unit_price:p.price,quantity:qty,line_total:Number(p.price)*qty});
    }
    const orderCode = code();
    const orderRes = await sb(env,"/rest/v1/orders?select=id,order_code,total,status,created_at",{
      method:"POST",headers:{"Prefer":"return=representation"},
      body:JSON.stringify({order_code:orderCode,customer_name:customer_name.trim(),phone:phone.trim(),address:address.trim(),note:String(note).slice(0,1000),subtotal,total:subtotal,payment_method:"test",payment_status:"not_paid",status:"new"})
    },true);
    if (!orderRes.ok) return json({error:"ثبت سفارش در دیتابیس انجام نشد."},502);
    const [order] = await orderRes.json();
    const itemRes = await sb(env,"/rest/v1/order_items",{method:"POST",body:JSON.stringify(rows.map(x=>({...x,order_id:order.id})))},true);
    if (!itemRes.ok) {
      await sb(env,`/rest/v1/orders?id=eq.${order.id}`,{method:"DELETE"},true);
      return json({error:"ذخیره اقلام سفارش ناموفق بود؛ سفارش نیمه‌کاره حذف شد."},502);
    }
    return json({success:true,order:{...order,order_code:orderCode},message:"سفارش آزمایشی با موفقیت ثبت شد."},201);
  } catch(e){ return json({error:e.message || "خطای سرور"},500); }
}
