---
task_slug: hero-pipeline-gercek-etkilesim
jira_id: null
saga_task_id: 371
priority: medium
coverage_target: 80
performance_target: "bundle +5KB gzip üst sınır, INP artışı <=50ms"
memory_target: null
test_strategy:
  unit: 60
  integration: 30
  e2e: 10
affected_modules:
  - src/components/system/AiPipeline.tsx
  - src/lib/portfolio-data.ts
---

# ATDD — hero-pipeline-gercek-etkilesim

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga #371, Saga #368'den bölündü).

## Persona
İşe alım uzmanı/recruiter veya teknik değerlendirici (hiring manager/senior
engineer) — portfolyoyu göz atarken "AI-Native Pipeline" başlığını görüp
bunun gerçek olup olmadığını merak eden, 30-90 saniye ayıran biri. Derin
teknik inceleme değil, "bu kişi gerçekten bu araçları kullanıyor mu yoksa
buzzword mü" sorusuna hızlı kanıt arıyor.

## Hedef (Neden)
Mevcut scroll-animasyonu (kart X aktif oluyor) sadece görsel bir sekans —
"Claude gerçekten plan yapıyor, Cursor gerçekten kod yazıyor, Codex gerçekten
test ediyor" iddiasını kanıtlamıyor. Decision-matrix'in "3 statik kart"
eleştirisi aslında animasyon eksikliği değil, İÇERİK/KANIT eksikliği.
Hedef: kullanıcının tıklayabileceği bir etkileşimle, bu reponun kendi
geçmişinden gerçek bir kanıt (spec alıntısı / kod diff'i / test çıktısı)
göstermek — canlı LLM API çağrısı olmadan, build-time sabit veriyle.

## User Story
As a portfolyo ziyaretçisi (recruiter/teknik değerlendirici)
I want AI-Native Pipeline kartlarına tıklayıp her aracın gerçek bir örnek
çıktısını görmek
So that "Claude/Cursor/Codex" etiketlerinin gerçek kullanıma dayandığına,
sadece dekoratif metafor olmadığına ikna olayım

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given kullanıcı pipeline bölümüne scroll etmiş, When bir aşama
   kartına (PLAN/BUILD/VERIFY) tıklar, Then kart genişler ve o aşamaya ait
   gerçek örnek içerik (spec alıntısı / kod snippet'i / test çıktısı)
   fade-in ile görünür.
2. [Critical] Given bir kart açıkken, When kullanıcı başka bir karta
   tıklar, Then önceki kart kapanır, yeni tıklanan kart açılır (accordion
   davranışı, aynı anda yalnızca bir kart açık).
3. [High] Given bir kart açıkken, When kullanıcı aynı karta tekrar tıklar
   veya kart dışına tıklar/Esc'e basar, Then kart kapanır, önceki (kapalı)
   haline döner.
4. [High] Given kullanıcı `prefers-reduced-motion` tercih etmiş, When bir
   karta tıklar, Then genişleme/daralma animasyonsuz (anlık show/hide)
   gerçekleşir ama işlevsellik (içerik görünürlüğü) korunur.
5. [Medium] Given kullanıcı mobil/touch cihazda (hover yok), When pipeline
   bölümüne gelir, Then her kartta görünür bir "genişlet" affordance'ı
   (ör. chevron ikonu) bulunur ve tap ile aynı expand/collapse tetiklenir.
6. [Medium] Given JavaScript devre dışı (SSR-only render), When sayfa
   yüklenir, Then 3 aşamanın başlığı ve özet metni (mevcut statik içerik)
   görünür kalır; sadece tıklama-genişletme etkileşimi çalışmaz.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path — kart tıklanır | `expandedIndex` state o kartın index'ine set edilir | Önceden açık kart varsa kapanır (accordion) | Kart genişler, gerçek örnek içerik fade-in ile görünür | AC-1 |
| 2 | Başka karta tıklama | `expandedIndex` yeni index'e set edilir | Önceki kart kapanır | Eski kart kapanır, yeni kart açılır | AC-2 |
| 3 | Aynı karta tekrar tıklama / dışına tıklama / Esc | `expandedIndex` → `null` | Yok | Kart kapanır, statik hale döner | AC-3 |
| 4 | reduced-motion aktif | `expandedIndex` aynı şekilde değişir, animasyon süresi 0 | Yok | İçerik animasyonsuz anında görünür/kaybolur | AC-4 |
| 5 | Mobil/touch | Aynı state mantığı, tap event ile tetiklenir | Yok | Chevron ikonu + tap ile expand | AC-5 |
| 6 | JS kapalı (SSR-only) | Etkileşim state'i hiç oluşmaz (client JS yok) | Yok | Statik başlık/özet görünür, expand çalışmaz ama sayfa kırılmaz | AC-6 |
| 7 | Kısmi başarı | Uygulanamaz — tekli senkron state toggle, bölünebilir bir işlem değil | — | — | Silindi: senkron client-state değişikliğinde ara/kısmi durum oluşmaz |
| 8 | Hiçbir şey yapılamadı ama hata da yok | Kart dışına tıklama/Esc → `expandedIndex: null` | Yok | Kart eski (kapalı) haline döner, hata yok | AC-3 ile aynı |

Kısmi başarı: Uygulanamaz — bu özellik ağ çağrısı/çok adımlı işlem içermiyor, tek bir senkron React state toggle'ı. Kısmi başarı durumu fiziksel olarak oluşamaz.
Hiçbir şey yapılamadı ama hata da yok: Kullanıcı bir kartı kapatma eylemi yaptığında (tekrar tıklama/dışına tıklama/Esc) sessizce kapanır — bu "hata değil, beklenen kapanma" durumu, AC-3 ile karşılanıyor.
Boş sonuç ↔ hata ayrımı: N/A — veri build-time sabit (`PIPELINE` sabitinde gömülü), çalışma zamanında "veri yok" durumu oluşmaz. Eğer ileride bir aşamanın `exampleContent` alanı boş bırakılırsa (geliştirici hatası), o kart için "genişlet" affordance'ı hiç render edilmez (kart normal statik haliyle kalır) — bu davranış AC-1'in ön koşulu olarak koda yazılacak, ayrı bir AC gerektirmiyor çünkü tamamen build-time/geliştirici kontrolünde.

Silinen satırlar: "Girdi geçersiz/eksik", "Yetkisiz erişim", "Dış bağımlılık hatası", "Zaman aşımı" — hepsi silindi çünkü bu özellik kullanıcı girdisi almıyor, kimlik doğrulama sınırı yok, ağ çağrısı yapmıyor (build-time sabit veri + senkron client state).

## Test Strategy
Unit: 60% — `PIPELINE` veri yapısının doğruluğu (her aşamada `exampleContent` var mı), expand/collapse state mantığı (React Testing Library, component-level)
Integration: 30% — kart tıklama → doğru içeriğin render olması, accordion davranışı (bir kart açıkken diğerine tıklayınca öncekinin kapanması), reduced-motion durumunda animasyonsuz ama işlevsel çalışma
E2E: 10% — gerçek tarayıcıda scroll + tıklama akışının uçtan uca görsel doğrulaması (masaüstü + mobil viewport), manuel Browser pane doğrulaması

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: Bundle boyutu artışı ≤5KB gzip (yeni bağımlılık yok); INP artışı ≤50ms (tıklama-tepki gecikmesi); Lighthouse performans skoru mevcut baseline'dan düşmemeli
Memory: N/A
Görsel/UI kriteri: Kart genişleme/daralma layout'u bozmamalı (`AnimatePresence`/`layout` prop ile), mobilde chevron ikonu görünür olmalı — `verify` adımında Browser pane ile manuel kontrol edilecek
Diğer ölçülebilir kriterler: Animasyon FPS ≥55 (mevcut scroll-animasyonuyla aynı performans sınıfı)

## Kapsam Dışı
- Gerçek/canlı LLM API çağrısı (Claude/Cursor/Codex'e istek atmak)
- Backend/sunucu entegrasyonu
- Kullanıcının kendi promptunu girip "canlı" bir sonuç alması
- Video/GIF kaydı oynatma
- Yeni bir state-management veya animasyon kütüphanesi eklenmesi
- Pipeline aşamalarının sayısının/sırasının değiştirilmesi
- Mevcut scroll-tetiklemeli ACTIVE/STANDBY animasyonunun kaldırılması (korunacak, üzerine eklenecek)

## Etkilenen Dosyalar/Modüller (bilinen)
- `src/components/system/AiPipeline.tsx` — expand/collapse state ve accordion mantığı
- `src/lib/portfolio-data.ts` — `PIPELINE` sabitine her aşama için `exampleContent: string` (veya benzeri) alanı eklenmesi

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu makinede git reposunun kökü proje klasörüyle aynı mı
(`ai-interface`) yoksa daha geniş bir dizin mi, önceki oturumlarda net
teyit edilmedi. Sonraki adımlarda (plan/code-copilot/test-copilot/red-team)
arama `C:\Users\YUSUF ÇİNAR\OneDrive\Belgeler\Masaüstü\projelerim\ai-interface`
klasörüyle sınırlı tutulmalı, kök dizinden sınırsız arama yapılmamalı.

## Rollback Beklentisi
Etkileşim/animasyon bir hataya yol açarsa (ör. genişleme takılırsa, kart
açılmazsa) sayfa çökmemeli — en kötü durumda kart sadece genişlemez ama
statik içerik (başlık, özet) her zaman görünür kalır (progressive
enhancement). Git seviyesinde: değişiklik `AiPipeline.tsx` ve
`portfolio-data.ts`'te birlikte, tek commit'te — geri alınabilir.

## Risks
- Mevcut `AiPipeline.tsx` zaten karmaşık bir scroll/motion mimarisi kullanıyor
  (`useSectionProgress`, `useTransform` zincirleri) — yeni expand/collapse
  state'inin bu mevcut scroll-pin mekanizmasıyla çakışmaması gerekiyor
  (özellikle `sticky`/`pin` davranışı, kart içeriği genişleyince layout
  kayması yaratabilir).
- Gerçek "kanıt içeriği" (spec alıntısı, kod snippet'i, test çıktısı) bu
  reponun kendi ATDD pipeline'ından alınacak — hangi spesifik metin/kod
  parçası kullanılacağı `plan` adımında netleştirilmeli.

## Assumptions
- Kanıt içeriği tamamen statik/build-time veri olacak (canlı API çağrısı
  yok) — kullanıcı bunu netleştirmedi ama proje bağlamı (statik portfolyo,
  performans bütçesi kritik) ve alt-ajan cevabı bu yönde.
- "Detayı Gör" affordance'ı için yeni bağımlılık eklenmeyecek, mevcut
  framer-motion (`AnimatePresence`) kullanılacak.

## Unknowns
- Her aşama için gösterilecek gerçek kanıt içeriğinin (spec/kod/test
  alıntısı) tam metni henüz belirlenmedi — `plan` adımında bu reponun
  gerçek dosyalarından (örn. bir önceki `atdd.md`/`code_diff.md`/
  `test_diff.md`) kısa, gerçek alıntılar seçilecek.

## Sorular ve Cevaplar (ham kayıt)
1. Kullanıcı rolü/persona → (Sonnet 5 low alt-ajanı tarafından yanıtlandı: portfolyo bağlamından net çıkarım — recruiter/teknik değerlendirici, 30-90 saniyelik hızlı kanıt arayışı)
2. Ana hedef/neden → (Sonnet 5 low alt-ajanı: mevcut animasyon görsel sekans, gerçek kanıt değil; decision-matrix'in eleştirisi içerik eksikliği)
3. Happy path senaryosu → (Sonnet 5 low alt-ajanı: kart tıklama → genişleme → gerçek statik kanıt içeriği gösterimi, canlı API yok)
4. Edge case — JS kapalı/reduced-motion → (Sonnet 5 low alt-ajanı: SSR temel içerik korunur, reduced-motion'da animasyonsuz ama işlevsel)
5. Edge case — mobil/touch → (Sonnet 5 low alt-ajanı: tap + görünür chevron affordance)
6. Davranış sözleşmesi tablosu → (Sonnet 5 low alt-ajanı tarafından dolduruldu, yukarıdaki tabloya işlendi; uygulanamayan satırlar gerekçeyle silindi)
7. Başarı ölçütü/benchmark → (Sonnet 5 low alt-ajanı: bundle ≤5KB, INP ≤50ms, FPS ≥55, Lighthouse baseline korunur)
8. Kapsam dışı → (Sonnet 5 low alt-ajanı: canlı LLM çağrısı, backend, video, yeni kütüphane, aşama sayısı/sırası değişimi)
9. Bağımlılıklar/etkilenen dosyalar → (Sonnet 5 low alt-ajanı: AiPipeline.tsx + portfolio-data.ts, muhtemelen yeni alt-bileşen — plan adımında netleştirilecek)
10. Performans/güvenlik kısıtı → (Sonnet 5 low alt-ajanı: yeni bağımlılık yok, framer-motion yeterli, XSS riski yok çünkü statik içerik)
11. Rollback beklentisi → (Sonnet 5 low alt-ajanı: progressive enhancement, tek commit ile geri alınabilir)
12. Test stratejisi oranı → (Sonnet 5 low alt-ajanı: 60/30/10 unit/integration/e2e önerisi, kullanıcı tarafından zımnen kabul edildi — "devam et commite kadar" ile pipeline'ın tamamı onaylandı)
