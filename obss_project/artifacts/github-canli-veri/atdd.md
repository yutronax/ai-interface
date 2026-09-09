---
task_slug: github-canli-veri
jira_id: null
saga_task_id: 370
priority: medium
coverage_target: 80
performance_target: "SSR loader API çağrısı TTFB'ye 500ms'den fazla ek gecikme getirmemeli (cache/TTL ile)"
memory_target: null
test_strategy:
  unit: 60
  integration: 30
  e2e: 10
affected_modules:
  - "src/components/system/GitHubSection.tsx"
  - "src/lib/portfolio-data.ts"
  - "src/lib/github-api.ts (yeni, tahmini)"
  - "ilgili route dosyası (loader eklenecek, src/routes/*.tsx — kesin dosya plan adımında doğrulanacak)"
---

# ATDD — github-canli-veri

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga #370).

## Saga Kaynağı
Saga #370 — "ai-interface - canlı GitHub API verisi (Sosyal Kanıt)" (epic #50: Tasarım denetimi ve içerik kararları). Saga #368'den (decision-matrix uygulama, 4 kalan madde) bölündü.

## Persona
Portfolyoyu inceleyen işveren/recruiter/müşteri adayları — bu sayılar sosyal kanıt olarak güven oluşturuyor, statik/eski görünmesi güvenilirliği zedeliyor. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)

## Hedef (Neden)
decision-matrix'teki "Sosyal Kanıt" bölümündeki "Hard-coded sayılar statik görünüyor, 'gerçek sistem' metaforunu zayıflatıyor" anti-pattern'ini gideriyor — `GitHubSection.tsx`'teki "04 PUBLIC REPOS · 46 TOTAL STARS" sabit değerleri, GitHub API'sinden gerçek zamanlı çekilen verilerle değiştiriliyor. (kullanıcı mesajından/decision-matrix.md, tekrar sorulmadı)

## User Story
As a portfolyo ziyaretçisi (recruiter/işveren)
I want GitHub bölümünde gerçek zamanlı repo sayısı ve toplam yıldız sayısı görmek
So that gösterilen sosyal kanıtın güncel ve gerçek olduğuna güvenebileyim

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given GitHub API (`api.github.com/users/yutronax/repos`) başarıyla yanıt veriyor, When sayfa SSR ile render edilir, Then GitHub bölümünde gösterilen repo sayısı ve toplam yıldız sayısı GitHub API'sinin döndürdüğü gerçek verilerle birebir eşleşir.
2. [Critical] Given GitHub API rate-limit'e takılmış (403/429) veya ağ hatası veriyor, When sayfa render edilir, Then mevcut hard-coded `REPOS` verisi (fallback) sessizce gösterilir, kullanıcıya hata mesajı gösterilmez, sayfa crash olmaz.
3. [High] Given GitHub kullanıcısının hiç public repo'su yok (API boş dizi döndürüyor), When sayfa render edilir, Then "0 PUBLIC REPOS · 0 TOTAL STARS" gösterilir (bu geçerli bir durum, fallback'e düşülmez).
4. [High] Given API'den dönen repo listesindeki bir reponun `stargazers_count` alanı null/eksik, When toplam yıldız hesaplanır, Then o repo için 0 varsayılır, toplam hesaplama crash olmadan tamamlanır.
5. [Medium] Given API'den başarılı bir yanıt önceden cache'lenmiş (TTL dolmamış), When yeni bir SSR isteği gelir, Then API'ye tekrar gidilmez, cache'lenen veri kullanılır (rate-limit koruması).
6. [Medium] Given cache TTL'i (örn. 1 saat) dolmuş, When yeni bir SSR isteği gelir, Then arka planda yeniden fetch tetiklenir; bu fetch başarısız olursa önceki cache/hard-coded veriye düşülür.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path: API başarılı | Gerçek repo sayısı + toplam star (API'den) | Yok (opsiyonel: in-memory cache'e yazma) | Güncel sayılar | AC-1 |
| 2 | Rate-limit (403/429) | Fallback: hard-coded `REPOS` verisi (portfolio-data.ts) veya son başarılı cache | Server log uyarısı (opsiyonel, sessiz) | Fallback sayılar, hata mesajı YOK | AC-2 |
| 3 | Network hatası (timeout/DNS) | Fallback: hard-coded `REPOS` verisi veya son başarılı cache | Server log uyarısı (opsiyonel, sessiz) | Fallback sayılar, hata mesajı YOK | AC-2 |
| 4 | Public repo yok (boş dizi, geçerli API yanıtı) | 0 repo / 0 star gösterilir (fallback'e DÜŞÜLMEZ — bu gerçek bir durum) | Yok | "0 PUBLIC REPOS · 0 TOTAL STARS" | AC-3 |
| 5 | Kısmi başarı: bir reponun `stargazers_count` alanı null/eksik | O repo için stars=0 varsayılır, toplam hesaplamaya dahil edilir | Yok | Toplam sayı, eksik alanı 0 sayarak hesaplanmış gösterilir, crash yok | AC-4 |
| 6 | Hiçbir şey yapılamadı ama hata yok (API çağrısı hiç tetiklenmemiş — kod/config hatası) | Fallback: hard-coded `REPOS` verisi | Yok/log | Fallback sayılar — kullanıcı asla boş/kırık state görmez | AC-2 |

Silinen satır: "Yetkisiz erişim" — GitHub public repos API'si kimlik doğrulama gerektirmiyor (public endpoint), bu task kapsamında PAT/OAuth eklenmiyor (Kapsam Dışı).

Kısmi başarı: Bir reponun `stargazers_count` alanı eksikse o repo 0 star sayılır, toplam hesaplamaya dahil edilir — tüm listeyi reddetmek yerine kısmi/eksik veriyle devam edilir (crash yasak).
Hiçbir şey yapılamadı ama hata da yok: API çağrısı hiç tetiklenemezse (config/kod hatası) veya API tamamen başarısız olursa, hard-coded `REPOS` fallback'i gösterilir — sessiz boş state YASAK, her zaman ya gerçek ya fallback veri gösterilir.
Boş sonuç ↔ hata ayrımı: API'nin geçerli yanıtı olan "0 repo" (AC-3) ile API'nin başarısız olması (AC-2, fallback tetiklenir) açıkça ayrılır — ikisi de "0" göstermez, ilki gerçek 0'ı gösterir, ikincisi fallback'teki hard-coded sayıları gösterir.

## Test Strategy
Unit: 60% — fetch fonksiyonu mock'lanarak: happy path, 403/429, network error, boş repo listesi, null `stargazers_count` senaryoları
Integration: 30% — loader'ın fallback mantığıyla component'e doğru veri geçirdiğinin mock edilmiş API ile doğrulanması
E2E: 10% — sayfanın gerçek ortamda crash olmadan render olduğunu, mock'lanmış/stub'lanmış bir GitHub API response ile doğrulama — gerçek GitHub API'sine test sırasında ASLA gidilmez

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: SSR loader'ın API çağrısı sayfa TTFB'sine 500ms'den fazla ek gecikme getirmemeli (cache/TTL ile)
Memory: Belirtilmedi/uygulanmaz
Görsel/UI kriteri: Sayılar güncellendiğinde mevcut dashboard strip layout'u (GitHubSection.tsx'teki 3 sütunlu grid) bozulmamalı; `verify` adımında `vision-test` ile doğrulanmalı.
Diğer ölçülebilir kriterler: API başarılı olduğunda gösterilen repo sayısı ve toplam star, gerçek GitHub API verisiyle %100 eşleşmeli.

## Kapsam Dışı
GitHub OAuth/PAT entegrasyonu (public API yeterli sayılıyor), repo açıklamalarının/README'lerinin API'den çekilmesi, contribution graph/activity heatmap eklenmesi, repo listesinin dinamik olarak genişletilmesi (hangi repoların gösterileceği `portfolio-data.ts`'te sabit kalabilir — sadece repo sayısı/toplam star canlı olacak), gerçek zamanlı polling/websocket güncellemesi.

## Etkilenen Dosyalar/Modüller (bilinen)
- `src/components/system/GitHubSection.tsx` — veri kaynağını doğrudan `REPOS` sabitinden değil, loader/prop'tan alacak şekilde değişecek.
- `src/lib/portfolio-data.ts` — `REPOS` sabiti fallback verisi olarak kod tabanında KALACAK (silinmeyecek).
- `src/lib/github-api.ts` (yeni, tahmini) — fetch + fallback + in-memory cache (TTL) mantığı.
- İlgili route dosyasına (`src/routes/*.tsx`, kesin dosya plan adımında Grep ile doğrulanacak) TanStack Start loader eklenmesi gerekebilir.

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulandı (önceki task `proje-karti-tiklanabilir-kanit`'te kontrol edildi) — bu makinede git reposunun kökü `ai-interface` proje klasörüyle aynı (`git rev-parse --show-toplevel` proje köküyle eşleşiyor). Yine de sonraki adımlarda (`plan`'ın kod keşfi, `code-copilot`/`test-copilot`/`red-team`'in Grep/Glob/Bash kullanımı) arama HER ZAMAN `ai-interface` proje klasörüyle sınırlanmalı.

## Rollback Beklentisi
API entegrasyonu başarısız olursa veya geri alınırsa, hard-coded `REPOS` verisi (`portfolio-data.ts`) kod tabanında fallback olarak KALMALI (silinmemeli) — hem edge-case fallback'i hem de hızlı rollback imkanı sağlar.

## Risks
- GitHub REST API kimlik doğrulamasız istekte saatte 60 istek limitine sahip — caching stratejisi (in-memory + TTL) doğru uygulanmazsa portfolyo trafiği arttığında rate-limit'e takılma riski var.
- TanStack Start'ın SSR loader mekanizmasının bu projede hangi route dosyasına bağlanacağı henüz doğrulanmadı (plan adımında netleşecek).
- In-memory cache, sunucu her yeniden başladığında (serverless/edge ortamlarda her cold start'ta) sıfırlanabilir — Cloudflare Workers hedefli bir build kullanıldığı biliniyor (decision-matrix.md'den), bu ortamda module-level in-memory cache'in kalıcılığı garanti değil; bu durumda her cold start ilk isteği API'ye gönderir (rate-limit riski biraz artar ama kritik değil, kişisel site trafiği düşük).

## Assumptions
- SSR route loader yaklaşımı (build-time değil, request-time + in-memory TTL cache) en uygun yöntem olarak seçildi (Sonnet 5 low alt-ajanının gerekçesi: build-time fetch, deploy sonrası veri güncellemesi için yeniden build gerektirir, bu "canlı veri" hedefine daha az uyar).
- Cache TTL değeri "örn. 1 saat" olarak öneriliyor, kesin değer plan/code-copilot adımında sabitlenecek — kullanıcı onayı almadıysa bu bir varsayım.
- Hangi repoların gösterileceği (REPOS dizisindeki 4 repo adı) sabit kalacak, API'den sadece stars/count gibi sayısal veriler çekilecek — repo listesinin kendisi dinamikleşmiyor (Kapsam Dışı'nda da belirtildi).

## Unknowns
- TanStack Start'ın bu projedeki route yapısında loader'ın tam olarak hangi dosyaya ekleneceği — plan adımında Grep ile doğrulanacak.
- Cache TTL'in kesin süresi (1 saat mi, daha kısa/uzun mu) — kullanıcı onayı gerekebilir, şimdilik 1 saat varsayımı ile ilerleniyor.

## Sorular ve Cevaplar (ham kayıt)
1. Persona: Portfolyoyu inceleyen işveren/recruiter/müşteri adayları — sayılar sosyal kanıt olarak güven oluşturuyor. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
2. Ana hedef: decision-matrix'teki "Hard-coded sayılar statik görünüyor" anti-pattern'ini gideriyor. (kullanıcı mesajından/decision-matrix.md, tekrar sorulmadı)
3. Happy path: SSR route loader, sayfa yüklemesi sırasında server-side GitHub API çağrısı yapar, component'e prop olarak geçirir, ekstra client-side loading state yok. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: TanStack Start'ın SSR loader desteği en uygun mekanizma)
4. Edge case 1 (rate-limit): Hard-coded REPOS verisi fallback olarak kullanılır, hata gösterilmez, sessizce fallback'e düşülür. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
5. Edge case 2 (network hatası): Aynı şekilde fallback'e düşülür, try/catch ile sayfa hiçbir zaman kırılmaz. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
6. Davranış sözleşmesi tablosu: yukarıdaki tabloda dolduruldu. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
7. Başarı ölçütü: API başarılı olduğunda %100 doğruluk, SSR loader'ın TTFB'ye 500ms'den fazla ek gecikme getirmemesi, API her başarısız olduğunda sayfa crash/boş state göstermemesi. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
8. Kapsam dışı: OAuth/PAT entegrasyonu, repo açıklaması/README çekme, contribution graph, dinamik repo listesi, polling/websocket. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
9. Bağımlılıklar: GitHubSection.tsx, portfolio-data.ts, yeni github-api.ts dosyası, route loader. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
10. Caching stratejisi: In-memory cache (server tarafında module-level) + TTL (örn. 1 saat), TTL dolunca arka planda yeniden fetch, başarısızlıkta eski cache/hard-coded veriye düşülür. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
11. Rollback: Hard-coded REPOS verisi kod tabanında fallback olarak kalmalı, silinmemeli. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
12. Test stratejisi oranı: 60/30/10 (unit/integration/e2e) — API çağrısı her zaman mock'lanır, gerçek GitHub API'sine test sırasında gidilmez. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
