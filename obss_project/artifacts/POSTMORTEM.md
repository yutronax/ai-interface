# Postmortem

Görevler arası tekrar eden kalıpları izler. Üzerine eklenir, geçmiş koşum silinmez.

## Koşum 1 — 2026-09-14

Görev sayısı: 5 (github-canli-veri, hero-pipeline-gercek-etkilesim, prod-performans-code-splitting, proje-karti-tiklanabilir-kanit, uptime-izleme-pm2-recovery)
Toplam bulgu: 18

### Kategori Dağılımı
| Kategori | Bulgu | Farklı görev |
|---|---|---|
| reliability | 6 | 4 |
| correctness | 2 | 2 |
| risk | 2 | 2 |
| maintainability | 2 | 2 |
| security | 1 | 1 |
| scope | 1 | 1 |
| architecture | 1 | 1 |
| test-gap | 1 | 1 |
| performance | 1 | 1 |
| other | 1 | 1 |

Şiddet: 1 high, 6 medium, 11 low.

### Sıcak Dosya
`src/routes/index.tsx` — 2 farklı görevde (2 bulgu) tekrar ediyor. Henüz 5 görevlik veri eşiğinde (script uyarısı: az veri), kesin "mimari sorun" demek için erken — ama izlenmeye değer, 3. tekrarda `refactor` adayı olarak değerlendirilmeli.

### Tekrar Eden Kategori: reliability (4/5 görev)
Not: 5 görevlik veri eşiğin tam sınırında — kalıp olarak kabul edip TEK somut aksiyon üretiyorum, aşırı yorumlamıyorum.

**Somut örnek (uptime-izleme-pm2-recovery, red-team bulgusu):** İlk implementasyonda hata/başarısızlık durumunda **optimist varsayım** yapılmıştı — `pm2 jlist` başarısız olursa "process online" kabul ediliyordu, `fetch`'e verilen `{timeout}` seçeneği sessizce yok sayılıyordu ve bu fark edilmemişti çünkü `main()` unit test kapsamı dışındaydı.

**Aksiyon (code-copilot skill'inin kendi Definition of Done'ına eklenmeli):**
> "Dış bağımlılık/kütüphane çağrısı başarısız olduğunda veya belirsiz bir durumda fallback her zaman **pessimist** (en güvenli/en az iyimser) varsayım olmalı — 'aksi kanıtlanana kadar sağlıklı/başarılı say' YASAK. Ayrıca kullanılan bir runtime seçeneğinin (ör. `fetch`'in `timeout` alanı) gerçekten desteklendiği doğrulanmalı, sessizce yok sayılan seçeneklere güvenilmemeli."

Kullanıcı onayıyla `code-copilot` SKILL.md'nin "Definition of Done" bölümüne uygulandı (2026-09-14).

### Yapısal Not (kalıp değil)
`AI code review -> PENDING` ve `İnsan onayı -> PENDING`, `verify_report.md`'de 5/5 görevde tekrarlıyor — bu bir araç/süreç kusuru DEĞİL, tasarım gereği: bu iki gate her zaman `verify` adımında beklemede kalıp sırasıyla `red-team`'e ve kullanıcı onayına devredilir. Yanıltıcı bir "kalıp" gibi görünmesin diye ayrıca not düşülüyor.

### Diğer Kategoriler
correctness/risk/maintainability (2/5 görev) — 2 tekrar, aksiyon üretmek için henüz erken (skill kuralı: "2 görevde 2 kez çıkan kategori kalıp değildir"). İzlemeye devam.
