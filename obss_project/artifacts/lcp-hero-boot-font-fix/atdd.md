---
task_slug: lcp-hero-boot-font-fix
jira_id: null
saga_task_id: 386
threat_model: not-applicable
priority: medium
coverage_target: 80
performance_target: "LCP < 2.5s, Element Render Delay < 200ms"
memory_target: null
test_strategy:
  unit: 15
  integration: 15
  e2e: 70
affected_modules:
  - src/components/system/Hero.tsx
  - src/routes/__root.tsx
  - src/components/system/use-typewriter.ts
  - src/styles.css
  - public/fonts/ (yeni, self-host seçilirse)
---

# ATDD — lcp-hero-boot-font-fix

## Jira Kaynağı
Jira'ya bağlı değil — Saga task #386'dan devam ediliyor.

Saga #386 açıklaması (birebir): "Saga #373'ün (code-splitting) red-team'i ve verify_report'u kök nedeni tespit etmişti ama kapsam dışı bırakmıştı: Lighthouse'ta LCP hedefin (2.5s) üzerinde kalıyor (~5-6s). `lcp-breakdown-insight`: Element Render Delay ~1489ms — Hero.tsx'in kendi \"boot sequence\" clip-path animasyonu (satır ~27-31, setInterval 420ms) LCP elementini (`<h1>{IDENTITY.name}</h1>`) bilerek ~1.5s gizli tutuyor. Ayrıca Google Fonts render-blocking zinciri ~1.1s ekliyor. Şimdi ele alınacak: animasyon gecikmesini kısaltmak/LCP'yi bloklamayacak şekilde yeniden tasarlamak + font yükleme stratejisini (preload/self-host/font-display) iyileştirmek. Gerçek prod build + gerçek Lighthouse ile doğrulanmalı."

Not: Kod okuması sırasında görülen güncel satır numaraları ve mekanizma açıklamada yazılandan biraz farklı — Hero.tsx (satır 26-47) command typewriter (45ms/karakter + 300ms delay) → boot satırları (setInterval 160ms, 5 satır) → isim typewriter'ı (55ms/karakter + 250ms delay) sırayla çalışıyor; `<h1>` içeriği (`name.typed`) bu zincir bitene kadar boş/kısmi kalıyor. Kök neden aynı: LCP elementinin içeriği JS state'ine bağımlı ve gecikmeli dolduruluyor.

## Persona
Site ziyaretçisi — özellikle mobil/yavaş ağ üzerinden ilk kez gelen ziyaretçi. Lighthouse sadece bu deneyimi ölçen araçtır, asıl hedef kitle gerçek kullanıcı.

## Hedef (Neden)
İlk izlenim hızını (algılanan yükleme hızı) iyileştirmek — LCP kullanıcının "sayfa geldi" algısını doğrudan etkiler. SEO/Core Web Vitals sıralaması ikincil, sonuç niteliğinde fayda.

## User Story
As a site ziyaretçisi (özellikle mobil/yavaş ağda)
I want ana başlığın (`<h1>{IDENTITY.name}</h1>`) sayfa açılır açılmaz görünür olmasını
So that sitenin yavaş/bozuk yüklendiği izlenimine kapılmadan içeriğe hemen erişebileyim

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given bir ziyaretçi siteyi ilk kez açıyor, When sayfa yükleniyor, Then `<h1>{IDENTITY.name}</h1>` DOM'a tam metinle (typewriter state'i beklemeden) render edilir ve ilk boyamada görünür olur.
2. [Critical] Given prod build + Lighthouse (mobile, simulated throttle) ile ölçüm yapılıyor, When ölçüm tamamlanıyor, Then LCP < 2.5s ve Element Render Delay < 200ms.
3. [High] Given boot/typewriter animasyonu hâlâ görsel bir efekt olarak isteniyor, When h1 zaten dolu render edilmişken animasyon oynatılıyor, Then animasyon LCP elementinin ilk boyamasını geciktirmeyen ayrı bir katman/efekt olarak çalışır (örn. cursor/overlay efekti, h1 içeriğini gizlemeyen bir CSS-only geçiş).
4. [High] Given Google Fonts (JetBrains Mono, Space Grotesk) kullanılıyor, When sayfa yükleniyor, Then font yükleme render-blocking olmaktan çıkarılır (self-host + preload + font-display: swap veya eşdeğeri) ve h1 fontu hazır olmadan önce sistem fallback fontuyla anında görünür (FOUT).
5. [Medium] Given ağ/CPU throttle (Lighthouse mobile simulated 4x CPU + slow 4G) altında test ediliyor, When sayfa yükleniyor, Then h1 hâlâ Element Render Delay <200ms hedefinde kalır.
6. [Medium] Given font kaynağı erişilemez (404/offline/Google Fonts engellenmiş), When sayfa yükleniyor, Then h1 sistem fallback fontuyla görünür kalır, sayfa engellenmez, kullanıcıya görsel hata gösterilmez.

## Threat Model
Tetikleyici yok — değerlendirilen tetikleyiciler: kimlik doğrulama/yetkilendirme, kullanıcı girdisi, dosya yükleme/indirme, ödeme, kişisel veri (KVKK), çok kiracılı sınır, dış API çağrısı (yalnızca statik Google Fonts CSS/font dosyası çekimi, kullanıcı verisi taşımıyor), arka plan işi, yeni HTTP ucu — hiçbiri uymuyor çünkü bu görev saf frontend performans/render-sırası ve statik font teslimi değişikliği, hiçbir kullanıcı girdisi/kimlik/veri işlemiyor.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path (normal yükleme) | h1 DOM'da tam metinle, ilk boyamada | Boot animasyonu ayrı katmanda arka planda oynar | İsim anında okunur, animasyon dekoratif efekt olarak devam eder | AC-1, AC-3 |
| 2 | Kaynak yok (font dosyası 404) | Sistem fallback fontu render edilir | Console'da uyarı olabilir, kullanıcıya görsel hata yok | h1 fallback fontla görünür, layout bozulmaz | AC-4, AC-6 |
| 3 | Dış bağımlılık hatası (Google Fonts CDN erişilemez / self-host font sunucu hatası) | Fallback font ile devam, sayfa render'ı engellenmez | Yok | h1 fallback fontla anında görünür | AC-4, AC-6 |
| 4 | Zaman aşımı (font yükleme geç kalır) | `font-display: swap` davranışı: fallback anında, gerçek font gelince swap | Yok | Kullanıcı önce fallback, sonra (fark edilmeden) gerçek fontu görür | AC-4 |
| 5 | Kısmi başarı (h1 görünür ama boot animasyonu görsel olarak bozuk/oynamıyor) | Kabul edilebilir — animasyon dekoratif, h1 içeriği kritik | Yok (animasyon hatası sessiz kalır) | h1 doğru görünür, animasyon eksikliği fark edilmeyebilir | AC-1, AC-3 |
| 6 | Hiçbir şey yapılamadı ama hata yok | N/A — bu görevde bu senaryo oluşmaz (statik içerik, her zaman render edilir) | — | — | — |

Kısmi başarı: Boot animasyonu (typewriter/cursor efekti) çalışmasa bile h1 içeriği her koşulda anında görünür kalmalı — animasyon asla LCP elementinin varlığına bağımlı bir ön koşul olamaz.
Hiçbir şey yapılamadı ama hata yok: Uygulanamaz — bu görev statik metin render'ı üzerine kurulu, "hiçbir şey yapılamama" durumu yok.
Boş sonuç ↔ hata ayrımı: Uygulanamaz — bu görevde veri sorgusu/API çağrısı yok, sadece statik render + font teslimi.

## Test Strategy
Unit: 15% — `use-typewriter.ts` hook'unun LCP elementini artık geciktirmediğini (h1 render'ının typewriter state'inden bağımsız olduğunu) doğrulayan mantık testleri.
Integration: 15% — Hero.tsx component testinde `<h1>` içeriğinin ilk render'da (typewriter tamamlanmadan) DOM'da tam metinle mevcut olduğunu doğrulayan test.
E2E: 70% — gerçek prod build (`node .output/server/index.mjs` veya VPS) üzerinde Lighthouse ile LCP + Element Render Delay ölçümü (throttled mobile + throttle'sız), görsel doğrulama (animasyonun h1'i gizlemediği).

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: LCP < 2.5s, Element Render Delay < 200ms (mevcut ~1489ms'den)
Memory: Belirtilmedi (bu görevle ilgisiz)
Görsel/UI kriteri: Boot/typewriter animasyonu görsel olarak korunmalı (tamamen kaldırılmıyor), ancak h1 içeriğini artık geciktirmemeli — `verify` adımında `vision-test` ile ekran görüntüsü üzerinden doğrulanmalı.
Diğer ölçülebilir kriterler: Self-host font kullanılırsa toplam ek font yükü birkaç yüz KB'ı geçmemeli (yalnızca kullanılan weight'ler + latin subset, woff2).

## Kapsam Dışı
- TerminalWindow bileşeninin tamamen yeniden tasarımı
- Diğer sayfaların/route'ların LCP optimizasyonu
- Genel animasyon sisteminin (motion/react kullanımı) kaldırılması
- Code-splitting (Saga #373 kapsamında zaten ele alınmış)
- Lighthouse'un Accessibility/SEO/Best Practices kategorileri (bu görevin odağı sadece LCP/Performance)

## Etkilenen Dosyalar/Modüller (bilinen)
- `src/components/system/Hero.tsx` — h1 render sırası, boot animasyon mantığı
- `src/routes/__root.tsx` — Google Fonts `<link rel="stylesheet">` (satır 106-111), preconnect zaten var
- `src/components/system/use-typewriter.ts` — typewriter hook (varsayım: bu isimde, doğrulanmadı)
- `src/styles.css` — font-face/font-display tanımları
- `public/fonts/` — self-host font dosyaları (yeni, self-host kararı verilirse)

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — git reposunun kökü proje klasörüyle aynı mı ayrı bir üst dizin mi henüz teyit edilmedi. Sonraki adımlarda (plan/code-copilot/test-copilot/red-team) arama `C:\Users\YUSUF ÇİNAR\OneDrive\Belgeler\Masaüstü\projelerim\ai-interface` ile sınırlı tutulmalı, kök dizinden sınırsız arama yapılmamalı.

## Rollback Beklentisi
Lighthouse ölçümü hedefi (LCP <2.5s) tutturamazsa görev kapatılmaz; kod geri alınmaz, elde edilen kısmi iyileştirme commit edilir ve kalan fark için yeni bir Saga alt-görevi (örn. font subsetting, kritik CSS inlining) açılır.

## Risks
- Boot animasyonunun h1'den ayrıştırılması, mevcut görsel/sıralı akışı (command → boot lines → isim) bozabilir; tasarım kararı `plan` adımında netleştirilmeli.
- Self-host font'a geçiş SIL Open Font License'a uygun olmalı — lisans dosyası (varsa) korunmalı.

## Assumptions
- `use-typewriter.ts` dosya adı/yolu kod okumasıyla doğrulanmadı, Hero.tsx'teki import'tan (`./use-typewriter`) çıkarıldı — varsayım.
- Font self-host kararı henüz verilmedi; hem self-host+preload hem de mevcut Google Fonts + `rel=preload` gibi alternatifler `plan` adımında değerlendirilebilir.

## Unknowns
- Self-host mu yoksa Google Fonts + preload/display=optional stratejisi mi tercih edilecek — `plan` adımında teknik karar verilecek.
- Boot animasyonunun yeni görsel tasarımı (h1'den nasıl ayrıştırılacağı) — `plan`/`frontend-pipeline` adımında netleşecek.

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → Site ziyaretçisi (özellikle mobil/yavaş ağ üzerinden ilk kez gelen ziyaretçi) — LCP doğrudan kullanıcının "sayfa yüklendi" algısını etkiler. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
2. Ana hedef/neden → İkisi de: gerçek kullanıcı deneyimi birincil, SEO/Core Web Vitals ikincil sonuç. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
3. Happy path → h1 ilk boyamada tam metinle görünür; boot animasyonu kaldırılmaz ama LCP'yi artık geciktirmeyen ayrı bir efekt haline getirilir. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
4. Edge case (throttle) → Mobil 4x CPU + slow 4G altında bile h1 Element Render Delay <200ms hedefinde kalmalı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
5. Edge case (font başarısız) → FOUT tercih edilir, h1 hiçbir koşulda fontu bekleyerek gizli kalmaz. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
6. Davranış sözleşmesi → yukarıdaki tabloya işlendi. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
7. Başarı ölçütü → LCP <2.5s korunur, Element Render Delay için ayrı <200ms hedefi eklendi. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
8. Kapsam dışı → TerminalWindow yeniden tasarımı, diğer sayfaların LCP'si, animasyon sisteminin kaldırılması, code-splitting, diğer Lighthouse kategorileri. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
9. Etkilenen dosyalar → Hero.tsx, __root.tsx, use-typewriter hook, styles.css, gerekirse public/fonts/. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
10. Performans/güvenlik kısıtı → JetBrains Mono + Space Grotesk SIL Open Font License, self-host serbest; sadece kullanılan weight/subset (latin), woff2, birkaç yüz KB sınırı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
11. Rollback beklentisi → Hedef tutturulamazsa kod geri alınmaz, kısmi iyileştirme commit edilir, kalan fark yeni Saga görevi olarak açılır. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
12. Test stratejisi → unit 15% / integration 15% / e2e-lighthouse 70%. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
