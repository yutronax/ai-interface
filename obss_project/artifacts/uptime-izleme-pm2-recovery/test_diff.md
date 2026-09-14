# Test Diff — uptime-izleme-pm2-recovery (red step)

## Oluşturulan Dosyalar
- `scripts/uptime-check.test.ts` (yeni, 737 satır, 96 test case) — Vitest, `describe`/`it`/`expect`/`vi.fn()`

## AC → Test Eşlemesi
| AC | Test bloğu |
|---|---|
| AC-1 (happy path) | `isHealthy()` — 2xx→true, 4xx/5xx→false (11 test) |
| AC-2 (2 ardışık fail eşiği) | `evaluateFailureThreshold()` — sınır değerleri dahil (0/2, 2/2, 3/2) (12 test) |
| AC-4 (PM2 process bulunamama/errored ayrımı) | `checkPm2ProcessStatus()` — `{found:false}` vs `{found:true, online:false}` (7 test) |
| AC-5 (recovery bildirimi) | `shouldNotifyRecovery()` — down→up true, up→up false (4 test) |
| AC-6 (spam önleme) | `evaluateFailureThreshold()` tek-fail durumu |
| AC-S1 (webhook 401/403 sessiz başarısızlık yasağı) | `sendWebhookNotification()` — throw etmeden `{sent:false, reason:"unauthorized"}` (8 test) |
| Davranış Sözleşmesi satır 2 (webhook URL eksik/config hatası) | `sendWebhookNotification(undefined, ...)` → fetch hiç çağrılmadan `{sent:false, reason:"no-webhook-configured"}` |
| Davranış Sözleşmesi satır 5 (dış bağımlılık/network hatası) | `sendWebhookNotification` + reddedilen fetch promise → throw etmeden `{sent:false, reason:"network-error"}` |
| Davranış Sözleşmesi satır 8 (sessiz başarısızlık — asıl tetikleyici olay) | `checkPm2ProcessStatus` process bulunamama durumunu ayrı sonuçla işaretliyor mu testi |
| Ek | `buildNotificationPayload()` — geçerli "down"/"recovered" tipleri + geçersiz tipte throw |

## Durum
RED (beklenen) — `scripts/uptime-check.mjs` henüz yok, testler import hatasıyla başarısız olacak. `code-copilot` bu arayüze göre implementasyonu yazacak.

## Varsayımlar
- PM2 process adı env değişkeni ile parametrize edilecek (varsayılan `ai-interface`).
- Webhook URL/token `process.env.TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` üzerinden okunacak (kullanıcı onayı bekleyen varsayım, bkz. atdd.md Assumptions).
