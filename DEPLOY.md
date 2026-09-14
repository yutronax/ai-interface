# Deploy

## VPS Bilgileri

- Sunucu: `161.35.126.250` (aynı VPS'te `mavi-lojistik-otomasyon` da çalışıyor — process isimleri çakışmaz)
- Proje dizini: `/opt/ai-interface`
- PM2 process adı: `ai-interface`
- Gerçek dinleme portu: **8081** (nginx reverse-proxy bunu bekliyor — `ecosystem.config.js`'in `env.PORT` alanı bu portu set eder, eksik olursa server varsayılan 3000'e döner ve 502 alınır)
- Public URL: `https://yusufcinar.duckdns.org/`
- Build çıktısı: `.output/server/index.mjs` (vite/nitro `node-server` preset — bkz. `vite.config.ts`)

## Önemli: `/opt/ai-interface` bir git repo DEĞİL

VPS'teki proje dizininde sadece build çıktısı (`.output/`) var, `.git` yok. Kod değişikliği `git pull` ile gelmiyor — güncel dosyalar GitHub'dan `curl` ile tek tek çekiliyor (bkz. aşağıda). Bu, projenin normal geliştirme akışından (yerel repo + git) farklı bir deploy modeli — ileride bir CI/CD pipeline'a bağlanmadıysa hâlâ böyledir.

## Deploy Adımları (kod/config dosyası değiştiğinde)

1. Değişikliği yerelde commit'le, `main`'e push et.
2. VPS'te ilgili dosyayı GitHub'dan indir (commit hash ile, `raw.githubusercontent.com` üzerinden):
   ```bash
   curl -fsSL -o /opt/ai-interface/<dosya-yolu> https://raw.githubusercontent.com/yutronax/ai-interface/<commit-hash>/<dosya-yolu>
   md5sum /opt/ai-interface/<dosya-yolu>   # yerel md5sum ile karşılaştır, indirmenin bozulmadığını doğrula
   ```
3. **`ecosystem.config.js` değiştiyse** (`env` bloğu dahil): `pm2 restart` YETMEZ, PM2 dosyayı yeniden okumaz.
   ```bash
   cd /opt/ai-interface
   pm2 delete ai-interface
   pm2 start ecosystem.config.js --only ai-interface
   pm2 save
   ```
4. **Sadece kod dosyası değiştiyse** (`ecosystem.config.js` aynı kaldıysa): `pm2 restart ai-interface` yeterli.
5. Doğrula:
   ```bash
   curl -s -o /dev/null -w "localcode=%{http_code}\n" http://127.0.0.1:8081
   curl -s -o /dev/null -w "publiccode=%{http_code}\n" https://yusufcinar.duckdns.org/
   pm2 logs ai-interface --lines 20 --nostream
   ```
   İkisi de `200` değilse `pm2 logs` ile gerçek hatayı oku — "online" görünmesi process'in gerçekten istek karşıladığı anlamına gelmez.

## Uptime İzleme + PM2 Auto-Recovery (2026-09-14, görev: `uptime-izleme-pm2-recovery`)

Detaylı kullanıcı rehberi: [docs/deploy/monitoring-setup.md](docs/deploy/monitoring-setup.md). Burada gerçek VPS kurulumunda karşılaşılan ve genel rehberde olmayan sorunlar var:

### Kurulan bileşenler
- `ecosystem.config.js` — PM2 restart limitleri (`max_restarts:10`, `min_uptime:30s`, exponential backoff) + log yolları + `PORT:8081`
- `scripts/uptime-check.mjs` — 5 dakikada bir cron ile çalışan HTTP+PM2 sağlık kontrolü, Telegram bildirimi
- `/opt/ai-interface/.env` (VPS'te, **repoya committ edilmez**) — `TELEGRAM_WEBHOOK_URL`, `UPTIME_CHECK_URL`, `PM2_PROCESS_NAME`, `FAILURE_THRESHOLD`
- `pm2-logrotate` modülü — kurulu ve aktif
- Cron: `*/5 * * * * cd /opt/ai-interface && /usr/bin/node --env-file=.env scripts/uptime-check.mjs >> logs/uptime-check.log 2>&1`

### Gerçek deploy sırasında bulunan ve düzeltilen 3 hata

1. **PM2 durum kontrolü kırıktı** — `checkPm2ProcessStatus()` `process.status` okuyordu, gerçek `pm2 jlist` çıktısında durum `process.pm2_env.status` altında. PM2 gerçekten online olsa bile script "offline" sanıyordu. Testler mock verisini yanlış şekillendirdiği için bunu yakalayamamıştı. Düzeltme: commit `3d596f1`.
2. **Telegram webhook payload formatı yanlıştı** — script kendi `{type,message,timestamp}` JSON'ını POST ediyordu, Telegram `sendMessage` `{text:"..."}` bekliyor, `400 Bad Request` dönüyordu. Düzeltme: commit `3d596f1`.
3. **`ecosystem.config.js`'te `PORT` env değişkeni eksikti** — eski (config'siz) process `PORT=8081` ile elle başlatılmıştı, bu `ecosystem.config.js`'e taşınmamıştı; yeni config uygulanınca server 3000'e döndü, nginx 502 verdi. Düzeltme: commit `ec40b07`.

Üçü de sadece **gerçek VPS'e deploy edilip canlı test edildiğinde** ortaya çıktı — hiçbiri yerel `npm run build`/`vitest`/`eslint` ile yakalanamazdı (mock verisi yanlıştı, gerçek Telegram API'ye hiç istek atılmamıştı, gerçek nginx/port eşleşmesi yerel ortamda yok). Bu, `.output` dosyasını doğrudan build edip deploy etmenin ve mock'lu testlerin neden VPS'teki gerçek doğrulamanın yerini tutmadığının somut kanıtı.

### Doğrulanmış durum (2026-09-14)
- `pm2 list` → `ai-interface` online, port 8081
- `curl 127.0.0.1:8081` → 200, `curl https://yusufcinar.duckdns.org/` → 200
- Gerçek crash simülasyonu (`pm2 stop` + 2x manuel çalıştırma) → Telegram'a DOWN bildirimi geldi, doğru public URL ile
- `pm2 start` + manuel çalıştırma → Telegram'a RECOVERED bildirimi geldi
- `pm2 save` yapıldı — reboot sonrası aynı config'le ayağa kalkar

### Bilinen açık madde
`.env`'deki Telegram bot token'ı ilk oluşturulduğu haliyle duruyor (kullanıcı revoke etmeyi ertelemeyi tercih etti — bkz. AI_DEVLOG.md). Token'ı `@BotFather` → `/mybots` → botu seç → `API Token` → `Revoke current token` ile yenileyip `/opt/ai-interface/.env`'i güncellemek kullanıcının kendi kararına bırakıldı.
