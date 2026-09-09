# Plan — hero-pipeline-gercek-etkilesim
_Reference: atdd.md_

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| `src/lib/portfolio-data.ts` | `PIPELINE` sabitine her aşama için `exampleContent: { label: string; code: string }` alanı eklenir — gerçek, bu reponun kendi geçmişinden (github-canli-veri task'ı) alınmış kısa alıntılar (AC-1 given/then, gerçek `github-api.ts` snippet'i, gerçek "42/42 tests passed" çıktısı) | low — sadece veri, tip opsiyonel değil bu kez zorunlu (3 aşamanın hepsi dolduruluyor) |
| `src/components/system/AiPipeline.tsx` | Kart tıklama/expand-collapse state'i (`useState<number \| null>`), `AnimatePresence` ile genişleyen içerik bloğu, `useReducedMotion()` ile animasyon süresi kontrolü, touch/klavye erişilebilirliği (chevron ikonu, `role="button"`/`tabIndex`/`aria-expanded`, Esc ile kapama) | **medium** — mevcut scroll-pin mimarisi (`h-[220vh]` + `sticky top-0 h-screen overflow-hidden`) korunmalı; expanded içerik `overflow-hidden` sticky konteynerin İÇİNDE yer kaplarsa layout taşabilir/scroll matematiğini bozabilir |

## New Files
| File | Purpose |
|------|---------|
| `src/components/system/AiPipeline.test.tsx` | Unit/integration testler: accordion state mantığı (AC-1/AC-2/AC-3), reduced-motion davranışı (AC-4), mobil chevron affordance (AC-5), SSR-only statik içerik korunumu (AC-6) |

## Dependencies
- `motion/react`: zaten proje bağımlılığı — `AnimatePresence`, `useReducedMotion` buradan import edilecek, yeni paket eklenmiyor.
- `cn` (`@/lib/utils`) — mevcut className birleştirme yardımcı fonksiyonu, `Stage` bileşeninde zaten kullanılıyor.
- `use-section-progress.ts` — **DOKUNULMAYACAK**, mevcut scroll-pin mantığı aynen korunacak.
- `Projects.tsx`/`Projects.test.tsx` (proje-karti-tiklanabilir-kanit task'ı) — test dosyası isimlendirme ve `describe`/AC eşleme konvansiyonu buradan takip edilecek (`describe("AC-N [Priority]: ...")`).

## Migration Required?
Hayır — sadece statik TypeScript veri sabiti (`PIPELINE`) ve component state, veritabanı/şema değişikliği yok.

## Risks
- (atdd.md'den taşındı) Mevcut `AiPipeline.tsx` karmaşık bir scroll/motion mimarisi kullanıyor (`useSectionProgress`, `useTransform` zincirleri) — expand/collapse state'i bu pin mekanizmasıyla çakışmamalı.
  - **Kod keşfiyle netleşen çözüm:** Sticky konteyner `overflow-hidden` (satır 116) — expanded içerik bu konteynerin YÜKSEKLİĞİNİ artırmamalı, aksi halde `h-screen` sabit yükseklik taşar ve içerik kırpılır/kayar. Çözüm: expanded blok `Stage` içinde mevcut `mt-6` alanının ALTINA sabit/`max-h` sınırlı bir alanla eklenecek (satır 60-81 civarı, mevcut `mono mt-4` açıklama metninin hemen altına), scroll-pin'in `220vh`/`h-screen` oranı sabit kalacak şekilde boyut bütçesi `plan` aşamasında `code-copilot`'a NOT olarak geçilecek. Sticky alanın toplam boyutu değişmediği için `use-section-progress.ts`'e dokunulmuyor.
- (atdd.md'den taşındı) Gerçek "kanıt içeriği" — **netleşti** (aşağıya bakınız), plan aşamasında bu reponun gerçek dosyalarından seçildi.

## Gerçek Kanıt İçeriği (kod keşfiyle seçildi, code-copilot birebir kullanacak)
Kaynak: `obss_project/artifacts/github-canli-veri/atdd.md` + `code_diff.md` + `verify_report.md` (bu reponun kendi tamamlanmış bir task'ı — gerçek, doğrulanabilir).

1. **PLAN / Claude** — `atdd.md`'den gerçek AC alıntısı:
   `"AC-1 [Critical]: Given GitHub API'si başarıyla yanıt verir, When fetchGitHubStats() çağrılır, Then repoCount ve totalStars gerçek API verisinden hesaplanır"`
2. **BUILD / Cursor** — `github-api.ts`'ten gerçek kod satırları (satır 74-77):
   ```ts
   const totalStars = repos.reduce((sum, repo) => {
     const stars = repo.stargazers_count ?? 0;
     return sum + (typeof stars === "number" ? stars : 0);
   }, 0);
   ```
3. **VERIFY / Codex** — `verify_report.md`'den gerçek test sonucu:
   `"bun run test — 42/42 test geçti (16 önceki task + 26 bu task)"` + `"Görsel regresyon: dev sunucu gerçek veriyle '28 PUBLIC REPOS · 6 TOTAL STARS' gösterdi"`

Bu içerik `portfolio-data.ts`'teki `PIPELINE` sabitine `exampleContent` alanı olarak gömülecek — canlı API çağrısı yok, tamamen build-time sabit ve doğrulanabilir gerçek geçmiş.

## Open Questions
Yok — atdd.md'nin tek "Unknown"u (gerçek kanıt içeriğinin ne olacağı) bu plan adımında kod keşfiyle netleşti, alt-ajana soru dispatch edilmesine gerek yok.
