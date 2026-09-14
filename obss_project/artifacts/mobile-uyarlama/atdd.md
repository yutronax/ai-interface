---
task_slug: mobile-uyarlama
jira_id: null
saga_task_id: 388
threat_model: not-applicable
priority: medium
coverage_target: 80
performance_target: null
memory_target: null
test_strategy:
  unit: 35
  integration: 15
  e2e: 50
affected_modules:
  - src/components/system/Hero (typewriter + CTA)
  - src/components/system/AiPipeline.tsx
  - src/components/system/Projects.tsx
  - src/components/system/GitHubSection.tsx
  - src/components/system/Footer.tsx
  - Tailwind CSS class'ları / global CSS
---

# ATDD — mobile-uyarlama

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga task #388).

## Saga Kaynağı
[Saga #388](mcp://saga/task/388) — "ai-interface - mobile uyarlama", epic 56
(Prod altyapı ve sistem yükseltme), priority: medium, status: todo.
Açıklama (birebir): "Portfolyo sitesinin mobil (özellikle <768px) görünümü
uçtan uca gözden geçirilmeli: terminal/grid estetiği, AI-Native Pipeline'ın
tıkla-genişlet kartları, Projects/GitHubSection tabloları ve Hero'daki
typewriter/CTA alanı küçük ekranda test edilmeli. Layout kırılması,
taşan/kesilen metin, dokunma hedefi boyutları (≥24×24px) ve yatay scroll
olup olmadığı kontrol edilmeli."

## Persona
Mobilden portfolyoya bakan recruiter/işveren — iş görüşmesi sonrası veya
paylaşılan link üzerinden telefondan göz atan biri. (Sonnet 5 low alt-ajanı
tarafından yanıtlandı: proje bir portfolyo sitesi olduğu için birincil
ziyaretçi tipi budur, masaüstü zaten ayrı bir akış.)

## Hedef (Neden)
Mobil ziyaretçinin layout kırılması/taşan metin/yatay scroll yüzünden
siteyi terk etmesini önlemek. (Sonnet 5 low alt-ajanı tarafından yanıtlandı:
terminal estetiği ve tablo/kart bileşenleri masaüstü için tasarlanmış,
küçük ekranda güven veren bir izlenim bırakmak birincil iş hedefi.)

## User Story
As a mobilden bakan recruiter/işveren
I want portfolyo sitesini telefonumda kırılmadan, taşmadan, rahatça
dokunarak gezebilmek
So that siteyi terk etmeden içeriği (proje kanıtları, GitHub verisi, iletişim
CTA'sı) güvenle inceleyebileyim

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given 375px-428px arası bir viewport, When kullanıcı Hero'dan
   Footer'a kadar tüm section'ları (Hero, AiPipeline, Projects, GitHubSection,
   Footer) kaydırarak gezer, Then hiçbir noktada sayfa gövdesi yatay scroll
   yapmaz ve hiçbir metin/kart viewport genişliğini aşmaz.
2. [Critical] Given AI-Native Pipeline kartları mobilde, When kullanıcı bir
   karta dokunur, Then kart tıkla-genişlet davranışı (mevcut `onClick`/
   `role="button"`/klavye desteği) hover'a bağımlı olmadan dokunmayla çalışır
   ve genişleyen içerik diğer kartları taşırmadan yer açar.
3. [High] Given GitHubSection'ın masaüstü `sm:grid-cols-6` tablo düzeni,
   When viewport 640px altına iner, Then tablo ya `overflow-x-auto` ile
   kontrollü yatay scroll'a sahip ayrı bir konteynerde ya da kart/liste
   görünümüne dönüşerek render edilir — sütunlar üst üste binmez, veri
   kesilmez.
4. [High] Given uzun proje adı/metrik metni (örn. uzun repo adı veya
   sayı+birim), When Projects/GitHubSection kartlarında render edilir,
   Then metin `truncate`/`break-words` ile kontrol altına alınır, yatay
   scroll'a yol açmaz.
5. [Medium] Given tüm interaktif öğeler (CTA, kart, link, buton), When
   375px-428px viewport'ta ölçülür, Then dokunma hedefi ≥24×24px'dir
   (WCAG target-size, projenin önceki denetim pratiğiyle tutarlı).
6. [Medium] Given mevcut Vitest+RTL accessibility testleri (target-size,
   color-contrast, heading-order), When mobil CSS değişiklikleri sonrası
   çalıştırılır, Then hiçbiri kırmızıya düşmez.

## Threat Model
Tetikleyici yok — değerlendirilen tetikleyiciler: kimlik doğrulama/
yetkilendirme, kullanıcı girdisi, dosya yükleme/indirme, ödeme, kişisel veri
(KVKK), çok kiracılı sınır, dış API çağrısı, arka plan işi, yeni HTTP ucu.
Hiçbiri uymadı çünkü bu görev saf CSS/responsive-layout değişikliği —
GitHubSection'ın dış API çağrısı (`fetchGitHubStats`) zaten var olan, bu
görevde değiştirilmeyen bir veri katmanı; yeni girdi/yetkilendirme/uç
eklenmiyor.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Görsel/DOM davranışı | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path (375-428px, tüm section'lar) | Tüm section'lar tek sütuna düşer, hiçbir öğe viewport genişliğini aşmaz | Yok | Düzgün akan, taşmasız, dokunması kolay bir sayfa | AC-1 |
| 2 | GitHubSection API verisi mobilde de çekilemezse | Masaüstündeki mevcut hata/loading state'i mobilde de aynı şekilde render edilir, layout kırılmaz | Yok (mevcut davranış korunur, bu görev veri katmanına dokunmuyor) | Var olan hata/boş durum mesajı, mobil genişlikte de düzgün konumlanmış | AC-3 |
| 3 | Kısmi başarı (bazı section'lar mobilde düzelir, bazıları düzelmez) | Görev "tamamlanmadı" sayılır — kabul kriteri 5 section'ın tamamını kapsıyor | Yok | Düzelmeyen section'da hâlâ taşma/kırılma görülür, commit/PR onaylanmaz | AC-1..5 |
| 4 | Hiçbir şey yapılamadı ama hata da yok (görsel olarak "iyi görünüyor" ama gerçek/yakın-gerçek viewport'ta doğrulanmadı) | Kabul kriteri karşılanmamış sayılır — sadece kod okuma/varsayım yeterli değil | Yok | "Çalışıyor gibi" görünse de doğrulama adımı (Playwright/vision-test screenshot, gerçek viewport) eksik olduğu için görev kapanmaz | AC-1 |

Uygulanmayan satırlar silindi: "Girdi geçersiz/eksik", "Kaynak yok",
"Yetkisiz erişim", "Zaman aşımı" — bu görev kullanıcı girdisi almayan, yeni
veri kaynağı sorgulamayan, yetkilendirme içermeyen saf bir CSS/responsive-
layout değişikliği; bu senaryoların hiçbiri uygulanabilir değil. (Sonnet 5
low alt-ajanı tarafından yanıtlandı.)

Kısmi başarı: Yukarıdaki tabloda #3 — görev tüm 5 section kapsanmadan
tamamlanmış sayılmaz.
Hiçbir şey yapılamadı ama hata da yok: Yukarıdaki tabloda #4 — sessiz
"iyi görünüyor" kabul edilmez, gerçek/yakın-gerçek viewport doğrulaması
zorunlu.
Boş sonuç ↔ hata ayrımı: Bu görevde uygulanamaz (veri dönen bir uç yok) —
GitHubSection'ın kendi boş/hata ayrımı zaten mevcut kod tabanında var ve bu
görevin kapsamı dışında.

## Test Strategy
Unit/Component: 35% — Hero, AiPipeline, Projects, GitHubSection, Footer
bileşenlerinin mobil viewport'ta render testleri (RTL + jsdom viewport
mock), mevcut target-size/color-contrast/heading-order testlerinin mobil
class'larla da geçmesi.
Integration: 15% — section'lar arası geçiş (scroll sırası, section'ların
birbirini itmemesi) render testleri.
E2E/Görsel doğrulama: 50% — Playwright/`vision-test` skill'iyle 375px,
390px, 428px viewport'larında gerçek screenshot doğrulaması (CSS kırılması
DOM testinde değil ekranda görülür, bu yüzden ağırlık görsele kaydırıldı).
(Sonnet 5 low alt-ajanı tarafından yanıtlandı: projenin önceki accessibility
denetim pratiğiyle tutarlı, görsel ağırlıklı varsayılan.)

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: yok (saf CSS/layout görevi, ek risk: CSS bundle
boyutunun şişmemesi — varsayım, kanıtlanmamış risk)
Memory: yok
Görsel/UI kriteri: 375px, 390px, 428px viewport'larında test edilen 5
section'ın (Hero, AiPipeline, Projects, GitHubSection, Footer) hiçbirinde
body yatay scroll yok; tüm tıklanabilir/dokunulabilir öğeler ≥24×24px;
mevcut Vitest+RTL target-size/color-contrast testleri kırmızı olmadan
geçiyor. Bu kriter `verify` adımında `vision-test` skill'iyle kontrol
edilmeli.
Diğer ölçülebilir kriterler: —

## Kapsam Dışı
Tablet-özel layout (768-1024px arası özel optimizasyon), landscape mobil
yönlendirme, eski tarayıcı (IE/Safari<14) desteği, GitHubSection'ın
veri/API mantığının (fetchGitHubStats) değiştirilmesi. (Sonnet 5 low
alt-ajanı tarafından yanıtlandı: görev açıkça "mobil <768px" ile sınırlı,
veri katmanına dokunulmayacağı belirtilmiş.)

## Etkilenen Dosyalar/Modüller (bilinen)
- Hero bileşeni (typewriter + CTA)
- src/components/system/AiPipeline.tsx
- src/components/system/Projects.tsx
- src/components/system/GitHubSection.tsx
- src/components/system/Footer.tsx
- İlgili Tailwind class'ları / global CSS
(Yeni dosya oluşturulması beklenmiyor, mevcut componentler düzenlenecek.)

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu makinede git reposunun kökünün proje klasörüyle (`ai-interface`)
aynı olup olmadığı bu oturumda ayrıca kontrol edilmedi. Sonraki adımlarda
(`plan`, `code-copilot`, `test-copilot`, `red-team`) arama HER ZAMAN
`ai-interface` proje klasörüyle sınırlanmalı; sınırsız arama
(`git log -p --all`, kök dizinden `grep -r`, tam-repo indexleme) devasa
geçmişi/ilgisiz dosyaları tarayıp RAM'i tüketebilir.

## Rollback Beklentisi
Yeni bir kırılma tespit edilirse ilgili commit revert edilir, sorunlu
breakpoint/class not edilip görev yeniden açılır (projenin git tabanlı basit
workflow'una uygun varsayılan — Sonnet 5 low alt-ajanı tarafından
yanıtlandı).

## Risks
- CSS/responsive-layout değişikliğinin CSS bundle boyutunu şişirme riski
  (minimal, kanıtlanmamış varsayım).
- AI-Pipeline'ın tıkla-genişlet davranışı mobilde dokunmayla karışabilir
  eğer mevcut implementasyon hover'a bağımlı bir yan-davranış içeriyorsa
  (kod okunmadan varsayılan risk — `plan` adımında doğrulanmalı,
  AiPipeline.tsx zaten `role="button"`/`onClick`/klavye desteğine sahip
  görünüyor ama mobilde gerçek dokunma testi yapılmalı).

## Assumptions
- GitHubSection'ın mobil çözümü (yatay scroll konteyner mi, kart/liste
  görünümüne dönüşüm mü) henüz kararlaştırılmamış — implementasyon
  aşamasında (`plan`) netleştirilmeli.
- Performans/güvenlik kısıtı yok/minimal varsayıldı (veri katmanına veya
  kimlik doğrulamaya dokunulmuyor).
- Kabul kriteri sahibi: kullanıcı (yusuf21cinar21@gmail.com) + mevcut
  otomatik testler (Vitest/RTL target-size, color-contrast) — Lighthouse
  mobile skorunun CI'da otomatik koşulup koşulmadığı bilinmediği için nihai
  onay insan + mevcut otomatik test kombinasyonu olarak varsayıldı.

## Unknowns
- Gerçek cihazda (simülatör/emülatör değil) test yapılıp yapılmayacağı
  belirtilmedi — sadece viewport emülasyonu (Playwright/vision-test)
  varsayıldı.

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → Mobilden portfolyoya bakan recruiter/işveren.
   (Sonnet 5 low alt-ajanı tarafından yanıtlandı: proje bir portfolyo sitesi
   olduğu için birincil ziyaretçi tipi budur.)
2. Ana hedef/"neden" → Mobil ziyaretçinin layout kırılması/taşan metin/
   yatay scroll yüzünden siteyi terk etmesini önlemek. (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı.)
3. Happy path senaryosu → Hero'dan Footer'a kadar tüm section'lar 375px'te
   taşmadan, kırılmadan, dokunulabilir şekilde akar. (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı.)
4. Edge case'ler → (a) uzun metin taşması `truncate`/`break-words` ile
   kontrol altına alınmalı, (b) GitHubSection tablosu <640px'te sütun
   çakışması yaşamamalı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
5. Davranış sözleşmesi → yukarıdaki tablo. (Sonnet 5 low alt-ajanı
   tarafından yanıtlandı.)
6. Başarı ölçütü/benchmark → 375-428px'te yatay scroll yok, dokunma
   hedefleri ≥24×24px, mevcut a11y testleri geçiyor. (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı: mevcut test altyapısıyla doğrulanabilir
   olduğu için seçildi.)
7. Kapsam dışı → tablet-özel layout, landscape mobil, eski tarayıcı desteği,
   GitHubSection veri/API mantığı. (Sonnet 5 low alt-ajanı tarafından
   yanıtlandı: görev açıkça "mobil <768px" ile sınırlı.)
8. Bağımlılıklar/etkilenen dosyalar → Hero, AiPipeline.tsx, Projects.tsx,
   GitHubSection.tsx, Footer.tsx, Tailwind class'ları. (kullanıcı
   mesajından/Saga task açıklamasından — tekrar sorulmadı.)
9. Performans/güvenlik kısıtı → yok/minimal. (Sonnet 5 low alt-ajanı
   tarafından yanıtlandı: veri katmanına/kimlik doğrulamaya dokunulmuyor.)
10. Rollback beklentisi → commit revert + görev yeniden açma. (Sonnet 5 low
    alt-ajanı tarafından yanıtlandı: projenin basit git workflow'una uygun.)
11. Kabul kriteri sahibi → kullanıcı + mevcut otomatik testler. (Sonnet 5
    low alt-ajanı tarafından yanıtlandı.)
12. Test stratejisi oranı → unit/component 35%, integration 15%,
    e2e/görsel 50%. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: CSS
    kırılması ekranda görülür, görsel doğrulamaya ağırlık verildi.)
13. Bilinen riskler/varsayımlar/bilinmeyenler → GitHubSection mobil çözümü
    kararlaştırılmadı (varsayım), gerçek cihaz testi belirtilmedi
    (bilinmeyen), tıkla-genişlet'in hover bağımlılığı riski. (Sonnet 5 low
    alt-ajanı tarafından yanıtlandı.)
