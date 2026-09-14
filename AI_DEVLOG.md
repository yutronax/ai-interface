# AI Dev Log

Bilinçli kapsam/mimari kararları ve pipeline sırasında bulunan gerçek zorlukların kaydı. Pipeline adımlarının kendi artifact dosyalarından (`obss_project/artifacts/<task-slug>/`) aktarılır.

## uptime-izleme-pm2-recovery (2026-09-14)

**Karar (kaynak: plan.md):** Ayrı bir `/health` HTTP endpoint'i eklenmedi — TanStack Start'ın server-route API'si bu repoda hiç kullanılmamıştı (versiyon doğrulanmadı), risk/fayda oranı düşüktü. Mevcut `/` zaten SSR ile 200 döndüğü sürece uptime-check hedefi olarak yeterli.

**Risk (kaynak: atdd.md):** Tek dış servise (VPS'in kendisi) bağımlılık — script'in çalıştığı VPS'in kendisi down olursa hiçbir bildirim gitmez. Kabul edilen risk (tek sunuculu kişisel proje, ikinci izleme katmanı kapsam dışı).

**Rollback (kaynak: atdd.md):** İzleme pasif/read-only bir dış katman — bozulursa cron job/monitör devre dışı bırakılıp eski duruma dönülebilir, canlı siteye etkisi yok. PM2 config değişikliği `git revert` + `pm2 reload` ile geri alınabilir.

**Bulunan ve düzeltilen gerçek sorun (kaynak: red_team.json → code_diff.md):** İlk implementasyonda `fetch(checkUrl, { timeout: 10000 })` kullanılmıştı — Node'un yerleşik (undici) fetch implementasyonu `timeout` seçeneğini desteklemiyor, sessizce yok sayıyordu. Gerçek bir zaman aşımı yoktu; site bağlantıyı kabul edip hiç yanıt vermezse cron script'i süresiz askıda kalabilirdi. Red-team incelemesi bunu yakaladı (main() unit test kapsamında değildi), `AbortSignal.timeout(10000)` ile düzeltildi. Ayrıca `pm2 jlist` başarısız olduğunda kod "process online" varsayıyordu (sessiz-başarısızlık riski) — pessimist (offline) varsayacak şekilde düzeltildi.

**Varsayımlar (kaynak: code_diff.md):** Bildirim kanalı Telegram Bot API; cron aralığı 5 dk; ardışık fail eşiği 2 — kullanıcı onayı bekliyor, VPS kurulumunda değiştirilebilir.
