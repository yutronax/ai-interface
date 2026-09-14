# Deploy

## VPS Bilgileri

- Sunucu: `161.35.126.250` (aynı VPS'te `mavi-lojistik-otomasyon` da çalışıyor — process isimleri çakışmaz)
- Proje dizini: `/opt/ai-interface`
- PM2 process adı: `ai-interface`
- Gerçek dinleme portu: **8081** (nginx reverse-proxy bunu bekliyor — `ecosystem.config.js`'in `env.PORT` alanı bu portu set eder, eksik olursa server varsayılan 3000'e döner ve 502 alınır)
- Public URL: `https://yusufcinar.duckdns.org/`
- Build çıktısı: `.output/server/index.mjs` (vite/nitro `node-server` preset — bkz. `vite.config.ts`)

## `/opt/ai-interface` bir git repo DEĞİL — ama VPS'te build YAPILABİLİR (2026-09-14'te doğrulandı)

Canlı çalışan proje dizininin (`/opt/ai-interface`) kendisi git repo değil, sadece build çıktısını (`.output/`) barındırıyor. Önceden burada "her dosyayı GitHub raw'dan tek tek `curl` ile çek" yöntemi yazılıydı — bu, `Hero.tsx` gibi derlenen (bundle edilen) kaynak dosyalar değiştiğinde İŞE YARAMAZ, çünkü raw TSX'i sunucuya koymak tek başına hiçbir şey yapmaz; `.output/server/index.mjs`'in yeniden derlenmesi gerekir.

**Doğru yöntem: VPS'te git + npm + internet erişimi VAR, build orada ayrı bir dizinde yapılıp sadece `.output` canlıya geçiriliyor.** Bu, dosya indirme/transfer derdini (scp/download) tamamen ortadan kaldırıyor — GitHub'dan doğrudan clone edilir.

## SSH Erişimi — CLI ajanından DEĞİL, kendi bilgisayarınızdan

Bu ortamdan (Claude Code sandbox) VPS'e doğrudan SSH erişimi yok — private key kullanıcının kendi Windows bilgisayarında. Tüm SSH komutlarını kullanıcı kendi PowerShell'inden çalıştırıp çıktıyı yapıştırır. **Dikkat:** eğer kullanıcının erişebildiği başka bir sunucu/jump-box varsa (ör. `ubuntu-s-1vcpu-...` gibi farklı bir VPS), o kutunun bu VPS'e SSH key erişimi OLMAYABİLİR — "Permission denied (publickey)" hatası genelde bunun işareti, doğru makineyi (key'in bulunduğu bilgisayar) doğrulayın.

## Deploy Adımları (kod/config dosyası değiştiğinde) — Git+Build Yöntemi

1. Değişikliği yerelde commit'le, `main`'e push et.
2. VPS'te ayrı bir build dizininde (canlı dizine hiç dokunmadan) taze clone + build yap:
   ```bash
   ssh -p 2222 root@161.35.126.250 "rm -rf /opt/ai-interface-build && git clone --depth 1 https://github.com/yutronax/ai-interface.git /opt/ai-interface-build && cd /opt/ai-interface-build && npm install --no-audit --no-fund && npx vite build && ls -la .output/server/index.mjs"
   ```
   **Bilinen sorun — `npm install` `Cannot read properties of null (reading 'edgesOut')` hatasıyla çöküyorsa:** VPS'in sistem npm'i (10.8.2, Node 20.20.2 ile) bu Arborist bug'ına takılıyor. `npm cache clean --force` + `node_modules`/`package-lock.json` silme İŞE YARAMAZ (denendi, aynı hata tekrarladı). Çözüm: `npm@latest` KURMA (Node 22+ istiyor, uyumsuz) — bunun yerine Node 20 ile uyumlu **npm@11**'e geç:
   ```bash
   ssh -p 2222 root@161.35.126.250 "npm install -g npm@11 && cd /opt/ai-interface-build && rm -rf node_modules package-lock.json && npm cache clean --force && npm install --no-audit --no-fund"
   ```
   `EBADENGINE` uyarıları (TanStack Start'ın `node >=22.12.0` istemesi) görülebilir — sadece uyarı, kurulumu ve build'i engellemiyor (Node 20.20.2 ile build başarıyla tamamlanıyor).
3. Build başarılıysa (`.output/server/index.mjs` var), canlı dizine geçir — eski `.output` yedeklenir, sorun çıkarsa anında geri dönülür:
   ```bash
   ssh -p 2222 root@161.35.126.250 "cd /opt/ai-interface && mv .output .output.bak-$(date +%s) && cp -r /opt/ai-interface-build/.output /opt/ai-interface/.output && pm2 restart ai-interface && sleep 2 && pm2 status && curl -s -o /dev/null -w 'localcode=%{http_code}\n' http://127.0.0.1:8081 && curl -s -o /dev/null -w 'publiccode=%{http_code}\n' https://yusufcinar.duckdns.org/"
   ```
4. **`ecosystem.config.js` değiştiyse** (`env` bloğu dahil): `pm2 restart` YETMEZ, PM2 dosyayı yeniden okumaz.
   ```bash
   cd /opt/ai-interface
   pm2 delete ai-interface
   pm2 start ecosystem.config.js --only ai-interface
   pm2 save
   ```
5. Sorun çıkarsa hızlı rollback (yedek `.output.bak-<timestamp>` duruyor):
   ```bash
   ssh -p 2222 root@161.35.126.250 "cd /opt/ai-interface && rm -rf .output && mv .output.bak-<timestamp> .output && pm2 restart ai-interface"
   ```
6. Doğrula — "online" görünmesi process'in gerçekten istek karşıladığı anlamına gelmez, gerçek HTTP kodunu kontrol et:
   ```bash
   curl -s -o /dev/null -w "localcode=%{http_code}\n" http://127.0.0.1:8081
   curl -s -o /dev/null -w "publiccode=%{http_code}\n" https://yusufcinar.duckdns.org/
   pm2 logs ai-interface --lines 20 --nostream
   ```
   İçeriğin gerçekten güncellendiğini de doğrula (ör. `curl -s https://yusufcinar.duckdns.org/ | grep -o '<yeni-değişikliğe-özgü-metin>'` — yanıt gzip'li olduğu için `grep` "binary file matches" diyebilir, yine de eşleşme bulunuyorsa içerik doğrudur).

### Eski yöntem (tek dosya `curl` ile raw GitHub'dan çekme) — sadece config/script gibi bundle EDİLMEYEN dosyalar için hâlâ geçerli
```bash
curl -fsSL -o /opt/ai-interface/<dosya-yolu> https://raw.githubusercontent.com/yutronax/ai-interface/<commit-hash>/<dosya-yolu>
md5sum /opt/ai-interface/<dosya-yolu>   # yerel md5sum ile karşılaştır
```
`.tsx`/`.ts` gibi build'e giren dosyalar için KULLANMA — yukarıdaki git+build yöntemini kullan.

## `lcp-hero-boot-font-fix` Deploy Kaydı (2026-09-14)

Bu görevle birlikte git+build yöntemi ilk kez denendi (önceki tüm deploy'lar tek-dosya-curl yöntemiyle yapılmıştı). Yarım saate yakın sürdü çünkü:
1. Önce yerelde build edilip tarball olarak kullanıcıya gönderildi — kullanıcının dosyayı indirebileceği/transfer edebileceği bir makine karışıklığı yaşandı (yanlış SSH key'e sahip bir jump-box'tan deneme yapıldı).
2. Bunun yerine VPS'in kendi git+npm+internet erişimi olduğu keşfedildi, doğrudan clone+build denendi.
3. `npm install` bilinen bir Arborist bug'ıyla (`edgesOut`) çöktü — `npm@11`'e geçilerek çözüldü (yukarıda belgelendi).
4. Build başarılı, `.output` yedekli şekilde canlıya geçirildi, `pm2 restart` yeterliydi (`ecosystem.config.js` değişmemişti).
5. Doğrulama: `localcode=200`, `publiccode=200`, canlı içerikte "YUSUF" eşleşmesi bulundu, `pm2 describe` yeni `pid`/düşük `uptime` gösterdi.

Bu deneyim yukarıdaki "Git+Build Yöntemi" bölümüne işlendi — bir sonraki deploy'un aynı 30 dakikayı tekrar yaşamaması için.

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
