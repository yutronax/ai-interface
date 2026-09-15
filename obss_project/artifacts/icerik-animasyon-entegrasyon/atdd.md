---
task_slug: icerik-animasyon-entegrasyon
jira_id: null
saga_task_id: 391
threat_model: done
priority: medium
coverage_target: 80
performance_target: null
memory_target: null
test_strategy:
  unit: 75
  integration: 25
  e2e: 0
affected_modules:
  - src/lib/github-api.ts
  - src/lib/github-api.test.ts
  - src/components/system/GitHubSection.tsx
  - src/components/system/Projects.tsx
  - src/components/system/Experience.tsx
---

# ATDD — icerik-animasyon-entegrasyon

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga task #391).

## Saga Kaynağı
[Saga #391](mcp://saga/task/391) — "ai-interface - araştırılan içerik/animasyonları
webe ekle", epic 50 (Tasarım denetimi ve içerik kararları), priority: medium.
Bağımlılıklar: Saga #389 (animasyon araştırması, done), Saga #390 (GitHub içerik
araştırması, done). Bu görev o iki araştırmanın somut bulgularını uygular.

## Araştırma Kaynakları (birebir referans, tekrar sorgu atılmadı)
- [research.md](../animasyon-arastirma/research.md) — Saga #389, animasyon türleri.
- [github-research.md](../animasyon-arastirma/github-research.md) — Saga #390, GitHub içerik.

## Persona
Yusuf Çınar (proje sahibi/tek geliştirici) — ama bu değişikliğin gerçek
"tüketicisi" siteyi ziyaret eden işe alım görevlisi/teknik değerlendirici:
Projects kartlarına, Experience metriklerine ve GitHub tablosuna bakarken bu
değişiklikleri deneyimleyecek kişi o. (Sonnet 5 low alt-ajanı tarafından
yanıtlandı.)

## Hedef (Neden)
Sitenin "canlı/gerçek/güvenilir" hissettirmesini artırmak: statik veriyi
gerçek GitHub verisine bağlamak (güvenilirlik) + mevcut animasyon diline
tutarlı micro-interaction eklemek (cila) + sayaçların gerçek kullanıcı
deneyiminde bozuk görünmediğini garanti etmek (regresyon önleme). (Sonnet 5
low alt-ajanı tarafından yanıtlandı.)

## User Story
As a portfolyo ziyaretçisi (işe alım görevlisi/teknik değerlendirici)
I want proje kartlarında akıcı bir hover geri bildirimi, doğru çalışan
deneyim sayaçları ve gerçek GitHub repo verisi görmek
So that sitenin "gerçek sistem" metaforuna güvenip içeriğe daha çok inanayım

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)

### GitHub repo tablosu → canlı veri
1. [Critical] Given `fetchGitHubStats()`'ın zaten çektiği `/users/yutronax/repos`
   yanıtı, When yeni `fetchGitHubRepoDetails()` bu yanıtı parse eder, Then
   `description`/`language`/`pushed_at`/`html_url` alanlarını içeren bir
   `GitHubRepoDetail[]` döner — **yeni bir HTTP isteği yapılmaz** (mevcut
   `fetchGitHubStats()` çağrısıyla aynı response'u paylaşır veya aynı cache
   penceresinde tekrar kullanır).
2. [Critical] Given `GitHubSection.tsx`, When `fetchGitHubRepoDetails()`
   başarıyla veri döner, Then repo tablosu `portfolio-data.ts::REPOS` yerine
   bu canlı veriyi render eder.
3. [High] Given API çağrısı başarısız olur (403/429/network/malformed —
   AC-2 ile aynı sözleşme), When `fetchGitHubRepoDetails()` çağrılır, Then
   sessizce `REPOS` sabitine düşer, throw etmez (mevcut `fetchGitHubStats()`
   davranış sözleşmesiyle birebir tutarlı).
4. [Medium] Given bir repo'da `description` veya `language` alanı `null`,
   When tabloda render edilir, Then o hücre için `"—"` placeholder gösterilir,
   satır atlanmaz/kırılmaz.

### Projects hover micro-interaction
5. [Medium] Given bir proje kartındaki "OPEN ON GITHUB"/evidence linki, When
   kullanıcı üzerine hover eder, Then ok ikonu (`↗`/`→`) hafifçe sağa kayar
   (`transform: translateX`), mouse çekilince eski konuma döner.
6. [Medium] Given `prefers-reduced-motion: reduce` açık, When aynı link
   hover edilir, Then translateX geçişi (transition) devre dışı kalır —
   ok anında (0ms) hedef konuma geçer ya da hiç hareket etmez.

### Experience sayaçları — gerçek scroll doğrulaması
7. [Critical] Given Experience bölümündeki sayaçlar (MESSAGES/DAY,
   AUTOMATION%, RESPONSE LATENCY), When kullanıcı organik (gerçek, adım adım)
   scroll ile bu bölüme ulaşır, Then sayaçlar `whileInView` tetiklenip
   0'dan hedef değere animasyonlu sayar — **"0" takılı kalmaz** (Saga #388'de
   sadece programatik `scrollIntoView()` jump-scroll'da gözlenen "0" sorunu
   gerçek scroll'da doğrulanmalı; kök neden bulunursa düzeltilmeli).
8. [Medium] Given `prefers-reduced-motion: reduce` açık, When Experience
   bölümü görünür olur, Then sayaçlar doğrudan hedef değerde render edilir
   (count-up animasyonu atlanır).

### Güvenlik (threat-model, dış API çağrısı tetikleyicisi)
9. [High] **AC-S1** — Given GitHub API yanıtındaki `description` alanı
   HTML/script benzeri bir dize içerse bile (örn. mock yanıt:
   `description: "<img src=x onerror=alert(1)>"`), When `GitHubSection.tsx`
   bunu render eder, Then React'in otomatik metin kaçışı kullanılır
   (`dangerouslySetInnerHTML` KULLANILMAZ) — DOM'da script çalışmaz, sadece
   literal metin görünür. Test: bu mock senaryosuyla component test edilir,
   `container.innerHTML`'de ham `<img>`/`<script>` etiketi aranmaz, sadece
   kaçışlanmış metin (`&lt;img...`) beklenir.

## Threat Model
Çağrıldı — tetikleyici: **dış API çağrısı** (GitHub REST API yanıtı
`GitHubSection.tsx`'e render ediliyor). STRIDE-lite geçildi:
- **Spoofing:** N/A — kimlik doğrulama yok, herkese açık salt-okunur veri. Atlandı.
- **Tampering:** Düşük risk — veri kaynağı Yusuf'un kendi GitHub hesabındaki
  public repo'lar (saldırgan kontrolünde değil), ama yine de savunmacı bir AC
  yazıldı (AC-S1, XSS'e karşı).
- **Repudiation:** N/A — yazma işlemi yok. Atlandı.
- **Info disclosure:** Kabul edilen risk olarak Risks bölümüne yazıldı (aşağıda) —
  unauthenticated `/users/:user/repos` endpoint'i yapısal olarak sadece public
  repo döndürür, private repo sızıntısı mimari olarak mümkün değil.
- **DoS:** N/A — yeni istek eklenmiyor (AC-1), mevcut 1 saatlik cache/timeout
  korunuyor. Atlandı.
- **Elevation:** N/A — yetkilendirme/rol yok. Atlandı.
AC-S1, yukarıdaki Acceptance Criteria listesine eklendi (madde 9).

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / DOM davranışı | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path — 3 değişikliğin hepsi | `fetchGitHubRepoDetails()` canlı veri döner; hover'da ok translateX; sayaçlar 0→hedef animasyonlu | Yok (1 saatlik cache) | Güncel repo tablosu, akıcı hover, doğru çalışan sayaçlar | AC-1,2,5,7 |
| 2 | GitHub API repo detaylarını döndüremez (403/429/network/malformed) | `fetchGitHubRepoDetails()` `REPOS` sabitine sessizce düşer, throw etmez | Yok | Statik/eski ama tutarlı repo tablosu, hata mesajı yok | AC-3 |
| 3 | Repo'da description/language alanı null/eksik | İlgili hücre için `"—"` placeholder render edilir, satır düşmez | Yok | Eksik alan görünür şekilde boş/placeholder, tablo kırılmaz | AC-4 |
| 4 | prefers-reduced-motion açık | Hover translateX transition'ı ve sayaç count-up animasyonu atlanır, hedef değer doğrudan render edilir | Yok | Ok statik konumda, sayaçlar direkt hedef değerde | AC-6,8 |
| 5 | Kısmi başarı (stats çalışır, repo-detail parse başarısız) | `fetchGitHubStats()` sonucu kullanılmaya devam eder, `fetchGitHubRepoDetails()` ayrı olarak `REPOS`'a düşer | Yok | Üst istatistikler güncel, repo tablosu statik — iki veri kaynağı birbirinden bağımsız bozulabilir | AC-3 |
| 6 | Hiçbir şey yapılamadı ama hata da yok (görsel "iyi görünüyor" ama gerçek scroll/QA doğrulaması yapılmadı) | N/A — kod davranışı değil, test/QA açığı | Regresyon riski (Saga #388'deki mobil sayaç sorunu gibi) fark edilmeden kalabilir | Kullanıcı normalde görür ama `verify` adımında gerçek scroll doğrulaması ZORUNLU (AC-7 sadece kod okumayla kapatılamaz) | AC-7 |

Kısmi başarı: Yukarıdaki tabloda #5 — `fetchGitHubStats()` (üst özet sayılar)
ve `fetchGitHubRepoDetails()` (repo tablosu) birbirinden bağımsız başarı/
başarısızlık durumuna sahip, biri diğerini etkilemez.
Hiçbir şey yapılamadı ama hata da yok: Yukarıdaki tabloda #6 — AC-7 (sayaç
doğrulaması) sadece kod okuyarak "düzeldi" denemez, gerçek/organik scroll
testiyle (Playwright veya manuel) kanıtlanmalı.
Boş sonuç ↔ hata ayrımı: `fetchGitHubRepoDetails()` boş dizi `[]` (repo yok,
geçerli durum) ile hata (fallback'e düşme) arasında aynı ayrımı
`fetchGitHubStats()`'ın AC-3'ü (mevcut kod) zaten yapıyor — aynı pattern
tekrar kullanılacak (boş API yanıtı → boş sonuç kabul edilir, throw/hata
değildir).

## Test Strategy
Unit: 75% — `github-api.test.ts`'e `fetchGitHubRepoDetails()` için mock
fetch senaryoları (başarılı, 403/429, malformed, network error, null
description/language) eklenir; mevcut dosyanın pratiğiyle tutarlı.
Integration: 25% — `GitHubSection.tsx` (canlı veri render + fallback +
AC-S1 XSS testi) ve `Projects.tsx` (hover micro-interaction + reduced-motion)
için RTL component testleri.
E2E: 0% — projede e2e altyapısı yok, kapsam dışı. AC-7 (sayaç gerçek-scroll
doğrulaması) `verify` adımında Playwright/`vision-test` ile manuel/yarı-otomatik
doğrulanacak (bu, klasik "e2e test dosyası" değil, verify gate'inin bir
parçası — bkz. Benchmark bölümü).

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: yok (yeni istek eklenmiyor, mevcut rate limit/cache
sözleşmesi korunuyor)
Memory: yok
Görsel/UI kriteri: (1) GitHubSection tablosu canlı veriyle render ediliyor
ve fallback'e düşse bile kırılmıyor: `verify` adımında `vision-test` ile
kontrol edilmeli. (2) Experience sayaçlarının GERÇEK scroll'da 0'da
kalmadığı `verify` adımında Playwright ile organik scroll simülasyonuyla
doğrulanmalı — bu AC sadece unit testle kapatılamaz.
Diğer ölçülebilir kriterler: AC-S1 (XSS) component testi kırmızı olmadan
geçmeli.

## Kapsam Dışı
Saga #389'dan: yeni glitch/scramble metin efekti, native CSS
scroll-timeline'a geçiş, parallax arka plan.
Saga #390'dan: `scrapling` (Python kütüphanesi, yabancı stack), GraphQL'e
geçiş (kimliksiz kullanılamıyor), README özeti/dil yüzdesi/katkı grafiği
(build-time+token gerektirir, ayrı görev olmalı).
(Sonnet 5 low alt-ajanı tarafından yanıtlandı — iki araştırma raporunun
"AÇIKÇA REDDEDİLEN" listeleri birebir taşındı.)

## Etkilenen Dosyalar/Modüller (bilinen)
- src/lib/github-api.ts (yeni `fetchGitHubRepoDetails()`)
- src/lib/github-api.test.ts (yeni mock senaryoları)
- src/components/system/GitHubSection.tsx (tabloyu canlı veriye bağla)
- src/components/system/Projects.tsx (hover micro-interaction)
- src/components/system/Experience.tsx (sayaç doğrulama/fix — kök neden
  bulunursa)
(Sonnet 5 low alt-ajanı tarafından yanıtlandı: tahmini liste, kesin liste
`plan` adımında netleşecek.)

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu makinede git reposunun kökünün proje klasörüyle
(`ai-interface`) aynı olup olmadığı bu oturumda ayrıca kontrol edilmedi.
Sonraki adımlarda arama HER ZAMAN `ai-interface` proje klasörüyle
sınırlanmalı.

## Rollback Beklentisi
`REPOS` sabiti kod tabanında fallback olarak kalmaya devam ediyor — sorun
çıkarsa `fetchGitHubRepoDetails()` çağrısını `REPOS`'a döndürmek tek satırlık
bir revert; ayrı bir feature flag gerekmiyor çünkü fallback zaten mevcut
sözleşmenin (AC-3) parçası. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)

## Risks
- **Kabul edilen risk (bilinçli, Info disclosure/STRIDE):** unauthenticated
  `/users/:user/repos` endpoint'i private repo döndürmez (GitHub API'nin
  kendi mimari garantisi) — bu proje bunu doğrulayan ek bir test yazmıyor,
  GitHub'ın kendi API sözleşmesine güveniliyor.
- GitHub REST API yanıtında `description`/`language`/`pushed_at` alanlarının
  her zaman beklenen şekilde geldiği varsayımı `plan` adımında gerçek bir
  API yanıtıyla doğrulanmalı (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
- Experience sayaçlarının "0" sorununun kök nedeni bilinmiyor (viewport/
  IntersectionObserver mı, state başlangıç değeri mi) — `plan` adımında
  debug gerekebilir, kapsam büyüyebilir (Sonnet 5 low alt-ajanı tarafından
  yanıtlandı).

## Assumptions
- Mevcut `REPOS` sabitindeki repo sayısı/sırası ile canlı API'den dönen repo
  sayısı/sırası birebir eşleşmeyebilir — filtreleme/sıralama mantığı
  `plan` adımında netleşmeli (varsayım, doğrulanmadı).

## Unknowns
- Experience sayaç sorununun kök nedeni (`plan`/implementasyon aşamasında
  netleşecek).
- GitHub API'nin gerçek yanıt şeklinin (özellikle `pushed_at` formatı,
  `language` alanının `null` olabileceği repo türleri) `plan` adımında
  örneklenmesi gerekiyor.

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → Yusuf Çınar (sahip) ama gerçek tüketici site
   ziyaretçisi (işe alım görevlisi/teknik değerlendirici). (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı.)
2. Ana hedef/"neden" → sitenin "canlı/gerçek/güvenilir" hissettirmesi +
   animasyon dili tutarlılığı + regresyon önleme. (Sonnet 5 low alt-ajanı
   tarafından yanıtlandı.)
3. Happy path → 3 değişiklik için ayrı ayrı yukarıdaki AC-1,2,5,7'de
   detaylandırıldı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
4. Edge case'ler → API hatası→fallback, prefers-reduced-motion. (Sonnet 5
   low alt-ajanı tarafından yanıtlandı.)
5. Davranış sözleşmesi → yukarıdaki tablo. (Sonnet 5 low alt-ajanı
   tarafından yanıtlandı.)
6. Başarı ölçütü → binary geçti/kaldı kriterleri (sayısal hedef yok, UI/QA
   doğrulaması). (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
7. Kapsam dışı → iki araştırma raporunun "AÇIKÇA REDDEDİLEN" listeleri
   birebir. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
8. Bağımlılıklar/etkilenen dosyalar → github-api.ts/test.ts,
   GitHubSection.tsx, Projects.tsx, Experience.tsx (tahmini). (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı.)
9. Performans/güvenlik kısıtı → yeni istek yok, rate limit etkilenmiyor;
   threat-model dış-API tetikleyicisi AC-S1'e döküldü. (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı + threat-model skill.)
10. Rollback beklentisi → REPOS zaten fallback, tek satır revert yeterli.
    (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
11. Kabul kriteri sahibi → Yusuf Çınar. (Sonnet 5 low alt-ajanı tarafından
    yanıtlandı.)
12. Test stratejisi oranı → unit 75%, integration 25%, e2e 0% (mevcut
    github-api.test.ts pratiğiyle tutarlı). (Sonnet 5 low alt-ajanı
    tarafından yanıtlandı.)
13. Bilinen riskler/varsayımlar/bilinmeyenler → API yanıt şekli varsayımı,
    sayaç kök nedeni bilinmiyor, repo sayısı/sırası eşleşmesi belirsiz.
    (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
