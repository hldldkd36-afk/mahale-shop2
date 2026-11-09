const $ = (s) => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('fa-IR').format(Number(n||0)) + ' تومان';
let products=[], categories=[], cart=JSON.parse(localStorage.getItem('mahale_cart')||'[]'), activeCat='all';
const icons=['📱','🔌','🎧','🔋','🛡️','✨'];
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
async function api(url,opts={}){const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'ارتباط با سرور برقرار نشد.');return d}
async function load(){
  try{
    [products,categories]=await Promise.all([api('/api/products'),api('/api/categories')]);
    renderCategories();renderProducts();
  }catch(e){$('#productGrid').innerHTML=`<div class="loading">اتصال به دیتابیس برقرار نشد: ${e.message}<br><small>تنظیمات Supabase را طبق README تکمیل کنید.</small></div>`}
  try{const posts=await api('/api/posts');$('#postGrid').innerHTML=posts.length?posts.map(p=>`<article class="post-card"><small>مجله محله</small><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||p.body||'')}</p></article>`).join(''):'<div class="empty">هنوز مطلبی منتشر نشده است.</div>'}catch{$('#postGrid').innerHTML='<div class="empty">مطالب در دسترس نیستند.</div>'}
  renderCart();
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderCategories(){const all=[{name:'همه',slug:'all'},...categories];$('#categoryFilters').innerHTML=all.map(c=>`<button class="filter ${activeCat===c.slug?'active':''}" data-cat="${esc(c.slug)}">${esc(c.name)}</button>`).join('')}
function renderProducts(query=''){
 const list=products.filter(p=>(activeCat==='all'||p.categories?.slug===activeCat)&&(`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())));
 $('#productGrid').innerHTML=list.length?list.map((p,i)=>`<article class="product-card"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">`:`<span class="placeholder">${icons[i%icons.length]}</span>`}</div><div class="product-info"><span class="product-category">${esc(p.categories?.name||'لوازم جانبی')}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||'محصول کاربردی از فروشگاه لوازم جانبی محله')}</p><div class="price-row"><span class="price">${fmt(p.price)}</span><button class="add-btn" data-add="${p.id}" ${p.stock<1?'disabled':''}>${p.stock<1?'ناموجود':'افزودن +'}</button></div></div></article>`).join(''):'<div class="loading">محصولی با این مشخصات پیدا نشد.</div>';
}
$('#categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;activeCat=b.dataset.cat;renderCategories();renderProducts($('#searchInput').value)});
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();renderProducts($('#searchInput').value)});
$('#searchInput').addEventListener('input',e=>renderProducts(e.target.value));
$('#productGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const p=products.find(x=>x.id===b.dataset.add);if(!p)return;const row=cart.find(x=>x.id===p.id);if(row)row.quantity=Math.min(row.quantity+1,20);else cart.push({id:p.id,name:p.name,price:p.price,quantity:1});saveCart();toast('محصول به سبد خرید اضافه شد.')});
function saveCart(){localStorage.setItem('mahale_cart',JSON.stringify(cart));renderCart()}
function renderCart(){$('#cartCount').textContent=fmtCount(cart.reduce((a,x)=>a+x.quantity,0));$('#cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><div><b>${esc(x.name)}</b><div>${fmt(x.price)} × ${fmtCount(x.quantity)}</div></div><button data-remove="${x.id}">حذف</button></div>`).join(''):'<div class="empty">سبد خرید شما خالی است.</div>';$('#cartTotal').textContent=fmt(cart.reduce((a,x)=>a+x.price*x.quantity,0))}
function fmtCount(n){return new Intl.NumberFormat('fa-IR').format(n)}
$('#cartItems').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){cart=cart.filter(x=>x.id!==b.dataset.remove);saveCart()}});
function drawer(show){$('#cartDrawer').classList.toggle('show',show);$('#drawerBackdrop').classList.toggle('show',show)}
$('#cartOpen').onclick=()=>drawer(true);$('#cartClose').onclick=()=>drawer(false);$('#drawerBackdrop').onclick=()=>drawer(false);
function modal(show){$('#checkoutModal').classList.toggle('show',show)}
$('#checkoutOpen').onclick=()=>{if(!cart.length)return toast('سبد خرید خالی است.');drawer(false);modal(true)};
$('#checkoutClose').onclick=()=>modal(false);
$('#checkoutForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='در حال ثبت سفارش…';$('#checkoutMessage').textContent='';
 const data=Object.fromEntries(new FormData(e.currentTarget));data.items=cart.map(x=>({id:x.id,quantity:x.quantity}));
 try{const result=await api('/api/orders',{method:'POST',body:JSON.stringify(data)});cart=[];saveCart();e.currentTarget.reset();$('#checkoutMessage').textContent=`${result.message} کد پیگیری: ${result.order.order_code}`;toast('سفارش در دیتابیس ثبت شد.');}
 catch(err){$('#checkoutMessage').textContent=err.message}
 finally{btn.disabled=false;btn.textContent='ثبت خرید آزمایشی'}
});
load();
