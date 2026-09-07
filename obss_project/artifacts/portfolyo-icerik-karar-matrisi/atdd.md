---
task_slug: portfolyo-icerik-karar-matrisi
jira_id: null
saga_task_id: 367
priority: medium
coverage_target: null
performance_target: null
memory_target: null
test_strategy:
  unit: 0
  integration: 0
  e2e: 0
affected_modules:
  - obss_project/artifacts/portfolyo-icerik-karar-matrisi/decision-matrix.md (yeni, bu görevin tek çıktısı)
---

# ATDD — portfolyo-icerik-karar-matrisi

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev (Saga #367, proje "ai-interface - portfolyo", epic "Tasarım denetimi ve içerik kararları").

## Persona
Yusuf Çınar — `ai-interface` portfolyosunun sahibi/geliştiricisi. Bu dokümanı, sonraki `plan`/`code-copilot` adımlarında "bunu ekleyelim mi eklemeyelim mi" tartışmasını tekrar açmamak için referans olarak kullanacak.

## Hedef (Neden)
Kod yazmaya başlamadan önce, tasarım araştırmasının (nicodiansk.dev kıyası, 2026 portfolyo trendleri, 5 somut bulgu) ve o araştırmaya dayanarak zaten yapılmış olan `web-quality-skills` denetiminin (accessibility 89→100, 3 gerçek bulgu düzeltildi) ürettiği bilgiyi tek bir **karar matrisine** (OLMALI / OLMAMALI) dönüştürmek. Bu olmadan her yeni özellik önerisinde ("bu buton olsun mu", "bu bölüm olmalı mı") aynı tartışma sıfırdan yapılır.

## User Story
As a Yusuf Çınar (portfolyo sahibi)
I want kanıta dayalı, kategori bazında bir "ne olmalı / ne olmamalı" karar dokümanı
So that hayal gücü ve kendini tanıtma (reklam) kararlarını tekrar tekrar tartışmadan, tek bir referanstan hızla alabileyim

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given `design_research.html`'deki 5 bulgu, nicodiansk.dev kıyası ve `web-quality-skills` denetim sonucu (accessibility 89→100), When karar matrisi yazılır, Then her biri şu 6 kategoriden birine yerleştirilir: Hero/Açılış, Navigasyon/CTA, İçerik/Anlatı, Sosyal Kanıt, Görsel/Hareket, Performans.
2. [Critical] Given her kategori, When "OLMALI" sütunu doldurulur, Then her madde somut bir örnek/gerekçeye (araştırmadaki bir bulguya, bir emsale, denetimde ölçülen bir sayıya, veya `ai-interface`'in kendi mevcut haline) bağlanır — gerekçesiz madde yazılmaz.
3. [Critical] Given her kategori, When "OLMAMALI" sütunu doldurulur, Then her madde somut bir anti-pattern örneğine bağlanır (ör. "3 eşit ağırlıklı link" gibi, `ai-interface`'in şu anki footer'ı gibi gerçek bir örnek).
4. [High] Given bir madde duruma göre değişiyorsa (ör. video-hero bazı sitelerde iyi çalışıyor bazılarında değil), When matrise eklenir, Then üçüncü bir "DURUMA GÖRE" notuyla işaretlenir, hangi koşulda hangi tarafa düştüğü tek cümleyle belirtilir — ikili tabloya zorla sıkıştırılmaz.
5. [High] Given araştırma bulgusu ile kişisel tercih çelişirse, When karar yazılır, Then araştırma esas alınır, kişisel tercih ancak çelişmediği yerlerde ek not olarak eklenir.
6. [Medium] Given doküman tamamlanır, When kullanıcı okur, Then dokümanın sonunda "bu kararların hangisi `ai-interface`'in şu anki halinde zaten karşılanıyor (ör. accessibility düzeltmeleri), hangisi eksik" kısa bir durum özeti bulunur (bir sonraki `plan` adımına doğrudan girdi olması için).

## Davranış Sözleşmesi (hangi durumda ne döner)
Bu görev çalışan kod üretmiyor — API/servis semantiği (girdi geçersiz, dış bağımlılık hatası, zaman aşımı) bu doküman-üretim görevine uygulanmıyor, standart tablo silindi. Yerine bu görevin kendi hata sınıfları:

| # | Durum | Dönen değer | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path: 6 kategori, her biri OLMALI+OLMAMALI+gerekçe ile dolu | `decision-matrix.md` dosyası | Dosya diskte oluşur | Tam matris + durum özeti | AC-1,2,3,6 |
| 2 | Araştırma ile kişisel tercih çelişir | Araştırma kazanır, çelişki not olarak yazılır (gizlenmez) | Doküman "Not: kişisel tercih X, araştırma Y diyor" satırı içerir | Şeffaf çelişki notu | AC-5 |
| 3 | Bir madde ikili sınıfa girmiyor ("duruma göre") | Üçüncü sütuna/nota yazılır, zorla OLMALI/OLMAMALI'ya sıkıştırılmaz | Yok | "DURUMA GÖRE: ..." notu | AC-4 |
| 4 | Bir kategori için mevcut araştırmada hiç bulgu yoksa | O kategori "araştırma kapsamı dışı — varsayımla dolduruldu" notuyla işaretlenir, sessizce icat edilmez | Assumptions bölümüne de eklenir | Açık "varsayım" etiketi | — |

Kısmi başarı: Bir kategori doldurulup diğeri doldurulamazsa (ör. yetersiz araştırma), doküman "TASLAK — eksik kategori: X" başlığıyla teslim edilir, tamamlanmış gibi sunulmaz.
Hiçbir şey yapılamadı ama hata da yok: Bu görevde uygulanmaz — döküman-üretim tek adımlı ve deterministik, "sessiz başarısızlık" riski yok.
Boş sonuç ↔ hata ayrımı: Uygulanmaz (API/DB sorgusu yok).

## Test Strategy
Unit: 0% — uygulanmaz (kod yok).
Integration: 0% — uygulanmaz.
E2E: 0% — uygulanmaz.
Doğrulama stratejisi (test piramidinin yerine): **insan incelemesi + araştırma-tutarlılık kontrolü.** Kullanıcı (Yusuf) dokümanı okuyup onaylar; her "OLMALI"/"OLMAMALI" satırının bir kaynağa/örneğe referans verip vermediği elle kontrol edilir.

## Benchmark / Başarı Ölçütü
Coverage Target: uygulanmaz.
Performance Target: yok.
Görsel/UI kriteri: yok (bu görev UI üretmiyor, sadece karar dokümanı).
Diğer ölçülebilir kriterler:
- 6/6 kategori dolu.
- Her kategoride en az 1 OLMALI + en az 1 OLMAMALI madde, ikisi de kaynak/örnek içerir (0 gerekçesiz madde).
- Dokümanın sonunda "eksik/karşılanıyor" durum özeti var.

## Kapsam Dışı
- Gerçek kod/component değişikliği (bu `plan`/`code-copilot` adımlarının işi — accessibility düzeltmeleri gibi kritik/net bulgular zaten ayrı, doğrudan uygulandı).
- Yeni bölüm implementasyonu.
- Görsel tasarım/mockup/wireframe üretimi (Figma/Stitch vb.).
- Yeni web araştırması — mevcut `design_research.html` bulguları + `web-quality-skills` denetim sonucu bu görev için yeterli kabul edilir.

## Etkilenen Dosyalar/Modüller (bilinen)
- `ai-interface/obss_project/artifacts/portfolyo-icerik-karar-matrisi/decision-matrix.md` (yeni, bu görevin tek çıktısı)
- Referans (okunacak, değiştirilmeyecek): önceki `design_research.html` artifact'ı, `web-quality-skills` denetim sonuçları (accessibility 89→100, düzeltilen 3 bulgu)

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — ama bu görev hiçbir Glob/Grep/geniş kapsamlı arama yapmıyor (sadece önceki konuşma bağlamından sentezleme), risk düşük.

## Rollback Beklentisi
Doküman kullanıcı onayı almazsa (7. adımdaki hard-stop), üzerine yazılmaz — düzeltme istenen kısımlar güncellenip tekrar sunulur.

## Risks
- Kişisel zevkin veri-destekli bulgularla karışması — AC-5 ile azaltıldı.
- Maddelerin çok genel/jenerik kalması — AC-2/AC-3'teki "somut örnek/kaynak zorunlu" kuralıyla azaltıldı.

## Assumptions
- Kullanıcının "bunların tersi" ifadesi "OLMAMALI" listesi anlamına geliyor.
- Mevcut `design_research.html` + `web-quality-skills` bulguları bu karar dokümanı için yeterli veri tabanı sayılıyor.

## Unknowns
- Kullanıcının şirket/marka kimliği tercihleri henüz belirtilmedi — decision-matrix.md'de bu tür bir kısıt çıkarsa Unknowns'a not düşülecek.

## Sorular ve Cevaplar (ham kayıt)
1. Happy path formatı → Kategori bazında iki sütunlu OLMALI/OLMAMALI tablosu — (Sonnet 5 low alt-ajanı tarafından yanıtlandı, önceki oturumdan taşındı).
2. Araştırma vs kişisel tercih çelişkisi → Araştırma önceliklidir — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
3. "Duruma göre değişir" maddeler → Üçüncü sütun/not — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
4. Davranış sözleşmesi uyarlaması → Doküman-özel satırlar — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
5. Başarı ölçütü → Her kategori ≥1 örnek/gerekçe — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
6. Kapsam dışı → Kod/component değişikliği, mockup üretimi — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
7. Bağımlılıklar → design_research.html + web-quality-skills denetimi yeterli — (kullanıcı mesajından + oturum bağlamından).
8. Riskler → Kişisel zevk/veri karışması, jenerik tavsiye riski — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
9. Kabul kriteri sahibi → Sadece kullanıcı — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
10. Test stratejisi → 0/0/0, insan incelemesi — (Sonnet 5 low alt-ajanı tarafından yanıtlandı).
11. Persona/Hedef/Kapsam dışı → (kullanıcı mesajından: "sıfırdan başlayalım" = aynı görevi yeniden onaya sun, içerik zaten netti).
