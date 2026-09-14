# Plan — uptime-izleme-pm2-recovery
_Reference: atdd.md_

Frontend-pipeline: tetikleyici yok (backend-only/altyapı görevi, UI dosyası değişmiyor).

## Keşif Özeti
- Repoda hiç `ecosystem.config.js` / PM2 config yok — VPS'te muhtemelen elle kurulmuş, git'te izlenmiyor. Bu görev onu ilk kez repoya taşıyor.
- Proje TanStack Start (Vinxi/Nitro), `nitro.preset: "node-server"` (vite.config.ts:18-20) — production'da `node .output/server/index.mjs` PM2 altında çalışıyor (bkz. commit 37b9ffb).
- `src/routes/` çok sade (`index.tsx`, `__root.tsx`) — TanStack Start'ın server-route API'si (createServerFileRoute vb.) bu repoda hiç kullanılmamış, versiyonu doğrulanmadı. Yeni bir `/health` API ucu eklemek riskli/spekülatif olur.
- **Karar:** Ayrı bir `/health` endpoint'i EKLENMEYECEK — mevcut `/` (ana sayfa) zaten SSR ile 200 döndüğü sürece uptime-check hedefi olarak yeterli. Bu, atdd.md'nin Unknowns bölümündeki açık soruyu kapatır ve threat-model'in AC-S2/AC-S3'ünü (yeni endpoint bilgi ifşası/DoS) **kapsam dışı bırakır** — çünkü yeni bir HTTP ucu artık oluşmuyor. AC-S1 (secret sızıntısı) hâlâ geçerli.
- VPS'e gerçek cron/systemd kurulumu ve Telegram bot oluşturma bu oturumdan (repo-only, VPS erişimi yok) YAPILAMAZ — bunlar için adım adım manuel kurulum dokümanı yazılacak, kullanıcı VPS'te kendisi çalıştıracak.

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| vite.config.ts | Değişiklik yok — sadece referans, node-server preset zaten doğru. | - |

## New Files
| File | Purpose |
|------|---------|
| `ecosystem.config.js` | PM2 process config: `max_restarts`, `min_uptime`, `exponential_backoff_restart_delay`, log dosya yolları (AC-3, AC-7) |
| `scripts/uptime-check.mjs` | Node script: siteye HTTP isteği atar + `pm2 jlist` ile process durumunu kontrol eder, ardışık N-fail sayacını bir state dosyasında (`scripts/.uptime-state.json`, git-ignored) tutar, eşik aşılınca Telegram webhook'a POST atar, site geri gelince "recovered" bildirimi yollar (AC-1, AC-2, AC-4, AC-5, AC-6, AC-8) |
| `scripts/uptime-check.test.ts` | Unit test: eşik/sayaç mantığı, recovered-transition mantığı (dış ağ çağrısı mock'lanır) — test_strategy'nin %10 unit kısmı |
| `docs/deploy/monitoring-setup.md` | VPS'e manuel kurulum adımları: Telegram bot oluşturma, `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` env değişkenlerini VPS'te secret olarak saklama (AC-S1), cron job kurulumu (`*/5 * * * * node scripts/uptime-check.mjs`), `pm2-logrotate` kurulum komutu, ecosystem.config.js'i `pm2 reload` ile devreye alma, test-alert doğrulama adımı |
| `.env.example` (mevcutsa güncelle, yoksa oluştur) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `UPTIME_CHECK_URL` placeholder'ları — gerçek değer asla committ edilmez (AC-S1) |
| `.gitignore` güncelleme | `scripts/.uptime-state.json` git'e girmesin (runtime state, secret değil ama gürültü) |

## Dependencies
- Node'un yerleşik `fetch`/`child_process` (pm2 jlist için) — yeni npm bağımlılığı gerekmiyor (ponytail: minimal).
- `pm2-logrotate` VPS'e global PM2 modülü olarak kurulur (`pm2 install pm2-logrotate`) — repo'da bir dosya karşılığı yok, sadece dokümana yazılır.

## Migration Required?
Hayır — DB/schema değişikliği yok.

## Risks
- (atdd.md'den taşındı) Tek dış servise (varsa) bağımlılık yerine kendi script'imiz kullanıldığı için bu risk azaldı, ama VPS'in kendisi (script çalıştığı yer) down olursa hiçbir bildirim gitmez — bu kabul edilen bir risk (tek sunuculu kişisel proje, ikinci bir izleme katmanı bu görevin kapsamı dışı).
- Telegram API rate limit/geçici kesinti — script零 retry yapmadan sadece bir sonraki 5dk'lık cron çalışmasında tekrar dener (basit, ek karmaşıklık istenmiyor).
- `pm2 jlist` komutunun VPS'teki PM2 process adıyla eşleşmesi gerekiyor — script'e process adı env değişkeni olarak verilecek, sabit kodlanmayacak.

## Open Questions
1. VPS'teki PM2 process'inin gerçek adı ne (`pm2 list` çıktısındaki `name` alanı)? — script'e `PM2_PROCESS_NAME` env değişkeni olarak parametrize edilecek, varsayılan `ai-interface`.
2. Bildirim kanalı Telegram mı Discord mu? — atdd.md Telegram varsayımını yaptı (kullanıcı onayı bekliyor); plan Telegram ile ilerliyor, script'i kanal-agnostik yapıp sadece "webhook URL'ine POST at" şeklinde tasarlarsak Discord'a geçiş de kolay olur (fazla mühendislik değil, tek bir fetch çağrısı zaten kanal-bağımsız).
3. 5 dakikalık cron aralığı ve 2 ardışık fail eşiği VPS'in gerçek cron kurulumunda aynen uygulanabilir mi? — dokümana net komut olarak yazılacak, kullanıcı VPS'te çalıştırırken değiştirebilir.

Yukarıdaki 3 soru kod yazımını bloklamıyor (script parametrik tasarlanacak) — Sonnet 5 alt-ajanına dispatch gerekmiyor, doğrudan makul varsayılanlarla ilerleniyor.
