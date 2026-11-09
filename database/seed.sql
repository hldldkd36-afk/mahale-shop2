insert into public.categories(name, slug) values
('شارژر و کابل','chargers-cables'),
('قاب و گلس','cases-glass'),
('هندزفری و هدفون','audio'),
('پاوربانک','power-bank'),
('پایه و نگهدارنده','holders')
on conflict (slug) do nothing;

insert into public.products(name, description, price, compare_price, image_url, category_id, stock)
select v.name, v.description, v.price, v.compare_price, v.image_url, c.id, v.stock
from (values
 ('شارژر سریع ۲۵ وات','شارژر دیواری با فناوری شارژ سریع و طراحی جمع‌وجور',485000::bigint,590000::bigint,'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=900', 'chargers-cables',18),
 ('کابل تایپ C مقاوم','کابل شارژ و انتقال داده با روکش مقاوم',165000::bigint,null::bigint,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900','chargers-cables',32),
 ('قاب شفاف ضدضربه','قاب شفاف با لبه‌های محافظ و جذب ضربه',220000::bigint,280000::bigint,'https://images.unsplash.com/photo-1601593346740-925612772716?w=900','cases-glass',25),
 ('هندزفری بلوتوثی','هدفون بی‌سیم مناسب مکالمه و موسیقی',890000::bigint,1090000::bigint,'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900','audio',12),
 ('پاوربانک ۱۰۰۰۰','پاوربانک سبک با ظرفیت ۱۰۰۰۰ میلی‌آمپر',1250000::bigint,null::bigint,'https://images.unsplash.com/photo-1609592424851-5d4f5c2a1c4a?w=900','power-bank',9),
 ('پایه نگهدارنده رومیزی','پایه قابل تنظیم برای میز کار و تماشای ویدئو',310000::bigint,null::bigint,'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=900','holders',15)
) as v(name,description,price,compare_price,image_url,slug,stock)
join public.categories c on c.slug = v.slug
where not exists (select 1 from public.products p where p.name = v.name);

insert into public.posts(title,excerpt,body,published)
select 'چطور شارژر مناسب گوشی خود را انتخاب کنیم؟',
'چند نکته ساده برای انتخاب شارژر ایمن و سازگار با گوشی.',
'هنگام خرید شارژر به توان خروجی، استانداردهای ایمنی و سازگاری با گوشی توجه کنید. استفاده از کابل باکیفیت نیز اهمیت زیادی دارد.',
true
where not exists (select 1 from public.posts where title = 'چطور شارژر مناسب گوشی خود را انتخاب کنیم؟');
