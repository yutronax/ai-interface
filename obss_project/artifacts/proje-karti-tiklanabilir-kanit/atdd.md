---
task_slug: proje-karti-tiklanabilir-kanit
jira_id: null
saga_task_id: 369
priority: medium
coverage_target: 80
performance_target: "Lighthouse skorunda >5 puan düşüş yok"
memory_target: null
test_strategy:
  unit: 60
  integration: 30
  e2e: 10
affected_modules:
  - "src/components/ (proje kartı component'i — kesin dosya adı plan adımında Grep ile doğrulanacak)"
  - "proje verisini tanımlayan data/config dosyası (kesin yol doğrulanmadı)"
---

# ATDD — proje-karti-tiklanabilir-kanit

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga #369).

## Saga Kaynağı
Saga #369 — "ai-interface - proje kartlarında tıklanabilir kanıt" (epic #50: Tasarım denetimi ve içerik kararları). Saga #368'den (decision-matrix uygulama, 4 kalan madde) bölündü.

## Persona
Portfolyoyu inceleyen recruiter/işe alım uzmanı ve teknik değerlendirici (hiring manager/senior mühendis) — recruiter hızlı tarama yapar, teknik değerlendirici iddiayı doğrulamak ister; her ikisi de metriğe güvenmek için tıklanabilir kanıt arar. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: portfolyo bağlamında en makul iki hedef kitle bu ikisi)

## Hedef (Neden)
decision-matrix madde 3'teki ("İçerik/Anlatı") "iddia var ama kanıt yok" anti-pattern'ini gideriyor — kartlardaki metrikleri (IoU +12%, 2.000+ mesaj/gün) doğrulayan somut, tıklanabilir bir kanıt (görsel/demo/notebook) eksikliğini kapatıyor. (kullanıcı/decision-matrix.md satır 27'den, tekrar sorulmadı)

## User Story
As a portfolyo ziyaretçisi (recruiter/teknik değerlendirici)
I want proje kartlarındaki metrik iddialarını destekleyen tıklanabilir bir kanıt (görsel/demo/notebook) görmek
So that iddia edilen sonuçlara (IoU +12%, 2.000+ mesaj/gün vb.) güvenebileyim, sadece metne değil

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given bir proje kartının kanıt verisi (görsel/demo/notebook linki) tanımlı, When kullanıcı kartı görüntüler, Then "GITHUB'DA AÇ" linkinin yanında/altında ayrı bir tıklanabilir kanıt elemanı render edilir ve tıklanınca kanıt (görsel büyütülmüş halde veya harici URL yeni sekmede) açılır.
2. [Critical] Given bir proje kartının kanıt verisi tanımlı DEĞİL, When kart render edilir, Then ek kanıt elemanı gösterilmez, mevcut "GITHUB'DA AÇ" linki tek başına kalır, kart bozulmaz.
3. [High] Given kanıt bir görsel/GIF, When görsel network hatasıyla yüklenemez, Then `onError` fallback tetiklenir ve kırık resim ikonu yerine görsel sessizce gizlenir.
4. [High] Given kanıt görseli veya animasyonu var, When sayfa render edilir, Then `loading="lazy"` uygulanır ve `prefers-reduced-motion` açıksa otomatik oynayan GIF/video yerine statik poster gösterilir.
5. [Medium] Given bazı projelerde kanıt var bazılarında yok (aşamalı ekleme), When proje listesi render edilir, Then her kart bağımsız kendi verisine göre davranır, tutarsızlık (bazı kartlarda ek eleman, bazılarında yok) kabul edilebilir bir durumdur.
6. [Medium] Given hiçbir projeye henüz kanıt eklenmemiş, When build/deploy çalıştırılır, Then build başarılı kalır (kanıt alanı opsiyonel tip), mevcut davranışta regresyon olmaz.

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path: kart için kanıt verisi mevcut | Kart üzerinde ek tıklanabilir kanıt elemanı render edilir | Yok (sadece UI) | Görsel/demo/link erişilebilir, yeni sekmede açılır | AC-1 |
| 2 | Bir proje için kanıt verisi eksik/boş (`evidence` alanı yok) | Ek kanıt elemanı render edilmez (conditional render, null döner) | Yok | Sadece mevcut GITHUB linki, kart aynen çalışır | AC-2 |
| 3 | Kanıt linki kırık/404 (harici) | Build-time kontrol yok, tıklanınca 404 kullanıcıya gider | Yok (runtime doğrulaması kapsam dışı) | Harici sitede 404 sayfası — içerik hatası, kod hatası değil | (kapsam dışı, izlenir ama otomatik test edilmez) |
| 4 | Görsel/GIF yüklenemedi (network) | `<img onError>` fallback tetiklenir, görsel gizlenir | DOM'dan img kaldırılır/placeholder gösterilir | Kırık resim ikonu yerine sessiz gizleme | AC-3 |
| 5 | Kısmi başarı: bazı kartlarda kanıt var bazılarında yok | Her kart kendi verisine göre bağımsız render edilir | Yok | Kanıtlı kartlarda ek eleman, diğerlerinde yok — kabul edilebilir | AC-5 |
| 6 | Hiçbir şey yapılamadı ama hata da yok (kanıt hiç eklenmemiş, build başarılı) | Build başarılı kalır (kanıt alanı optional) | Yok | Fark yok, mevcut davranış korunur — regresyon değil | AC-6 |

Silinen satır: "Yetkisiz erişim" ve "Dış bağımlılık hatası (ağ/DB/API)" satırları — bu statik bir portfolyo sitesi, kimlik doğrulama veya canlı API bağımlılığı yok (GitHub API entegrasyonu ayrı Saga #370'te ele alınıyor). "Zaman aşımı" satırı silindi — statik içerik, sunucu round-trip yok.

Kısmi başarı: Bazı projelerde kanıt olup bazılarında olmaması normal kabul edilir (aşamalı ekleme) — her kart bağımsız render edilir, hata durumu değildir.
Hiçbir şey yapılamadı ama hata da yok: Kanıt alanı hiç doldurulmamışsa mevcut davranış (sadece GITHUB linki) korunur, build/deploy başarılı kalır — sessiz bozulma yok çünkü zaten opsiyonel bir ek özellik.
Boş sonuç ↔ hata ayrımı: "Kanıt yok" (veri şemasında alan boş) ile "kanıt linki kırık" (veri var ama hedef 404) açıkça farklı durumlar — ilki UI'da hiçbir ek eleman göstermez, ikincisi elemanı gösterir ama tıklanınca harici 404'e gider (kod bunu ayırt edip önceden uyarmaz, bu bir içerik-bakım sorumluluğu).

## Test Strategy
Unit: 60% — proje kartı component'inin conditional render mantığı (kanıt var/yok durumları), `onError` fallback davranışı
Integration: 30% — proje verisi şeması doğrulaması (her proje objesinin `evidence` alanının doğru tip/formatta olması), link format kontrolü
E2E: 10% — bir kartta kanıt elemanına tıklama akışının çalıştığını doğrulayan minimal senaryo (görsel regresyon bu ölçekte gereksiz kabul edildi)

## Benchmark / Başarı Ölçütü
Coverage Target: 80%
Performance Target: Lighthouse skorunda >5 puan düşüş olmaması (görsel eklenirse lazy-load ile)
Memory: Belirtilmedi/uygulanmaz
Görsel/UI kriteri: Öne çıkan proje kartlarının (ana sayfadaki 3-5 proje) en az %60-80'inde tıklanabilir kanıt elemanı bulunmalı; `verify` adımında `vision-test` ile kartların bozulmadığı doğrulanmalı.
Diğer ölçülebilir kriterler: Görsel/animasyon eklenirse `loading="lazy"` ve `prefers-reduced-motion` desteği zorunlu (decision-matrix madde 5 ile uyumlu).

## Kapsam Dışı
Yeni video/demo hosting altyapısı kurmak, canlı demo sunucusu deploy etmek, her proje için sıfırdan yeni görsel/GIF prodüksiyonu yapmak (mevcut/erişilebilir materyal kullanılır) — bunlar içerik üretim işi, bu task sadece UI/veri mekanizmasını kurar. Harici kanıt linklerinin runtime'da kırık olup olmadığını otomatik kontrol etmek de kapsam dışı (build-time/statik kabul yeterli).

## Etkilenen Dosyalar/Modüller (bilinen)
- Proje kartı component'i (muhtemelen `src/components/` altında Projects/ProjectCard benzeri bir dosya) — kesin dosya adı `plan` adımında Grep ile doğrulanacak.
- Projeleri tanımlayan veri/config dosyası (muhtemelen `src/data/` veya component içinde inline dizi) — kesin yol doğrulanmadı.

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu makinede git reposunun kökünün `ai-interface` proje klasörüyle aynı olup olmadığı teyit edilmedi. Sonraki adımlarda (`plan`'ın kod keşfi, `code-copilot`/`test-copilot`/`red-team`'in Grep/Glob/Bash kullanımı) arama HER ZAMAN `ai-interface` proje klasörüyle sınırlanmalı — sınırsız arama (`git log -p --all`, kök dizinden `grep -r`, tam-repo indexleme) devasa geçmişi/ilgisiz dosyaları tarayıp RAM'i tüketebilir.

## Rollback Beklentisi
Kanıt bulunamazsa/eklenemezse mevcut "GITHUB'DA AÇ" linki korunur, kart görünmez olmaz — kanıt eklemek additive bir geliştirme, var olan işlevselliği asla kaldırmamalı.

## Risks
- Proje kartı component'inin ve veri dosyasının kesin konumu henüz doğrulanmadı (plan adımında netleşecek).
- Bazı projeler için gerçek bir görsel/demo/notebook materyali mevcut olmayabilir — bu durumda içerik üretimi ayrı bir iş olarak ele alınmalı (kapsam dışı).

## Assumptions
- Proje kartı verisi bir dizi/obje olarak component içinde veya ayrı bir data dosyasında tutuluyor (varsayım — plan adımında doğrulanacak).
- "Kanıt" için statik görsel/GIF veya harici link (Colab/Loom/canlı deploy URL) yeterli sayılıyor, ayrı bir video hosting altyapısı gerekmiyor (varsayım, Sonnet 5 low alt-ajanının gerekçesi: kişisel portfolyo, düşük maliyetli çözüm tercih edilir).

## Unknowns
- Hangi projeler için gerçek kanıt materyali (görsel/demo/notebook) zaten mevcut, hangileri için üretilmesi gerekiyor — bu bilgi `plan` veya kullanıcıdan netleştirilmeli.

## Sorular ve Cevaplar (ham kayıt)
1. Persona: Portfolyoyu inceleyen recruiter/işe alım uzmanı ve teknik değerlendirici (hiring manager/senior mühendis) — recruiter hızlı tarama yapar, teknik değerlendirici iddiayı doğrulamak ister. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: portfolyo bağlamında en makul iki hedef kitle bu ikisi)
2. Ana hedef: decision-matrix madde 3'teki "iddia var ama kanıt yok" anti-pattern'ini gideriyor — kartlardaki metrikleri doğrulayan somut, tıklanabilir kanıt eksikliğini kapatıyor. (kullanıcı mesajından/decision-matrix.md, tekrar sorulmadı)
3. Happy path: Kullanıcı proje kartına gelir, "GITHUB'DA AÇ" linkinin yanında/altında ikinci bir tıklanabilir kanıt elemanı görür, tıklar, yeni sekmede kanıt açılır. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: en doğal UX akışı)
4. Edge case 1 (kanıt yoksa): Kart normal render olmaya devam eder, sadece ek kanıt elemanı gösterilmez. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: additive özellik, mevcut işlevsellik korunmalı)
5. Edge case 2 (link kırıksa): Görsel için `onError` fallback, harici link için runtime doğrulama yapılmaz (statik site, build-time kontrolü yeterli). (Sonnet 5 low alt-ajanı tarafından yanıtlandı: statik site kısıtı)
6. Davranış sözleşmesi tablosu: yukarıdaki tabloda dolduruldu. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
7. Başarı ölçütü: Öne çıkan proje kartlarının en az %60-80'inde tıklanabilir kanıt elemanı bulunması; Lighthouse skorunda >5 puan düşüş olmaması. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: ölçülebilir hedef için makul varsayım)
8. Kapsam dışı: Yeni video/demo hosting altyapısı, canlı demo sunucusu deploy etmek, sıfırdan görsel/GIF prodüksiyonu. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
9. Bağımlılıklar: Proje kartı component'i ve proje verisi/config dosyası — kesin yol doğrulanmadı. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
10. Performans/erişilebilirlik: `loading="lazy"` zorunlu, `prefers-reduced-motion` sorgusuyla statik poster gösterilmeli. (kullanıcı mesajından/decision-matrix.md madde 5, tekrar sorulmadı — Sonnet 5 alt-ajanı teyit etti)
11. Rollback: Kanıt bulunamazsa mevcut "GITHUB'DA AÇ" linki korunur, kart görünmez olmaz. (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
12. Test stratejisi oranı: 60/30/10 (unit/integration/e2e) — component render testleri ağırlıklı, görsel regresyon bu ölçekte gereksiz. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: frontend UI task için makul varsayım)
