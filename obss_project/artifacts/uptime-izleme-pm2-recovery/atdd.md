---
task_slug: uptime-izleme-pm2-recovery
jira_id: null
saga_task_id: 385
threat_model: done
priority: medium
coverage_target: null
performance_target: "downtime tespiti <=10 dakika"
memory_target: null
test_strategy:
  unit: 10
  integration: 30
  e2e: 60
affected_modules:
  - ecosystem.config.js
  - VPS cron/systemd timer (yeni health-check script)
  - pm2-logrotate modülü
---

# ATDD — uptime-izleme-pm2-recovery

## Jira Kaynağı
Jira'ya bağlı değil — yerel görev. Saga task #385'ten devam ediliyor.

## Saga Kaynağı
[Saga #385](saga://task/385) — "ai-interface - izleme/uyarı (uptime monitoring + PM2 auto-recovery)"
Açıklama (Saga'dan birebir): "Site çöktüğünde şu an kimse haberdar olmuyor (VPS'teki ai-interface PM2 process'i bir kez sessizce crash-loop'a girip pm2 listesinden düştü, kullanıcı fark edene kadar 'Bad Gateway' olarak kaldı). Basit bir uptime-check (ör. UptimeRobot/cron+curl+webhook) ve PM2'nin restart/health-check davranışının gözden geçirilmesi (max restart limiti, exponential backoff, log rotasyonu) gerekiyor."
Epic: #56 — "Prod altyapı ve sistem yükseltme (VPS deploy, izleme, LCP, kapsam)"

## Persona
Tek başına site sahibi/geliştirici Yusuf Cinar. Proje kişisel, başka paydaş yok, tüm bildirimleri kendisi alacak. *(Sonnet 5 low alt-ajanı tarafından yanıtlandı: proje kişisel portfolio, tek geliştirici bağlamı Saga'da açık.)*

## Hedef (Neden)
Crash-loop sessizce oluştuğunda ("Bad Gateway" fark edilene kadar sürdü) kimse haberdar olmadı. Hedef: downtime'ı dakikalar içinde otomatik tespit edip Yusuf'a bildirmek ve PM2'nin anlamsız/sonsuz restart döngüsüne düşmesini engellemek. *(kullanıcı mesajından/Saga açıklamasından)*

## User Story
As a tek geliştirici/site sahibi (Yusuf)
I want site çöktüğünde otomatik bildirim almak ve PM2'nin restart davranışının kontrollü olmasını
So that "Bad Gateway" durumu kullanıcı fark edene kadar sessizce sürmesin

## Acceptance Criteria (Given-When-Then, önceliklendirilmiş)
1. [Critical] Given site ayaktayken, When uptime-check (ör. 5 dk aralıkla) HTTP isteği atar, Then 2xx yanıt alınır ve hiçbir bildirim gönderilmez.
2. [Critical] Given site 2 ardışık kontrolde (≈5-10 dk) 2xx dışı yanıt veya timeout alıyorken, When eşik aşılır, Then Telegram/Discord webhook üzerinden Yusuf'a "DOWN" bildirimi gider.
3. [Critical] Given PM2 process crash olduğunda, When PM2 restart dener, Then ecosystem.config.js'teki `max_restarts` + `exponential_backoff_restart_delay` + `min_uptime` ayarlarına göre üstel gecikmeyle sınırlı sayıda dener, sonsuz restart-loop'a girmez.
4. [High] Given PM2 process max_restarts limitine ulaşıp "errored/stopped" durumuna geçtiğinde, When bu durum oluşur, Then sadece HTTP uptime-check'e güvenilmez — ayrı bir pm2-process-durumu kontrolü (cron + `pm2 jlist`) de bunu tespit edip bildirim gönderir.
5. [High] Given site tekrar ayağa kalktığında (recovery), When bir sonraki başarılı check gelir, Then "recovered" bildirimi gönderilir (sürekli DOWN bildirimi tekrarlanmaz).
6. [Medium] Given geçici tekil ağ kesintisi/DNS hıçkırığı oluştuğunda, When sadece 1 check başarısız olur (eşiğin altında), Then bildirim gönderilmez (false-positive/spam önlenir).
7. [Medium] Given log dosyaları büyüdüğünde, When pm2-logrotate aktifse, Then log dosyaları disk taşırmadan rotate edilir.
8. [High] Given webhook/bot token secret olarak saklanmışken, When repo veya herhangi bir HTTP yanıtı incelenirse, Then token hiçbir dosyada (git-tracked) veya `/health` yanıtında görünmez. (AC-S1)
9. [Medium] Given `/health` endpoint'i dışarıya açıksa, When endpoint çağrılır (hata durumu dahil), Then yanıt sadece basit `{"status":"ok"|"down"}` içerir — stack trace, dosya yolu, env değişkeni veya internal hata mesajı sızmaz. (AC-S2)
10. [Medium] Given `/health` endpoint'i saniyede yüzlerce kez çağrıldığında, When bu istekler gelir, Then endpoint DB sorgusu/ağır işlem yapmadığı için sunucuyu yormaz (basit process-check, sabit maliyetli). (AC-S3)

## Threat Model
Çağrıldı — `threat-model` skill'i STRIDE-lite ile değerlendirdi. Tetikleyiciler: dış API çağrısı (Telegram/Discord webhook, UptimeRobot API) ve potansiyel yeni HTTP ucu (`/health`).

- **Spoofing**: İzleme sistemi sadece dışa giden (outbound) webhook çağrısı yapıyor, inbound komut almıyor (Telegram bot polling/webhook-receive modu kullanılmıyor) — bu kategori düşük risk, aktif önlem gerekmiyor.
- **Tampering**: İstemciden gelen hiçbir veri restart/bildirim mantığına girmiyor (sadece sunucu-taraflı health durumu) — düşük risk.
- **Repudiation**: Tek kullanıcılı kişisel sistem, işlem izi (audit log) gereksinimi yok — kabul edilen risk (bkz. Risks).
- **Information disclosure**: `/health` endpoint'i dışarıya açık olursa hata detayı/stack trace sızabilir → **AC-S2** eklendi.
- **Denial of Service**: `/health` endpoint'i ağır bir sorgu çalıştırırsa dışarıdan tekrarlı çağrılarla kaynak tüketimine yol açabilir → **AC-S3** eklendi. Ayrıca webhook token/secret sızarsa saldırgan sahte "recovered/down" spam'i tetikleyebilir → **AC-S1** eklendi.
- **Elevation of privilege**: Yetki/rol sistemi yok, tek kullanıcı — bu kategori uygulanmıyor.

Sonuç: AC-S1, AC-S2, AC-S3 yukarıdaki Acceptance Criteria listesine eklendi (madde 8-10).

## Davranış Sözleşmesi (hangi durumda ne döner)
| # | Durum | Dönen değer / durum kodu | Yan etki | Kullanıcı ne görür | AC |
|---|---|---|---|---|---|
| 1 | Happy path (site ayakta) | Uptime check 200 | Bildirim yok, PM2 "online" | Hiçbir şey (sessiz normal durum) | AC-1 |
| 2 | Config hatalı (webhook URL/PM2 ayarı yanlış) | Kurulumda test-alert başarısız | Yok | Kurulum sırasında hemen fark edilir (zorunlu test-alert adımı) | AC-2 |
| 3 | Kaynak yok (site/domain yanlış yapılandırılmış) | Sürekli fail | N-fail eşiğinden sonra DOWN bildirimi | Telegram/Discord mesajı | AC-2 |
| 4 | Yetkisiz erişim (webhook token expired/401) | Bildirim API'den 401/403 | Log dosyasına yazılır + varsa email fallback | Bildirim gelmez ama log'da görünür (sessiz başarısızlık YASAK) | AC-2 |
| 5 | Dış bağımlılık hatası (UptimeRobot/webhook API down) | Retry + log | Durum loglanır | Gecikmeli bildirim veya log kaydı | AC-2 |
| 6 | Zaman aşımı (health-check timeout 10-30sn) | Timeout = "down" sayılır | Fail sayacı artar | Eşik aşılırsa bildirim | AC-2 |
| 7 | Kısmi başarı (uptime bildirimi çalışıyor ama PM2 max_restarts=0 gibi yanlış ayarlı) | Bildirim doğru gider | Process kendini toparlayamaz | Bildirim gelir, manuel `pm2 restart` gerekir (MVP'de tam self-heal hedeflenmiyor) | AC-3 |
| 8 | Hiçbir şey yapılamadı ama hata yok (asıl tetikleyici olay — sessiz crash-loop) | Bu satır asıl önlenmek istenen durum | HTTP check + PM2 process-list kontrolü birlikte kullanılır | Downtime en geç ~10 dk içinde bildirim olarak görünür | AC-4 |

Kısmi başarı: Satır 7'de detaylandırıldı — uptime bildirimi çalışır ama PM2 kendini toparlayamazsa kullanıcı bildirim alır, manuel müdahale gerekir. Bu MVP kapsamında kabul edilebilir (tam otomatik self-healing hedef değil).
Hiçbir şey yapılamadı ama hata da yok: Satır 8 — bu senaryonun kendisi görevi tetikleyen olay. Çözüm: sadece HTTP uptime-check yeterli değil, PM2 process-list durumu da (cron + `pm2 jlist`) ayrıca izlenmeli, aksi halde process pm2 listesinden düşse bile bir ara katman (proxy/cache) "site up" gibi görünen yanlış pozitif verebilir.
Boş sonuç ↔ hata ayrımı: Bu görevde "boş sonuç" kavramı yok (izleme/bildirim görevi, veri sorgusu değil) — bu satır uygulanmıyor, silinmedi çünkü şablon zorunlu kılıyor; N/A olarak işaretlenmiştir.

## Test Strategy
Unit: %10 — varsa health-check script'inin küçük fonksiyon testleri (ör. eşik sayacı mantığı)
Integration: %30 — PM2 config'in gerçek restart/backoff davranışını simüle etme (`pm2 restart`, kasıtlı crash tetikleme, log rotasyonu doğrulama)
E2E: %60 — gerçek VPS'te process'i bilerek öldürüp uçtan uca bildirimin gelip gelmediğini manuel izleme
*(Sonnet 5 low alt-ajanı tarafından yanıtlandı: bu bir altyapı/config görevi olduğundan klasik unit-ağırlıklı piramit yerine e2e/manuel doğrulama ağırlıklı bir dağılım daha uygun — asıl risk kod mantığında değil, gerçek altyapı entegrasyonunda.)*

## Benchmark / Başarı Ölçütü
Coverage Target: N/A (altyapı görevi, kod coverage ölçütü anlamlı değil)
Performance Target: Downtime tespiti ≤10 dakika içinde bildirim olarak ulaşmalı
Memory: N/A
Görsel/UI kriteri: Yok (bu görev UI değiştirmiyor)
Diğer ölçülebilir kriterler: False-positive/spam bildirim oranı sıfıra yakın (ardışık 2-3 fail eşiği sayesinde); PM2 restart limiti aşılırsa ayrıca "process durdu" bildirimi gitmeli.

## Kapsam Dışı
Grafana/Prometheus/APM kurulumu, çoklu sunucu/load balancer/failover senaryosu, SLA raporlama/uptime dashboard'u, otomatik self-healing (process'in kendini yeniden deploy etmesi). *(Sonnet 5 low alt-ajanı tarafından yanıtlandı: MVP kapsamı sadece tespit+bildirim+PM2 restart ayarları.)*

## Etkilenen Dosyalar/Modüller (bilinen)
- `ecosystem.config.js` (PM2 config — max_restarts, min_uptime, exponential_backoff_restart_delay, log dosyaları)
- VPS'te yeni cron job veya systemd timer (health-check script'i için)
- `pm2-logrotate` modülü (kurulacaksa)
- Bildirim servisi: Telegram Bot API varsayımı (ücretsiz, UptimeRobot'un native Telegram entegrasyonuyla uyumlu) — alternatif Discord webhook *(varsayım, kullanıcı onaylamadı — bkz. Assumptions)*

## Proje Ortamı Kısıtı (arama/grep kapsamı)
Doğrulanmadı — bu makinede git reposunun kökü proje klasörüyle (`ai-interface`) aynı mı, yoksa daha geniş bir dizin mi, kontrol edilmedi. Sonraki adımlarda (`plan`, `code-copilot`, `test-copilot`, `red-team`) Grep/Glob/Bash araması HER ZAMAN gerçek proje klasörüyle sınırlanmalı.

## Rollback Beklentisi
Uptime-check/bildirim ayarı yanlış çalışırsa (spam veya hiç bildirim gelmemesi), UptimeRobot monitörü/cron job devre dışı bırakılıp izlemesiz eski duruma dönülebilir — canlı siteye etkisi yok (izleme pasif/read-only dış katman). PM2 ecosystem config değişikliği `git revert` + `pm2 reload ecosystem.config.js` ile geri alınabilir.

## Risks
- Tek dış servise (UptimeRobot) bağımlılık — kendisi ulaşılamaz olursa false-negative riski.
- Webhook token/bot secret'ının VPS'te güvenli saklanması gerekiyor (repoya committ edilmemeli).

## Assumptions
- Bildirim kanalı olarak Telegram Bot API varsayıldı — kullanıcı onaylamadı, Discord veya email de olabilir.
- Uptime-check aralığı 5 dakika, ardışık fail eşiği 2-3 olarak varsayıldı — kesin sayı kullanıcı onayı bekliyor.

## Unknowns
- Yeni bir `/health` endpoint eklenip eklenmeyeceği (mevcut site zaten HTTP 200 dönüyorsa gerekmeyebilir) — plan adımında netleştirilmeli.
- VPS'e cron mu systemd timer mı kurulacağı, mevcut VPS ortamına bağlı — doğrulanmadı.

## Sorular ve Cevaplar (ham kayıt)
1. Persona → Tek başına site sahibi/geliştirici Yusuf Cinar (Sonnet 5 low alt-ajanı tarafından yanıtlandı: proje kişisel, tek kullanıcı bağlamı Saga'da açık)
2. Ana hedef → Crash-loop sessizce oluştuğunda kimse haberdar olmadı, downtime'ı dakikalar içinde tespit edip bildirmek (kullanıcı mesajından/Saga açıklamasından)
3. Happy path → 5 dk aralıkla uptime-check, 2 ardışık fail'den sonra Telegram/Discord bildirimi, PM2 ecosystem.config.js'te max_restarts+backoff+min_uptime (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
4. Edge case'ler → PM2 max-restart limiti aşılması, uptime-check servisinin kendisi ulaşılamaz olması, geçici ağ kesintisinde spam önleme (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
5. Davranış sözleşmesi → yukarıdaki tablo (Sonnet 5 low alt-ajanı tarafından yanıtlandı: sessiz başarısızlık senaryosuna özellikle vurgu yapıldı, çünkü bu görevin tetikleyici olayı)
6. Başarı ölçütü → downtime tespiti ≤10 dk, false-positive oranı ~0, restart limiti aşılırsa ayrı bildirim (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
7. Kapsam dışı → APM/Grafana/Prometheus, çoklu sunucu, SLA raporlama, tam self-healing (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
8. Bağımlılıklar → ecosystem.config.js, VPS cron/systemd, pm2-logrotate, Telegram Bot API varsayımı (Sonnet 5 low alt-ajanı tarafından yanıtlandı — varsayım, kullanıcı onayı gerekli)
9. Performans/güvenlik → webhook/token secret olarak saklanmalı, health endpoint hassas veri döndürmemeli (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
10. Rollback → izleme pasif dış katman, PM2 config git revert + reload ile geri alınabilir (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
11. Kabul kriteri sahibi → kullanıcı (Yusuf), otomatik test sınırlı, manuel test-crash doğrulaması esas (Sonnet 5 low alt-ajanı tarafından yanıtlandı)
12. Test stratejisi → unit %10 / integration %30 / e2e %60 (Sonnet 5 low alt-ajanı tarafından yanıtlandı: altyapı görevi, risk kod mantığında değil entegrasyonda)
