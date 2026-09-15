---
task_slug: tech-stack-kart-grid
jira_id: null
saga_task_id: 392
threat_model: not-applicable
priority: medium
coverage_target: 80
performance_target: null
memory_target: null
test_strategy:
  unit: 85
  integration: 15
  e2e: 0
affected_modules:
  - src/lib/portfolio-data.ts
  - src/components/system/TechStack.tsx
  - src/components/system/TechStack.test.tsx
---

# ATDD — tech-stack-kart-grid

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga task #392).

## Saga Kaynağı
[Saga #392](mcp://saga/task/392) — "ai-interface - Tech Stack bölümünü
kart/grid düzenine çevir", epic 50, priority: medium. Kullanıcı ekran
görüntüsü paylaşıp geri bildirim verdi: "ağaç tasarımı hoşuma gitmedi sanki
md dosyasından çıkma ayrıca sadece python biliyormuşuz gibi gözüküyor".
Tasarım yönü sorusuna kullanıcı **"Kart/grid düzeni"** cevabını verdi
(kullanıcı mesajından, tekrar sorulmadı).

## Persona
Yusuf'un portfolyosunu inceleyen işe alım yöneticisi/teknik değerlendirici —
mevcut ağaç yapısını "sadece Python biliniyor" diye yanlış okuyan kişi tam
bu persona, bu yüzden netlik kritik. (Sonnet 5 low alt-ajanı tarafından
yanıtlandı.)

## Hedef (Neden)
Sadece estetik değil — "çok dilli/çok araçlı" izlenimi vermek de asıl amaç.
Kullanıcının kendi ifadesi ("sadece python biliyormuşuz gibi gözüküyor")
bunu açıkça bir hedef olarak koyuyor. (Sonnet 5 low alt-ajanı tarafından
yanıtlandı.)

## User Story
As a portfolyo ziyaretçisi (işe alım yöneticisi/teknik değerlendirici)
I want Tech Stack bölümünde net, dile göre gruplanmış kart/grid bir görünüm
So that Yusuf'un gerçek çoklu-dil/çoklu-araç yetkinliğini yanlış anlamayayım

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given `TECH_GRAPH`'ın yeni veri modeli `{ language: string;
   tools: string[] }[]`, When `TechStack.tsx` render edilir, Then her dil
   kendi kartında ayrı ayrı görünür — **en az 2 dil kartı (Python,
   TypeScript) aynı anda görünür olmalı**, tek bir "Python" root'u altında
   toplanmaz.
2. [Critical] Given her dil kartı, When render edilir, Then üstte dil adı +
   `LANG_COLOR` paletinden (GitHubSection.tsx ile aynı anahtarlar:
   Python/TypeScript/Jupyter) o dile ait renk noktası, altında o dile ait
   araç/kütüphane etiketleri (chip/badge) `flex-wrap` ile listelenir.
3. [High] Given veri kaynağı sadece REPOS/PROJECTS'te **zaten geçen**
   teknolojiler (PyTorch, OpenCV, Transformers, CLIP, VQA, DeepLabV3+,
   U-Net, Rasterio, scikit-learn, NumPy, Pandas, Matplotlib, FastAPI →
   Python; React, LLM Agents → TypeScript), When TECH_GRAPH yeniden
   yazılır, Then hiçbir yeni/uydurma teknoloji eklenmez.
4. [Medium] Given bir dilin tek aracı olduğu durum (örn. şu an TypeScript
   için sadece React + LLM Agents var, 2 araç — ileride 1 araca düşerse),
   When kart render edilir, Then kart diğerleriyle aynı boyut/padding'i
   korur, boş/bozuk görünmez.
5. [Medium] Given çok uzun bir araç adı (örn. "DeepLabV3+", "scikit-learn"),
   When bir chip içinde render edilir, Then `flex-wrap`/`break-words` ile
   sarılır, kart genişliğini taşırmaz.
6. [Medium] Given `prefers-reduced-motion: reduce` açık, When bölüm görünür
   olur, Then giriş animasyonu (varsa `whileInView`) anında son duruma
   geçer — global `prefers-reduced-motion` CSS kuralı (styles.css) zaten
   bunu `transition-duration: 0.01ms` ile garantiliyor, ek kod
   gerekmeyebilir (plan adımında doğrulanmalı).
7. [High] Given 375px (mobil) viewport, When Tech Stack bölümü görüntülenir,
   Then dil kartları tek sütuna düşer, hiçbir chip/kart yatay taşmaya yol
   açmaz (bu proje mobile-uyarlama — Saga #388 — ile aynı disiplin).

## Threat Model
Tetikleyici yok — değerlendirilen tetikleyiciler: kimlik doğrulama/
yetkilendirme, kullanıcı girdisi, dosya yükleme/indirme, ödeme, kişisel
veri (KVKK), çok kiracılı sınır, dış API çağrısı, arka plan işi, yeni HTTP
ucu. Hiçbiri uymadı çünkü bu görev saf statik-veri + UI/CSS-layout
değişikliği — dışarıdan veri çekmiyor, kullanıcı girdisi almıyor, yeni bir
uç/endpoint eklemiyor.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Görsel/DOM davranışı | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path — çok dilli kart grid render edilir | `grid`/`flex` içinde her dil için bir kart, en az 2 kart (Python, TypeScript) | Yok (statik render) | Python ve TypeScript kartlarını, altlarında ilgili araç chip'lerini net görür | AC-1,2 |
| 2 | Bir dilin tek aracı var | Kart yine aynı min-height/padding'i korur, tek chip render edilir, boş alan bırakmaz | Yok | Kart diğerleriyle aynı boyutta, eksik/bozuk görünmez | AC-4 |
| 3 | Çok uzun araç adı bir karta sığmıyor | Chip `flex-wrap` ile satır kaydırır, kart genişliğini aşmaz | Yok | Uzun isim okunaklı şekilde alt satıra geçer, taşma olmaz | AC-5 |
| 4 | prefers-reduced-motion açık | Giriş animasyonu anında/instant render'a düşer | Yok | Kartlar animasyonsuz doğrudan görünür | AC-6 |

Kısmi başarı: Uygulanmaz — statik veri map'i (`tools.map`) üzerinden render
ediliyor, async/network yok; bir kartın render'ı diğerini etkileyecek
paylaşılan state mimaride yok. (Sonnet 5 low alt-ajanı tarafından
yanıtlandı.)
Hiçbir şey yapılamadı ama hata da yok: Bu görevde "sessiz başarısızlık"
riski kod seviyesinde değil, **doğrulama seviyesinde** yatıyor — "kartlar
iyi görünüyor" iddiası sadece kod okuyarak kapatılamaz, `verify` adımında
gerçek tarayıcıda (375px + masaüstü) ekran görüntüsü/vision-test ile
kanıtlanmalı (bkz. Benchmark bölümü, Görsel/UI kriteri). Bu satır
silinmedi, Benchmark'a taşındı çünkü statik bir render görevinde bu
riskin gerçek karşılığı budur.
Boş sonuç ↔ hata ayrımı: Uygulanmaz — veri kaynağı sabit dizi, "boş
sonuç"/"hata" ayrımı gerektiren bir sorgu/istek yok.

## Test Strategy
Unit/Component: 85% — `TechStack.test.tsx` (yeni): kart sayısı (≥2 dil),
her kartın doğru `tools` listesini render ettiği, `LANG_COLOR` renk
eşleşmesi, uzun araç adının `flex-wrap` class'ına sahip olduğu, tek-araçlı
dil kartının render'ının kırılmadığı.
Integration: 15% — mevcut route/index testleriyle (varsa) TechStack'in
sayfaya doğru monte edildiğinin doğrulanması.
E2E: 0% — statik bölüm, kullanıcı etkileşimi/network yok; AC-7 (mobil
taşma) `verify` adımında Playwright ile görsel doğrulanacak (klasik e2e
test dosyası değil, verify gate'inin parçası).

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: yok
Memory: yok
Görsel/UI kriteri: (1) En az 2 farklı dil kartı (Python + TypeScript) aynı
anda görünür olmalı — `verify` adımında ekran görüntüsüyle doğrulanmalı.
(2) 375px genişlikte kartlar yatay taşma olmadan tek sütuna düşmeli. (3)
Hiçbir chip kart sınırını taşmamalı. Üçü de sadece kod okumayla değil,
gerçek tarayıcı ekran görüntüsüyle kanıtlanmalı.
Diğer ölçülebilir kriterler: —

## Kapsam Dışı
Yeni dil/araç eklenmeyecek — sadece REPOS/PROJECTS'te zaten geçen
teknolojiler karta girecek. `TECH_GRAPH` dışındaki bileşenlere
(GitHubSection, Projects) dokunulmayacak. `LANG_COLOR` paleti sadece
referans alınacak/paylaşılacak, yeniden tanımlanmayacak. (Sonnet 5 low
alt-ajanı tarafından yanıtlandı, kullanıcının "kapsam dışı" onayı zımni.)

## Etkilenen Dosyalar/Modüller (bilinen)
- src/lib/portfolio-data.ts (`TECH_GRAPH` → `{ language, tools }[]` modeline
  geçer)
- src/components/system/TechStack.tsx (ağaç render'ı yerine kart/grid)
- src/components/system/TechStack.test.tsx (yeni)
- `LANG_COLOR` paylaşımı gerekiyorsa: şu an `GitHubSection.tsx` içinde
  tanımlı — `plan` adımında ortak bir yere (örn. `portfolio-data.ts` veya
  `lib/lang-color.ts`) taşınıp taşınmayacağı netleşmeli.

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu oturumda ayrıca kontrol edilmedi. Sonraki adımlarda arama
HER ZAMAN `ai-interface` proje klasörüyle sınırlanmalı.

## Rollback Beklentisi
Basit revert — eski `TECH_GRAPH` + ağaç render'ı git history'de duruyor,
sorun çıkarsa commit revert edilir; ayrı bir feature flag gerekmez.
(Sonnet 5 low alt-ajanı tarafından yanıtlandı.)

## Risks
- Mevcut scroll-pin animasyon mimarisi (`useSectionProgress(ref, "pin")`,
  `h-[260vh]` sticky section) ağaç dallarının sırayla belirmesi için
  tasarlanmıştı — kart/grid düzeninde bu pin-scroll mekanizması anlamsız
  kalabilir. **Varsayım (netleşmemiş, plan adımında teyit edilmeli):**
  scroll-pin kaldırılıp basit `whileInView`/fade-in geçişe geçilecek.
  (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)

## Assumptions
- `LANG_COLOR` paletinin GitHubSection.tsx ile aynı anahtarları
  (Python/TypeScript/Jupyter) kullanacağı varsayıldı — tek renk kaynağı,
  tutarlılık. Paylaşım mekanizması (import mı, kopya mı) `plan` adımında
  netleşecek.
- Scroll-pin'in kaldırılıp basit fade-in'e geçileceği varsayıldı (bkz.
  Risks) — kullanıcı onaylamadı, `plan` adımında teyit edilmeli.

## Unknowns
- `LANG_COLOR`'ın ortak bir dosyaya taşınıp taşınmayacağı.
- Scroll-pin mimarisinin tam olarak nasıl basitleştirileceği (plan
  adımında netleşecek).

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → işe alım yöneticisi/teknik değerlendirici.
   (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
2. Ana hedef/"neden" → estetik + "çok dilli" izlenimi vermek (kullanıcının
   kendi ifadesinden). (kullanıcı mesajından + Sonnet 5 low alt-ajanı.)
3. Happy path → en az 2 dil kartı (Python, TypeScript), üstte dil+renk,
   altta araç chip'leri. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
4. Veri modeli → `{ language: string; tools: string[] }[]`, LANG_COLOR
   anahtarlarıyla tutarlı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
5. Edge case'ler → tek araçlı dil kartı, uzun araç adı taşması. (Sonnet 5
   low alt-ajanı tarafından yanıtlandı.)
6. Davranış sözleşmesi → yukarıdaki tablo. (Sonnet 5 low alt-ajanı
   tarafından yanıtlandı.)
7. Başarı ölçütü → ≥2 dil kartı görünür, 375px'te taşma yok. (Sonnet 5 low
   alt-ajanı tarafından yanıtlandı.)
8. Kapsam dışı → yeni teknoloji eklenmeyecek, diğer bileşenlere
   dokunulmayacak. (Sonnet 5 low alt-ajanı tarafından yanıtlandı.)
9. Bağımlılıklar/etkilenen dosyalar → TechStack.tsx, portfolio-data.ts,
   TechStack.test.tsx (yeni). (Sonnet 5 low alt-ajanı tarafından
   yanıtlandı.)
10. Performans/güvenlik kısıtı → yok. (Sonnet 5 low alt-ajanı tarafından
    yanıtlandı.)
11. Rollback beklentisi → basit commit revert. (Sonnet 5 low alt-ajanı
    tarafından yanıtlandı.)
12. Kabul kriteri sahibi → kullanıcı (Yusuf). (Sonnet 5 low alt-ajanı
    tarafından yanıtlandı.)
13. Test stratejisi oranı → unit 85%, integration 15%, e2e 0%. (Sonnet 5
    low alt-ajanı tarafından yanıtlandı.)
14. Bilinen riskler/varsayımlar → scroll-pin mimarisinin basitleştirilmesi
    gerekebilir (netleşmemiş varsayım). (Sonnet 5 low alt-ajanı tarafından
    yanıtlandı.)
