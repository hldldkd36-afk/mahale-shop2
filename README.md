# لوازم جانبی محله

فروشگاه فارسی و راست‌چین لوازم جانبی موبایل؛ قابل انتشار با GitHub + Cloudflare Pages و متصل به دیتابیس واقعی Supabase (PostgreSQL).

## معماری
- Frontend: HTML/CSS/JavaScript بدون نیاز به build
- Hosting + API: Cloudflare Pages Functions
- Database + Auth: Supabase PostgreSQL و Supabase Auth
- فایل‌های عمومی: `public/`
- API سمت سرور: `functions/api/`
- کلید `SUPABASE_SERVICE_ROLE_KEY` فقط در تنظیمات محرمانه Cloudflare قرار می‌گیرد و هرگز در مرورگر منتشر نمی‌شود.

## راه‌اندازی دیتابیس (ضروری)
1. در https://supabase.com یک پروژه جدید بسازید.
2. در SQL Editor فایل `database/schema.sql` را کامل اجرا کنید.
3. برای داده‌های نمونه، فایل `database/seed.sql` را اجرا کنید.
4. از Project Settings → API این مقادیر را بردارید:
   - Project URL
   - anon/public key
   - service_role key (محرمانه)
5. در Authentication → Users یک کاربر مدیر بسازید.
6. در SQL Editor دستور زیر را با ایمیل مدیر اجرا کنید:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'ADMIN_EMAIL_HERE';
   ```
   اگر پروفایل ساخته نشده بود، ابتدا یک بار با حساب مدیر وارد شوید یا پروفایل را طبق توضیح schema بسازید.

## اجرای محلی
برای اجرای محلی با پشتیبانی Pages Functions:
```bash
npm install
npm run dev
```
سپس مقادیر زیر را در `.dev.vars` قرار دهید (این فایل را هرگز commit نکنید):
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```
سایت با Wrangler اجرا می‌شود.

## انتشار
1. مخزن GitHub بسازید و محتوای این پروژه را push کنید.
2. در Cloudflare → Workers & Pages → Create → Pages → Connect to Git، مخزن را انتخاب کنید.
3. Framework preset را روی None بگذارید؛ Build command خالی و output directory را `public` قرار دهید.
4. چون Functions در ریشه پروژه هستند، بهتر است از تنظیمات Pages و ساختار ریشه استفاده شود. اگر خروجی `public` انتخاب شد، پوشه `functions/` باید در ریشه پروژه باقی بماند.
5. در Settings → Variables and Secrets این سه متغیر را تعریف کنید:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (به‌عنوان Secret)
6. دامنه شخصی را از Custom Domains اضافه کنید و DNS را طبق راهنمای Cloudflare تنظیم کنید.

## قابلیت‌های نسخه آغازین
- فهرست محصولات و دسته‌بندی‌ها از دیتابیس
- جست‌وجوی محصولات
- سبد خرید محلی
- ثبت سفارش آزمایشی و ذخیره در دیتابیس
- ورود مدیر با Supabase Auth
- مشاهده سفارش‌ها در پنل مدیریت
- افزودن محصول و پست از پنل
- وضعیت سفارش‌ها
- واکنش‌گرا برای موبایل، تبلت و دسکتاپ

## امنیت
- Service Role Key فقط در Cloudflare Secret نگهداری می‌شود.
- API سفارش، مبلغ و محصولات را از دیتابیس دوباره اعتبارسنجی می‌کند.
- RLS برای جداول فعال است.
- پنل مدیریت نیازمند ورود و نقش `admin` است.
- خرید آزمایشی پرداخت واقعی انجام نمی‌دهد.
- قبل از فروش واقعی، تست امنیتی، پشتیبان‌گیری و قوانین حریم خصوصی/مرجوعی را تکمیل کنید.

## نکته درباره دیتابیس
ZIP شامل schema و seed است؛ دیتابیس واقعی پس از ساخت پروژه Supabase و اجرای `database/schema.sql` ایجاد می‌شود. بدون واردکردن متغیرهای اتصال، سایت نمی‌تواند به دیتابیس ابری وصل شود.
