# Code Diff — proje-karti-tiklanabilir-kanit
_Reference: atdd.md, plan.md, test_diff.md_

## Değiştirilen Dosyalar
| Dosya | Değişiklik |
|---|---|
| `src/lib/portfolio-data.ts` | `Project` tipine opsiyonel `evidence?: { type: "link"; url: string; label: string }` alanı eklendi (satır 77). |
| `src/components/system/Projects.tsx` | `Panel` named export edildi (`export { Panel };`). `p.evidence` varsa mevcut "OPEN ON GITHUB" linkinin altına ikinci bir `<a href={p.evidence.url} target="_blank" rel="noreferrer">{p.evidence.label}</a>` render eden conditional blok eklendi (satır 79-89). Mevcut GitHub linki (href/target/rel/className) değişmedi. |
| `src/test/setup.ts` | `IntersectionObserver` mock'ı eklendi — `motion/react`'in `whileInView` prop'u test ortamında (happy-dom) bu API'yi bulamadığı için testler çalışmıyordu (test altyapısı eksikliği, implementasyon kapsamı değil). |

## Acceptance Criteria Doğrulama (gerçek Read + test çalıştırma ile)
| AC | Durum | Kanıt |
|---|---|---|
| AC-1 [Critical] — evidence linki render edilir, href/target/rel doğru | ✅ | `Projects.tsx:79-89`, test: `AC-1` describe bloğu (4/4 pass) |
| AC-2 [Critical] — evidence yoksa ek link render edilmez | ✅ | Conditional `{p.evidence && (...)}`, test: `AC-2` describe bloğu (4/4 pass) |
| AC-3 [High] — görsel onError fallback | Kapsam dışı (plan.md kararı: ilk sürüm sadece link tipi) | Test yazılmadı, bilerek ertelendi |
| AC-4 [High] — lazy-load + prefers-reduced-motion | Kapsam dışı (plan.md kararı: görsel/GIF yok) | Test yazılmadı, bilerek ertelendi |
| AC-5 [Medium] — kartlar bağımsız davranır | ✅ | Her `Panel` kendi `p.evidence`'ına göre render edilir, test: `AC-5` describe bloğu (2/2 pass) |
| AC-6 [Medium] — evidence hiç yoksa regresyon olmaz | ✅ | `evidence` opsiyonel tip, mevcut GitHub linki değişmedi, test: `AC-6` describe bloğu (4/4 pass) |

## Test Sonucu (orkestratör tarafından gerçekten çalıştırıldı)
```
bun run test
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

## CAVEMAN Self-Review (orkestratör doğrulaması)
- Yeni dosya yok (setup.ts değişikliği hariç, o da test altyapısı düzeltmesi).
- Yeni soyutlama/component yok — `Panel` zaten vardı, sadece export edildi.
- Yardımcı fonksiyon yok, inline conditional render.
- TODO/FIXME/placeholder/dead code yok.
- Mevcut "OPEN ON GITHUB" linkinin stil deseni (className, rel yapısı) yeni link için de takip edildi.

## Kalan Sınırlamalar
- `PROJECTS` dizisindeki 4 projeye (flood-detection, ViLT, windowsphereAI, ml-lab) gerçek `evidence` verisi girilmedi — plan.md kararı gereği placeholder kaldı, mekanizma hazır ama içerik ayrı bir veri-girişi işi.
- AC-3/AC-4 (görsel/GIF kanıt tipi) bu task'ta uygulanmadı, gerekirse ayrı bir task olarak ele alınmalı.

## Sonraki Adım
`verify` — test suite'i (zaten yeşil doğrulandı) + build/lint/type-check ve diğer kalite kapılarını çalıştıracak. Bu değişiklik bir `.tsx` (rendered web UI) dosyasına dokunduğu için `verify`'ın vision-test gate'i (gate 11) N/A değil AKTİF çalışmalı.
