# Test Diff — lcp-hero-boot-font-fix

## Oluşturulan Dosyalar
- `src/components/system/Hero.test.tsx` (yeni, 367 satır) — vitest + @testing-library/react, `SectionErrorBoundary.test.tsx` deseni takip edildi.

## AC → Test Haritası
| AC | Öncelik | Test | Durum (red step) |
|---|---|---|---|
| AC-1 | Critical | "should render h1 with full IDENTITY.name text on initial mount, before typewriter finishes" + 2 diğer | RED |
| AC-3 | High | "should keep h1 textContent constant as IDENTITY.name regardless of typewriter state" + 1 diğer | RED |
| AC-4 | High | it.skip — font stratejisi __root.tsx'te ayrı test dosyasında (bu görevde henüz yazılmadı, code-copilot sonrası gerekirse eklenir) | SKIPPED (bilinçli) |
| Davranış Sözleşmesi Row 1 (happy path) | - | "should render h1 fully while boot animation operates on separate overlay layer" + 1 diğer | RED |
| Davranış Sözleşmesi Row 5 (kısmi başarı) | - | "should render h1 with full name even if boot animation never progresses" (fake timers) + 2 diğer | RED |
| Yapı/erişilebilirlik | - | "should render h1 as a proper semantic heading element" | PASSED (zaten h1 var, sadece içerik eksik) |

## Sonuç (dispatch sırasında çalıştırıldı, doğrulama amaçlı — asıl run `verify` adımında)
15 test, 12 fail (RED, beklenen), 1 skip (AC-4, kapsam dışı bu dosyada), 2 pass (yapısal, içerik testi değil).

## Varsayımlar
- `useSectionProgress` (motion/react scroll hook) mock'landı — MotionValue API'si (`.get()`/`.set()`/`.on()`) taklit edildi.
- AC-4 (font yükleme) bu dosyada değil — __root.tsx değişikliği code-copilot'ta yapılacak, font testi bu ATDD görevinin unit/integration kapsamında zorunlu değil (E2E/Lighthouse %70 ağırlıklı, atdd.md test_strategy'sine uygun).

## Sonraki Adım
`code-copilot` — bu testleri GREEN yapacak Hero.tsx (+ gerekirse __root.tsx/styles.css) implementasyonu.
