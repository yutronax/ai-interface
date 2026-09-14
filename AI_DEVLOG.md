# AI Dev Log

Bilinçli kapsam/mimari kararları ve pipeline sırasında bulunan gerçek zorlukların kaydı. Pipeline adımlarının kendi artifact dosyalarından (`obss_project/artifacts/<task-slug>/`) aktarılır.

## lcp-hero-boot-font-fix (2026-09-14)

**Karar (kaynak: plan.md):** Self-host font yerine Google Fonts korunup stylesheet'i `preload+async` pattern'ine çevrildi — atdd.md self-host'u opsiyonel işaretlemişti, preconnect zaten mevcuttu, async pattern daha az dosya/lisans riskiyle AC-4/AC-6'yı karşılıyor.

**Sapma (kaynak: code_diff.md → red_team.json):** plan.md'nin Kararlar #2'si (boot animasyonunun basit fade/clip-path CSS reveal'ına taşınması) implementasyonda uygulanmadı — h1 artık hiçbir görsel reveal olmadan direkt statik render ediliyor. AC'ler harfiyen karşılanıyor (h1 mount anında tam metin) ama portfolyonun "terminal boot" görsel kimliği h1 üzerinde tamamen kayboldu. Red-team bunu `medium` şiddetinde bir scope bulgusu olarak işaretledi — gerekirse ayrı bir polish görevi olarak ele alınabilir.

**Bulunan ve düzeltilen gerçek sorunlar (kaynak: verify sırasında canlı tespit):** code-copilot dispatch'i sonrası test dosyasında 2 buggy assertion vardı (biri matematiksel olarak her zaman false dönen `not.toContain(fullName.slice(0,-1))`, diğeri testing-library'nin whitespace normalize etmesi yüzünden yanlış regex) — implementasyon doğruydu, testler hatalıydı, ayrı Haiku dispatch'leriyle düzeltildi. Ayrıca prettier format ve bir TS tip hatası (`Element` vs `HTMLElement`) verify aşamasında bulunup düzeltildi.

**Ölçüm sonucu (kaynak: verify_report.md):** Gerçek prod build + gerçek Lighthouse: LCP 941ms (önceki ~5-6s'den), Element Render Delay 215ms (önceki ~1489ms'den, hedef <200ms'e çok yakın).

**Açık madde (kaynak: verify_report.md):** AC-5 (mobile throttle) ve AC-6 (font offline fallback) canlı doğrulanmadı — sadece desktop preset Lighthouse ve kod incelemesiyle değerlendirildi.

## uptime-izleme-pm2-recovery (2026-09-14)

**Karar (kaynak: plan.md):** Ayrı bir `/health` HTTP endpoint'i eklenmedi — TanStack Start'ın server-route API'si bu repoda hiç kullanılmamıştı (versiyon doğrulanmadı), risk/fayda oranı düşüktü. Mevcut `/` zaten SSR ile 200 döndüğü sürece uptime-check hedefi olarak yeterli.

**Risk (kaynak: atdd.md):** Tek dış servise (VPS'in kendisi) bağımlılık — script'in çalıştığı VPS'in kendisi down olursa hiçbir bildirim gitmez. Kabul edilen risk (tek sunuculu kişisel proje, ikinci izleme katmanı kapsam dışı).

**Rollback (kaynak: atdd.md):** İzleme pasif/read-only bir dış katman — bozulursa cron job/monitör devre dışı bırakılıp eski duruma dönülebilir, canlı siteye etkisi yok. PM2 config değişikliği `git revert` + `pm2 reload` ile geri alınabilir.

**Bulunan ve düzeltilen gerçek sorun (kaynak: red_team.json → code_diff.md):** İlk implementasyonda `fetch(checkUrl, { timeout: 10000 })` kullanılmıştı — Node'un yerleşik (undici) fetch implementasyonu `timeout` seçeneğini desteklemiyor, sessizce yok sayıyordu. Gerçek bir zaman aşımı yoktu; site bağlantıyı kabul edip hiç yanıt vermezse cron script'i süresiz askıda kalabilirdi. Red-team incelemesi bunu yakaladı (main() unit test kapsamında değildi), `AbortSignal.timeout(10000)` ile düzeltildi. Ayrıca `pm2 jlist` başarısız olduğunda kod "process online" varsayıyordu (sessiz-başarısızlık riski) — pessimist (offline) varsayacak şekilde düzeltildi.

**Varsayımlar (kaynak: code_diff.md):** Bildirim kanalı Telegram Bot API; cron aralığı 5 dk; ardışık fail eşiği 2 — kullanıcı onayı bekliyor, VPS kurulumunda değiştirilebilir.

**Gerçek VPS deploy'unda bulunan ve düzeltilen 3 ek hata (2026-09-14, bkz. DEPLOY.md için tam detay):** Yerel test/build hiçbirinin yakalayamadığı, sadece gerçek VPS'e deploy edilip canlı test edildiğinde ortaya çıkan hatalar: (1) `checkPm2ProcessStatus` gerçek `pm2 jlist` şeklini (`pm2_env.status`, üst seviye `status` değil) yanlış okuyordu — test mock'u da aynı yanlış şekli kullandığı için 62 test yeşildi ama gerçek PM2 ile hiç eşleşmiyordu; (2) Telegram webhook payload'ı `{type,message,timestamp}` gönderiyordu, Telegram `{text}` bekliyor, 400 dönüyordu; (3) `ecosystem.config.js`'in `env` bloğunda `PORT:8081` unutulmuştu, server 3000'e döndü, nginx 502 verdi. Üçü de commit `3d596f1` ve `ec40b07` ile düzeltildi, canlı crash simülasyonuyla (DOWN+RECOVERED bildirimi gerçekten Telegram'a ulaştı) doğrulandı.

**Açık madde:** `.env`'deki Telegram bot token'ı sohbette paylaşılmıştı, kullanıcı revoke etmeyi "sonra" yapmayı tercih etti — henüz yenilenmedi.
