# Plan — prod-performans-code-splitting
_Reference: atdd.md_

## Kod Keşfi Bulgusu (atdd.md'nin Unknown'ını netleştiriyor)
`src/routes/index.tsx` render sırası: `Hero → Identity → Experience →
Projects → TechStack → AiPipeline → GitHubSection → Footer`.
`Hero.tsx` kendisi `h-[220vh]` (2.2 ekran yüksekliğinde) bir sticky-pin
section — yani **sadece Hero above-the-fold**, ondan sonraki HER section
(Identity dahil) kullanıcı en az 2 ekran scroll etmeden görünmüyor. Bu,
atdd.md'nin varsayımından (sadece Identity above-the-fold sanılmıştı) daha
agresif bir fırsat: Identity de dahil olmak üzere Hero DIŞINDAKİ tüm
section'lar lazy-load adayı.

`Hero.tsx` LCP elementi: `<motion.h1>{IDENTITY.name}</motion.h1>` (satır
64-76) — bu component'e ve onun `motion/react` importuna DOKUNULMAYACAK,
senkron kalacak.

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| `src/routes/index.tsx` | `Identity`/`Experience`/`Projects`/`TechStack`/`AiPipeline`/`GitHubSection` importları `React.lazy(() => import(...))` ile değiştirilecek, her biri kendi `<Suspense fallback={<SectionSkeleton />}>` + Error Boundary ile sarmalanacak. `Hero`/`Footer`/`NavIndicator` senkron kalacak (Hero: LCP elementi; Footer/NavIndicator: küçük, ayırmaya değmez) | medium — SSR + Suspense etkileşimi, TanStack Start'ın streaming davranışı doğrulanmalı |

## New Files
| File | Purpose |
|------|---------|
| `src/components/system/SectionSkeleton.tsx` | Lazy-loaded section'lar için ortak, `min-height` parametreli skeleton/placeholder — CLS'yi bozmamak için her section'ın gerçek yaklaşık yüksekliğine göre ayarlanabilir bir `<div>` (ör. `<SectionSkeleton minHeight="100vh" />`) |
| `src/components/system/SectionErrorBoundary.tsx` | Class component (React Error Boundary API `componentDidCatch` gerektirir, hook yok) — lazy chunk yükleme hatasını yakalar, "yüklenemedi" mesajı + `window.location.reload()` tetikleyen bir "yeniden dene" butonu gösterir, hatayı diğer section'lardan izole eder |

## Section Yükseklik Referansları (skeleton min-height için, gerçek koddan)
- `Identity`: kod keşfinde tam yükseklik netleşmedi, `plan`→`code-copilot`
  geçişinde gerçek render'dan (`getBoundingClientRect`) veya mevcut CSS
  class'larından (`min-h-screen` gibi) alınacak — code-copilot'a NOT:
  her component'in kendi kök elemanındaki yükseklik class'ını (`h-screen`,
  `min-h-[Nvh]` vb.) oku, skeleton'a AYNI değeri ver.
- `AiPipeline`: `h-[220vh]` (kod keşfinde doğrulandı, mevcut kod satır 202)
- Diğerleri (`Experience`, `Projects`, `TechStack`, `GitHubSection`):
  code-copilot her birinin kök `className`'indeki yükseklik/`min-h`
  değerini okuyup skeleton'a aynen yansıtacak.

## Dependencies
- `React.lazy`/`Suspense`/Error Boundary — React'in kendi API'si, yeni npm bağımlılığı yok.
- `motion/react` — Hero'da senkron kalıyor, diğer component'lerde lazy chunk içinde kalmaya devam ediyor (kaldırılmıyor, sadece ne zaman indirileceği değişiyor).
- TanStack Start'ın SSR/streaming Suspense desteği — `plan` aşamasında doğrulanamadı (framework internals), `code-copilot` implementasyon sırasında gerçek build ile test edip SSR'da içeriğin kaybolmadığını (AC-5) doğrulamalı; sorun çıkarsa (ör. TanStack Start lazy+SSR'ı düzgün desteklemiyorsa) bunu Open Questions olarak işaretleyip kullanıcıya bildirecek, sessizce farklı bir yaklaşıma geçmeyecek.

## Migration Required?
Hayır — sadece component import stratejisi ve iki yeni yardımcı UI component'i, veri/şema değişikliği yok.

## Risks
- (atdd.md'den taşındı, netleşti) `AiPipeline.tsx`'in scroll-pin mimarisi (`use-section-progress.ts`, `getBoundingClientRect`) lazy-load ile mount gecikmesi yaşarsa, kullanıcı o bölgeye çok hızlı scroll ettiğinde geçici bir hesaplama sıçraması olabilir — skeleton'ın `h-[220vh]` ile TAM eşleşmesi bu riski sıfırlar (element her zaman aynı yükseklikte, mount olduğunda içerik yer değiştirmez).
- SSR streaming + lazy+Suspense etkileşimi doğrulanmamış — code-copilot bunu gerçek `wrangler dev --local` build'inde test etmeli (AC-5), sorun çıkarsa raporlamalı.

## Open Questions
Yok — atdd.md'nin "Unknown"u (below-the-fold sınırı) kod keşfiyle netleşti: Hero dışında her section lazy-load adayı.
