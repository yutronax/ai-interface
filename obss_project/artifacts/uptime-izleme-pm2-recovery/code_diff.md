# Code Diff — uptime-izleme-pm2-recovery (green step)

## Oluşturulan Dosyalar
- `scripts/uptime-check.mjs` — 6 export fonksiyon (`isHealthy`, `evaluateFailureThreshold`, `shouldNotifyRecovery`, `checkPm2ProcessStatus`, `buildNotificationPayload`, `sendWebhookNotification`) + `main()` (cron'da doğrudan çalıştırıldığında tetiklenir, `.uptime-state.json` ile durumu saklar)
- `ecosystem.config.js` — PM2 config: `max_restarts:10`, `min_uptime:"30s"`, `exponential_backoff_restart_delay:100`, log yolları
- `docs/deploy/monitoring-setup.md` — VPS manuel kurulum rehberi (Telegram bot, cron, pm2-logrotate, test-alert doğrulaması)
- `.env.example` — placeholder env değişkenleri (gerçek secret yok)

## Değiştirilen Dosyalar
- `.gitignore` — `scripts/.uptime-state.json`, `.env`, `.env.*.local` eklendi

## Doğrulama
`npx vitest run scripts/uptime-check.test.ts` → **62/62 test PASS** (test-copilot'un yazdığı test dosyasına hiç dokunulmadı).

## AC Karşılanması
| AC | Durum |
|---|---|
| AC-1..AC-8 | Karşılandı — testlerle doğrulandı |
| AC-S1 (secret sızıntısı) | Karşılandı — `.env.example` placeholder, `.gitignore` `.env` hariç tutuyor |
| AC-S2/AC-S3 (`/health` endpoint) | N/A — plan.md kararı: yeni endpoint eklenmedi, mevcut `/` kullanılıyor |

## Kalan Sınırlamalar (repo-only ortamdan kaynaklı)
- VPS'e gerçek cron kurulumu, Telegram bot oluşturma ve `.env` dosyasının VPS'te doldurulması bu oturumdan yapılamaz — `docs/deploy/monitoring-setup.md` adım adım kullanıcıya bırakılan manuel işlemler.
- `pm2-logrotate` global PM2 modülü, VPS'te ayrıca kurulmalı (doküman içinde komut var).

## Varsayımlar (kullanıcı onayı bekliyor)
- Bildirim kanalı Telegram Bot API.
- Cron aralığı 5 dk, ardışık fail eşiği 2.
