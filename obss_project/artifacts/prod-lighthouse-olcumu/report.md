# Prod Lighthouse Ölçümü — rapor
Saga #372 (decision-matrix madde 5: "Performans — gerçek prod ölçümü").

## Bilinen engel ve çözümü
Task'ın kendi açıklamasında not düşülmüştü: `node .output/server/index.mjs`
bu makinede doğrudan ayağa kalkmıyordu. Kök neden bulundu: `wrangler dev`
proje kökünden çalıştırıldığında hem `.output/server/wrangler.json` hem de
`.wrangler/deploy/config.json` bulup hangisini kullanacağını bilemiyor
("Found both a user configuration file... and a deploy configuration
file... these do not share the same base path"). Çözüm: `--config
.output/server/wrangler.json --local` ile açıkça belirtmek. Bu şekilde
gerçek Cloudflare Workers build'i `http://localhost:4176` üzerinde
başarıyla ayağa kalktı (200 OK, gerçek SSR render).

## Ölçüm
`npx lighthouse http://localhost:4176 --output=json` (bkz. `lighthouse-report.json`, headless Chrome, gerçek prod build — dev sunucusu DEĞİL).

| Kategori | Skor |
|---|---|
| Performance | 74 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

| Metrik | Değer |
|---|---|
| LCP (Largest Contentful Paint) | 4.9 s |
| FCP (First Contentful Paint) | 3.5 s |
| TBT (Total Blocking Time) | 0 ms |
| CLS (Cumulative Layout Shift) | 0.004 |
| Speed Index | 4.1 s |
| Time to Interactive | 4.9 s |

## Karşılaştırma — eski (yanıltıcı) dev-mode ölçümüyle
Önceki oturumda (proje-karti-tiklanabilir-kanit task'ı, verify_report.md)
dev sunucusunda LCP **51s** ölçülmüştü — bu tamamen dev sunucusunun
minify edilmemiş/unbundled halinden kaynaklanıyordu, gerçek performansı
yansıtmıyordu. Şimdiki 4.9s, gerçek production build'in gerçek ölçümü.

## Bulgu: LCP hedefin (2.5s, Google "good" eşiği) üzerinde
`unused-javascript` audit'i: ana bundle'ın (`index-B-VLNDj0.js`, 110KB)
%45'i (50KB), route bundle'ının (`routes-C2CWqQaw.js`, 62KB) %44'ü (27KB)
kullanılmıyor. Bu, decision-matrix'in zaten işaretlediği büyük bağımlılık
sorunuyla (framer-motion 374KB, @tanstack/react-router 649KB) örtüşüyor —
code-splitting/lazy-loading henüz yapılmamış.

## Sonuç ve Sonraki Adım
Bu task'ın kapsamı ("gerçek prod ölçümü yap") tamamlandı — artık dev-mode
yanıltıcı sayı yerine gerçek, doğrulanabilir bir ölçüm var. LCP'nin
iyileştirilmesi (code-splitting) ayrı bir iştir, kullanıcı onayıyla yeni
bir Saga task'ı (`prod-performans-code-splitting`) olarak açılıp ATDD
pipeline'ıyla ayrıca ele alınacak.
