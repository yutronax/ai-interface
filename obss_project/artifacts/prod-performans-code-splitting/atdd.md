---
task_slug: prod-performans-code-splitting
jira_id: null
saga_task_id: 373
priority: medium
coverage_target: 75
performance_target: "LCP <2.5s, Performance skoru >=90, ana bundle -50KB civarı"
memory_target: null
test_strategy:
  unit: 20
  integration: 20
  e2e: 60
affected_modules:
  - src/routes/index.tsx
  - src/components/system/AiPipeline.tsx
  - src/components/system/GitHubSection.tsx
  - src/components/system/Projects.tsx
  - src/components/system/TechStack.tsx
---

# ATDD — prod-performans-code-splitting

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga #373, Saga #372'nin ölçüm sonucundan doğdu).

## Persona
Recruiter/teknik değerlendirici (işe alım yöneticisi, CTO, tech lead)
portfolyoyu ilk kez ziyaret ediyor — genellikle mobilde/yavaş bağlantıda,
hızlı göz atıp geçme davranışı. Ayrıca genel mobil/3G-4G ziyaretçiler.

## Hedef (Neden)
Saga #372'nin gerçek prod Lighthouse ölçümünde LCP 4.9s, Performance skoru
74 çıktı (hedef: Google'ın "good" eşiği <2.5s, skor 90+). `unused-javascript`
audit'i ana bundle'ın (110KB) %45'inin, route bundle'ının (62KB) %44'ünün
kullanılmadığını gösteriyor — framer-motion ve @tanstack/react-router gibi
büyük bağımlılıklar ilk yükte gereğinden fazla JS indiriyor. LCP yavaşsa
recruiter siteyi terk edip bir sonraki adaya geçebilir; bu bir portfolyo
sitesi için doğrudan "değerlendirilme şansı" ile ilişkili.

## User Story
As a portfolyo ziyaretçisi (recruiter/teknik değerlendirici, mobil/yavaş bağlantılı)
I want sayfanın ilk ekranı hızlı yüklensin
So that siteyi terk etmeden önce gerçek içeriği görebileyim

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given below-the-fold section'lar (AiPipeline, GitHubSection,
   Projects, TechStack), When sayfa ilk yüklenir, Then bu component'ler
   `React.lazy` + `Suspense` ile ayrı JS chunk'larına bölünür, ana bundle'a
   dahil edilmez.
2. [Critical] Given `Identity` (hero/above-the-fold) component'i, When
   sayfa ilk yüklenir, Then bu component lazy-load EDİLMEZ, ilk bundle'da
   senkron yüklenir (LCP elementi burada olduğu için gecikme yaratmamalı).
3. [High] Given bir lazy-loaded section henüz yüklenmemiş, When kullanıcı o
   bölgeye scroll eder, Then gerçek section ile yaklaşık aynı yükseklikte
   bir skeleton/placeholder gösterilir (CLS'yi bozmayacak şekilde, boş alan
   DEĞİL).
4. [High] Given bir lazy chunk yüklemesi ağ hatasıyla başarısız olur, When
   bu gerçekleşir, Then o section'a özel bir Error Boundary hatayı yakalar,
   nazik bir hata mesajı gösterir; sayfanın geri kalanı (diğer section'lar)
   çalışmaya devam eder.
5. [Medium] Given JavaScript devre dışı (SSR-only), When sayfa yüklenir,
   Then temel HTML içerik (hero/Identity, section başlıkları) SSR üzerinden
   görünür kalır — content tamamen kaybolmaz.
6. [Medium] Given production build (`bun run build` + `wrangler dev --local`
   veya gerçek deploy), When Lighthouse ile ölçülür, Then LCP <2.5s,
   Performance skoru >=90, CLS <=0.004 (mevcut değer), Accessibility/
   Best Practices/SEO 100 korunur (regresyon yok).

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path — below-the-fold section lazy-load edilir | Chunk başarıyla indirilir, component mount olur | Ayrı JS chunk network'ten çekilir, ana bundle küçülür | Kısa bir skeleton, sonra section normal render olur | AC-1, AC-3 |
| 2 | Lazy chunk yükleme hatası (ağ hatası, chunk 404) | Error Boundary hatayı yakalar | Console'a hata loglanır | Section yerine nazik "yüklenemedi" mesajı — sayfa geri kalanı çalışır | AC-4 |
| 3 | Dış bağımlılık hatası (CDN/chunk yükleme başarısız) | #2 ile aynı — Error Boundary yakalar | Yok | Hata mesajı + diğer section'lar etkilenmez | AC-4 |
| 4 | Zaman aşımı (yavaş bağlantıda chunk yüklemesi uzun sürer) | Suspense fallback (skeleton) süre boyunca gösterilir | Kullanıcı bekler, sayfa donmaz | Skeleton uzun süre görünür kalır, sayfa kilitlenmez | AC-3 |
| 5 | Kısmi başarı — bazı chunk'lar yüklendi, bazıları yüklenemedi | Her section kendi Suspense/Error Boundary'sine sahip, bağımsız hata izolasyonu | Bir section'ın hatası diğerlerini etkilemez | Başarılı section'lar normal render, başarısız olan hata mesajı gösterir | AC-4 |

Kısmi başarı: Yukarıdaki satır 5 ile karşılanıyor — her section bağımsız Suspense/Error Boundary'ye sahip olduğu için "bazısı yüklendi bazısı yüklenemedi" durumu doğal olarak izole ediliyor, sessiz/yanıltıcı bir "tam başarı" bildirimi yok.
Hiçbir şey yapılamadı ama hata da yok: Uygulanamaz — code-splitting deterministik bir build/network operasyonu; ya chunk yüklenir ya da hata fırlatır, "sessiz no-op" senaryosu bu bağlamda oluşamaz.
Boş sonuç ↔ hata ayrımı: N/A — veri katmanı yok, statik component yükleme.

Silinen satırlar: "Kaynak yok/veri eksik" ve "Yetkisiz erişim" — silindi çünkü bu görev statik component'leri code-split ediyor, dinamik veri kaynağı veya auth katmanı yok.

## Test Strategy
Unit: 20% — lazy-loaded component'lerin Suspense fallback'i doğru render ediyor mu, Error Boundary hata durumunu yakalıyor mu
Integration: 20% — `index.tsx` içinde tüm section'ların doğru sırada ve lazy chunk'larla birlikte render olduğu
E2E: 60% — gerçek prod build + gerçek Lighthouse audit ile LCP/Performance skoru/CLS/bundle boyutu ölçümü (bu görevin başarı kriteri doğrudan bir performans metriği olduğu için asıl kanıt burada)

## Benchmark / Başarı Ölçütü
Coverage Target: 75%
Performance Target: LCP <2.5s, Performance skoru >=90 (74'ten), ana bundle'da anlamlı azalma (~50KB ana bundle + ~27KB route bundle kazanım hedefi)
Diğer ölçülebilir kriterler: TBT 0ms korunmalı, CLS <=0.004 (mevcut değer, bozulmamalı), Accessibility 100/Best Practices 100/SEO 100 regresyon olmadan korunmalı
Görsel/UI kriteri: Skeleton/placeholder gerçek section ile yaklaşık aynı yükseklikte olmalı (CLS'yi bozmamak için) — `verify` adımında hem gerçek Lighthouse CLS ölçümüyle hem de görsel kontrolle doğrulanmalı

## Kapsam Dışı
- framer-motion'ı tamamen kaldırmak veya başka bir animasyon kütüphanesiyle değiştirmek
- @tanstack/react-router'ı değiştirmek/kaldırmak (TanStack Start'ın SSR/routing altyapısına yapısal bağımlılık, Cloudflare Workers deploy'una entegre)
- Vite'tan başka bir bundler'a geçmek
- SSR'ı kaldırıp saf CSR'a geçmek
- Yeni bir framework'e migrate etmek
- Section'ların işlevselliğini/tasarımını değiştirmek (sadece yükleme stratejisi değişikliği)
- Kalıcı bir bundle-analyzer bağımlılığı eklemek (geçici/devDependency olarak doğrulama için kullanılabilir ama build'e dahil edilmez)

## Etkilenen Dosyalar/Modüller (bilinen)
- `src/routes/index.tsx` — `React.lazy` importları ve `Suspense`/Error Boundary sarmalayıcıları eklenecek
- `src/components/system/AiPipeline.tsx`, `GitHubSection.tsx`, `Projects.tsx`, `TechStack.tsx` — lazy-load adayları (below-the-fold)
- `src/components/system/Identity.tsx` — lazy-load edilMEYECEK (above-the-fold/hero, LCP elementi burada)

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — önceki task'larda da net teyit edilmedi. Sonraki adımlarda
arama `C:\Users\YUSUF ÇİNAR\OneDrive\Belgeler\Masaüstü\projelerim\ai-interface`
klasörüyle sınırlı tutulmalı.

## Rollback Beklentisi
Lazy-load bir hataya yol açarsa (component yüklenemezse), Error Boundary
hatayı yakalayıp sayfanın geri kalanını (diğer section'lar) çalışır
durumda tutmalı — tüm sayfa çökmemeli. Değişiklik `React.lazy`/`Suspense`
sarmalayıcılarıyla sınırlı olduğundan git revert ile kolayca geri alınabilir.

## Risks
- `AiPipeline.tsx` scroll-pin mimarisi (`h-[220vh]`, `sticky h-screen`,
  `use-section-progress.ts`) kullanıyor — lazy-load edilirken component
  henüz mount olmadan scroll pozisyonu hesaplanmaya çalışılırsa
  (`getBoundingClientRect` boş/null dönebilir) layout kayması riski var.
  Suspense fallback'inin yüksekliği gerçek component'in `h-[220vh]`
  boyutuyla uyumlu olmalı, aksi halde CLS bozulur.
- SSR ortamında `React.lazy` bazı framework'lerde farklı davranabilir
  (TanStack Start'ın kendi SSR streaming/Suspense desteğine bağlı) — bu
  `plan` adımında kod keşfiyle doğrulanmalı.

## Assumptions
- Below-the-fold section listesi (AiPipeline, GitHubSection, Projects,
  TechStack) alt-ajanın önerisi — `plan` adımında gerçek `index.tsx` sırası
  okunarak kesinleştirilecek (Experience.tsx'in above/below-the-fold
  olduğu da orada netleşecek).
- Yeni bir bundle-analyzer bağımlılığı EKLENMEYECEK, mevcut Vite build
  çıktısındaki chunk boyutları (build log) yeterli kanıt sayılacak.

## Unknowns
- Below-the-fold sınırının tam olarak hangi section'dan başladığı (viewport
  yüksekliğine göre) — `plan` adımında gerçek sayfa yapısı okunarak netleşecek.

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → (Sonnet 5 low alt-ajanı: recruiter/teknik değerlendirici, mobil/yavaş bağlantılı ziyaretçiler)
2. Ana hedef/neden → (Sonnet 5 low alt-ajanı: LCP <2.5s Google "good" eşiği, terk oranı/algılanan profesyonellik)
3. Happy path senaryosu → (Sonnet 5 low alt-ajanı: below-the-fold section'lar React.lazy+Suspense, Identity lazy-load edilmez, router/framer-motion kaldırılmaz sadece lazy-load edilir, router değişikliği kapsam dışı)
4. Edge case — JS kapalı → (Sonnet 5 low alt-ajanı: SSR temel içerik korunur)
5. Edge case — hızlı scroll → (Sonnet 5 low alt-ajanı: skeleton/placeholder, CLS'yi bozmamalı)
6. Davranış sözleşmesi tablosu → (Sonnet 5 low alt-ajanı tarafından dolduruldu, uygulanamayan satırlar gerekçeyle silindi)
7. Başarı ölçütü/benchmark → (Sonnet 5 low alt-ajanı: LCP<2.5s, skor>=90, CLS/TBT/a11y/BP/SEO korunmalı)
8. Kapsam dışı → (Sonnet 5 low alt-ajanı: framer-motion kaldırma, router değiştirme, bundler değiştirme, SSR kaldırma kapsam dışı)
9. Bağımlılıklar/etkilenen dosyalar → (Sonnet 5 low alt-ajanı: AiPipeline/GitHubSection/Projects/TechStack lazy, Identity senkron)
10. Performans/güvenlik kısıtı → (Sonnet 5 low alt-ajanı: yeni bağımlılık yok, React.lazy+Suspense yeterli)
11. Rollback beklentisi → (Sonnet 5 low alt-ajanı: Error Boundary izolasyonu, git revert ile geri alınabilir)
12. Test stratejisi oranı → (Sonnet 5 low alt-ajanı: 20/20/60 unit/integration/e2e, gerçek Lighthouse ağırlıklı — kullanıcı "devam" onayıyla kabul edildi)
