# Test Diff — proje-karti-tiklanabilir-kanit
_Reference: atdd.md, plan.md_

## Oluşturulan Test Altyapısı (orkestratör tarafından, Haiku'dan önce)
Projede hiç test runner'ı yoktu (package.json'da `test` script'i, vitest/jest devDependency'si yoktu). Bu task için eklendi:
- `vitest`, `@vitejs/plugin-react`, `happy-dom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — devDependency (`bun add -d`). Not: ilk kurulumda `jsdom` denendi ama transitif bağımlılığı `@exodus/bytes` eslint/prettier toolchain'ini çökertti (bkz. verify_report.md), bu yüzden `happy-dom`'a geçildi.
- `vitest.config.ts` — happy-dom environment, `src/test/setup.ts` setup dosyası, `globals: true`
- `src/test/setup.ts` — `@testing-library/jest-dom/vitest` import
- `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"` script'leri eklendi

## Oluşturulan Test Dosyaları (Haiku alt-ajanı tarafından)
| Dosya | Durum |
|---|---|
| `src/components/system/Projects.test.tsx` | Yeni (324 satır) — henüz RED (Panel named export yok, `Project` tipinde `evidence` alanı yok) |

## Acceptance Criteria → Test Eşlemesi
| AC | Test describe/it | Beklenen sonuç (şu an) |
|---|---|---|
| AC-1 [Critical] — evidence linki render edilir, href/target/rel doğru | `AC-1 [Critical]: Evidence link renders when evidence data defined` (4 test) | RED (import hatası) |
| AC-2 [Critical] — evidence yoksa ek link render edilmez | `AC-2 [Critical]: No evidence link when evidence data undefined` (4 test) | RED (import hatası) |
| AC-5 [Medium] — kartlar bağımsız davranır | `AC-5 [Medium]: Independent rendering for projects with/without evidence` (2 test) | RED (import hatası) |
| AC-6 [Medium] — evidence hiç yoksa regresyon olmaz | `AC-6 [Medium]: No regression when no projects have evidence` (4 test) | RED (import hatası) |
| (edge case, AC'lere ek) | `Edge Cases & Defensive Rendering` (2 test) | RED (import hatası) |

AC-3 (görsel `onError` fallback) ve AC-4 (`loading="lazy"`/`prefers-reduced-motion`) plan.md kararı gereği bu task'ın kapsamı dışında bırakıldı — ilk implementasyon sadece harici link tipini kapsıyor, bu iki AC testsiz kaldı ve bilerek ertelendi (görsel/GIF desteği eklenirse ayrı bir task'ta test edilecek).

## Varsayımlar (Haiku alt-ajanının raporundan)
- `Panel` component'i `Projects.tsx`'ten named export olarak dışa açılacak (şu an dosya içinde tanımlı ama export edilmiyor) — code-copilot bunu yapmalı.
- Mock proje objelerinde `evidence` alanı `as unknown as Project` cast ile simüle edildi (tip henüz tanımlı değil).
- `motion/react` bileşenleri testte mock'lanmadı, gerçek DOM'a render oluyor (ekstra mock gerekmedi).

## Sonraki Adım
`code-copilot` — bu testleri yeşile çeviren implementasyonu yazacak:
1. `src/lib/portfolio-data.ts`: `Project` tipine opsiyonel `evidence?: { type: "link"; url: string; label: string }` alanı eklenmeli.
2. `src/components/system/Projects.tsx`: `Panel` named export edilmeli; `p.evidence` varsa "OPEN ON GITHUB" linkinin yanında/altında ikinci bir `<a target="_blank" rel="noreferrer">` render edilmeli.
