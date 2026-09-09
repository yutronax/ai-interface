# Test Diff — prod-performans-code-splitting
_Reference: atdd.md, plan.md_

## Oluşturulan Dosyalar
| Dosya | Açıklama |
|---|---|
| `src/routes/index.test.tsx` (yeni) | Statik kaynak-kod analizi testleri (`index.tsx`'in kaynağını `readFileSync` ile okuyup `React.lazy`/`import()`/`Suspense`/`ErrorBoundary` pattern'lerini regex ile doğruluyor — TanStack Router context'i gerektirmeyen bir yaklaşım, gerçek component render'ı yapmıyor) |
| `src/components/system/SectionErrorBoundary.test.tsx` (yeni) | `SectionErrorBoundary` class component'i için Vitest + Testing Library testleri |

## Düzeltme Geçmişi
İlk yazımda `index.test.tsx`'te bir test (`"should import Hero before any
lazy-loaded section"`) hem `indexOf()`'a regex nesnesi geçiriyordu (her
zaman -1 dönen bir hata) hem de sonucu bir `if (firstLazyImportIndex !==
-1) { expect(...) }` koşullu guard'ı içine almıştı — implementasyon yokken
bu koşul `false` olduğundan assertion hiç çalışmıyor, test sessizce
"geçiyor" görünüyordu (daha önce bu projede tespit edilip yasaklanan
guard anti-pattern'inin regex-tabanlı bir versiyonu). Ayrı bir Haiku
dispatch'iyle regex `.match()` ile değiştirildi ve guard kaldırılıp
koşulsuz 3 assertion'a bölündü. Son durum (orkestratör tarafından
bağımsız doğrulandı): **18/22 test BAŞARISIZ (red)**, 2/22 PASS (statik,
implementasyondan bağımsız — Hero statik import zaten var), 2/22 SKIP
(AC-5/AC-6, gerekçeli — aşağıya bakınız).

## AC -> Test Mapping
1. AC-1 [Critical] (below-the-fold section'lar React.lazy+dynamic import) -> `AC-1 [Critical]` describe bloğu (7 test) -> RED
2. AC-2 [Critical] (Hero statik import, lazy-load edilmez) -> `AC-2 [Critical]` describe bloğu (3 test) -> 2 PASS (Hero zaten statik) + 1 RED (Hero-önce-lazy sıralaması, henüz lazy yok)
3. AC-3 [High] (Suspense fallback + SectionSkeleton) -> `AC-3 [High]` describe bloğu (3 test) -> RED
4. AC-4 [High] (Error Boundary hata yakalama/izolasyon) -> `SectionErrorBoundary.test.tsx` (14 test, tüm alt-describe'lar: catch/display/retry/isolation/accessibility) -> RED (component henüz yok)
5. AC-5 [Medium] (SSR/JS-kapalı) -> `AC-5` describe bloğu, 1 test PASS (Suspense import gerekliliği — statik kontrol) + 1 test `it.skip` (gerekçe: gerçek SSR gerektirir, `verify` adımında manuel/Lighthouse ile doğrulanacak, uydurma unit test yazılmadı)
6. AC-6 [Medium] (Lighthouse metrikleri) -> `AC-6` describe bloğu, 1 test `it.skip` (gerekçe: gerçek Lighthouse ölçümü gerektirir, unit testle doğrulanamaz, `verify` adımına bırakıldı)

## Davranış Sözleşmesi -> Test Eşlemesi
| # | Durum | Test |
|---|---|---|
| 1 | Happy path (lazy-load, chunk indirilir) | `index.test.tsx`: "supports Happy path: below-the-fold sections are lazy-imported" |
| 2/3 | Lazy chunk hatası / dış bağımlılık hatası | `SectionErrorBoundary.test.tsx`: "should catch error thrown by child component..." + `index.test.tsx`: "supports Error Boundary isolation" |
| 4 | Zaman aşımı (Suspense fallback gösterilir) | `index.test.tsx`: "supports Timeout scenario: Suspense fallback skeleton during load" |
| 5 | Kısmi başarı (bağımsız Error Boundary'ler) | `SectionErrorBoundary.test.tsx`: "should isolate error to one section without affecting sibling sections" + "should render error only in failed section when multiple sections exist" + `index.test.tsx`: "supports Partial success" |

## Varsayımlar (code-copilot'un uyması gereken)
- `SectionErrorBoundary` bir class component olmalı (`componentDidCatch` gerektirir), `children: ReactNode` prop'u kabul etmeli.
- Hata durumunda ekranda "unable"/"error"/"failed"/"yüklenmedi" kelimelerinden birini içeren bir metin göstermeli (test regex'i case-insensitive).
- Bir "Retry"/"Reload"/"Try again" metnine sahip, `role="button"` olan (native `<button>` yeterli) bir eleman render etmeli; tıklanınca `window.location.reload()` çağırmalı.
- Buton `tabIndex` attribute'u taşımalı (native `<button>` zaten focusable ama test açıkça attribute varlığını kontrol ediyor — `tabIndex={0}` eklemek yeterli).
- `index.tsx`'te en az 6 adet `React.lazy(() =>` çağrısı, `import("...")` dinamik import pattern'i, `<Suspense fallback={...}>` JSX kullanımı, `SectionSkeleton`/`SectionPlaceholder`/`SkeletonLoader` isimlerinden biriyle bir skeleton component'i import edilmeli.
- `Hero` importu (`import { Hero } from "@/components/system/Hero"`) statik kalmalı ve dosyada ilk `React.lazy` çağrısından ÖNCE yer almalı.

## Test Çalıştırma Sonucu (orkestratör tarafından bağımsız doğrulandı)
```
bun run test src/routes/index.test.tsx src/components/system/SectionErrorBoundary.test.tsx
Test Files  2 failed (2)
Tests       18 failed | 2 passed | 2 skipped (22)
```
`code-copilot` sonrası `verify` adımında 22/22'nin (skip'ler hariç, ya da
skip'ler gerçek e2e/Lighthouse ile ayrıca kapatılarak) yeşile dönmesi
beklenir.
