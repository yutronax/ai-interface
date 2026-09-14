# Setup

## Uptime İzleme + PM2 Auto-Recovery (uptime-izleme-pm2-recovery)

VPS'te tam kurulum adımları için [docs/deploy/monitoring-setup.md](docs/deploy/monitoring-setup.md) dosyasına bakın. Özet:

Env değişkenleri (`.env`, repoya committ edilmez — `.env.example`'a bakın):
- `TELEGRAM_WEBHOOK_URL` — Telegram bot webhook URL'i (boşsa bildirim gönderilmez, sessizce atlanır)
- `UPTIME_CHECK_URL` — izlenecek site URL'i (varsayılan `http://localhost:3000`)
- `PM2_PROCESS_NAME` — `ecosystem.config.js`'teki process adıyla eşleşmeli (varsayılan `ai-interface`)
- `FAILURE_THRESHOLD` — ardışık kaç başarısız kontrolden sonra bildirim gönderileceği (varsayılan `2`)

VPS'te gerekli adımlar (kod dışı, manuel):
- `pm2 install pm2-logrotate`
- `pm2 reload ecosystem.config.js`
- Cron: `*/5 * * * * cd /path/to/app && node scripts/uptime-check.mjs`
