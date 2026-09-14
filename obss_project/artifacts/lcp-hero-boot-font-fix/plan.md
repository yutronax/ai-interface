# Plan — lcp-hero-boot-font-fix
_Reference: atdd.md_

Frontend-pipeline: tetikleyici VAR (.tsx dosyaları + Görsel/UI kriteri dolu) — Discover Playwright ile yapıldı (localhost:8080, boot animasyonu sırasında h1 boş/görünmez olduğu canlı doğrulandı). Audit (`better-interface`) ve Design Direction (`frontend-design`) bilinçli olarak atlandı: bu görev mevcut bir bug/perf düzeltmesi, yeniden tasarım değil — atdd.md Kapsam Dışı bölümüyle tutarlı.

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| src/components/system/Hero.tsx | `<h1>{name.typed}</h1>` şu an `useTypewriter` state'ine bağlı — boot zinciri (command → 5 boot satırı → isim typewriter) bitmeden boş/kısmi. LCP elementinin gerçek metni ilk render'da DOM'da olmalı (AC-1, AC-3, AC-5); dekoratif typewriter efekti CSS-only bir reveal'a taşınmalı, JS state'i artık metni geciktirmemeli. | medium |
| src/routes/__root.tsx | Google Fonts `<link rel="stylesheet">` (satır 108-111) şu an senkron/render-blocking. `preconnect` zaten var ama stylesheet indirimi hâlâ ilk render'ı bekletiyor. Standart preload+swap-on-load pattern'ine (veya self-host) geçirilmeli (AC-4, AC-6). | medium |
| src/styles.css | Font-face/fallback zinciri (satır 42-43, `--font-display`/`--font-mono`) font yükleme stratejisi değişirse (self-host seçilirse) `@font-face` bloğu buraya eklenir; self-host edilmezse muhtemelen değişmez. | low |

## New Files
| File | Purpose |
|------|---------|
| (yalnızca self-host kararı verilirse) public/fonts/*.woff2 | JetBrains Mono + Space Grotesk self-host font dosyaları (sadece kullanılan weight'ler: 400/500/600/700, latin subset) |

Self-host kararı `Open Questions`'a bırakıldı — aşağıda alt-ajan kararı var.

## Dependencies
- `src/components/system/use-typewriter.tsx` (`useTypewriter`, `Cursor`) — Hero.tsx'in boot/command/isim animasyonlarının hepsi bunu kullanıyor. `active` flag'i JS ile tetikleniyor; API'si değişmeyecek, sadece Hero.tsx'in h1'i artık bu hook'un `typed` state'ine bağımlı olmayacak.
- `IDENTITY.name` (`src/lib/portfolio-data`) — h1'in gerçek/nihai metni, immediate render için doğrudan kullanılacak.
- `src/styles.css` satır 42-43 — `--font-display`/`--font-mono` CSS custom property'leri; font stratejisi değişse de bu değişken isimleri korunmalı (başka yerlerde referans veriliyor, satır 95/107/136).

## Migration Required?
Hayır — veritabanı/şema değişikliği yok, saf frontend render-sırası ve statik asset teslimi değişikliği.

## Risks
- (atdd.md'den taşındı) Boot animasyonunun h1'den ayrıştırılması mevcut görsel/sıralı akışı (command → boot lines → isim) bozabilir — CSS-only reveal'ın orijinal typewriter hissini koruyup korumadığı `Validate` adımında (vision-test) doğrulanmalı.
- (atdd.md'den taşındı) Self-host font'a geçilirse SIL Open Font License uyumu korunmalı.
- (yeni) `<h1>` içeriği artık mount anında dolu olacağından, `nameScale`/`nameY`/`nameX` gibi scroll-driven `motion` transform'ları (satır 16-18) etkilenmemeli — bunlar zaten `scrollYProgress`'e bağlı, typewriter state'ine değil, çakışma riski düşük.
- (yeni) Google Fonts stylesheet'i async'e çevirmek (preload+onload) bir an için fallback font ile FOUT'a neden olur — bu AC-4'ün beklediği davranış (kabul edilebilir), ama font swap sırasında layout shift (CLS) oluşmadığından emin olunmalı (fallback font metriklerinin gerçek fonta yakın olması veya `size-adjust` kullanılması gerekebilir).

## Open Questions
1. Font stratejisi: self-host (public/fonts/ + @font-face) mi, yoksa Google Fonts'u koruyup sadece stylesheet'i async/preload pattern'ine çevirmek mi tercih edilir? Self-host daha fazla kontrol/hız sağlar ama yeni font dosyaları + lisans dosyası eklenmesini gerektirir; async-Google-Fonts daha az dosya değişikliğiyle render-blocking'i kaldırır ama üçüncü taraf DNS/TLS gecikmesi kalır.
2. Boot animasyonunun CSS-only reveal tasarımı: mevcut karakter-karakter typewriter hissi CSS `steps()` animasyonuyla mı korunacak, yoksa daha basit bir fade/clip-path reveal'a mı indirgenecek? (İkisi de AC-3'ü karşılar, ama görsel sonuç farklı.)

## Kararlar
1. **Font stratejisi: Google Fonts korunacak, stylesheet async/preload pattern'ine çevrilecek — self-host YOK.** (Sonnet 5 low alt-ajanı tarafından yanıtlandı: atdd.md self-host'u "sadece seçilirse" opsiyonel işaretlemiş, preconnect zaten mevcut, async pattern daha az dosya/lisans riskiyle AC-4/AC-6'yı karşılıyor.)
2. **Boot animasyonu basit fade/clip-path reveal'a indirgenecek — karakter-karakter CSS steps() typewriter korunmayacak.** (Sonnet 5 low alt-ajanı tarafından yanıtlandı: AC-3 görsel biçim konusunda nötr, sadece h1'in bağımsız/geciktirmeyen olmasını şart koşuyor; steps() ile char-by-char CSS simülasyonu gereksiz karmaşıklık + TerminalWindow yeniden tasarımı sınırına yaklaşıyor.)

## Sonraki Adım
`test-copilot` — bu plan.md'nin "Files to Modify" listesini (Hero.tsx, __root.tsx, styles.css) dosya kapsamı olarak kullanmalı, atdd.md'den tekrar türetmemeli.
