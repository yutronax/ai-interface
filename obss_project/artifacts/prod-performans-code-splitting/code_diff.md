# Code Diff — prod-performans-code-splitting
_Reference: atdd.md, plan.md, test_diff.md_

## Oluşturulan/Değiştirilen Dosyalar
| Dosya | Değişiklik |
|---|---|
| `src/components/system/SectionSkeleton.tsx` (yeni) | `minHeight` prop'lu, `animate-pulse` ile basit bir loading placeholder — Suspense fallback'i |
| `src/components/system/SectionErrorBoundary.tsx` (yeni) | React class component, `componentDidCatch`/`getDerivedStateFromError` ile lazy chunk hatalarını yakalar, "Unable to load this section" + RETRY butonu (`window.location.reload()`) gösterir |
| `src/routes/index.tsx` | `Hero` statik kalır (LCP elementi), diğer 6 section (`Identity`, `Experience`, `Projects`, `TechStack`, `AiPipeline`, `GitHubSection`) `React.lazy(() => import(...).then(m => ({default: m.X})))` ile dönüştürüldü, her biri kendi `SectionErrorBoundary` + `Suspense fallback={<SectionSkeleton minHeight="...">}` ile sarmalandı |
| `src/routes/-index.test.tsx` (test-copilot yazdı, `index.test.tsx`'ten yeniden adlandırıldı) | Statik kaynak-kod analizi testleri — TanStack Router'ın bu dosyayı route sanmaması için `-` prefix ile taşındı (proje kendi konvansiyonu, `routeFileIgnorePrefix: "-"`) |
| `src/components/system/SectionErrorBoundary.test.tsx` (test-copilot yazdı) | `SectionErrorBoundary` için 14 test |

## Acceptance Criteria Doğrulama (gerçek Read + test çalıştırma ile)
| AC | Durum | Kanıt |
|---|---|---|
| AC-1 [Critical] — below-the-fold section'lar lazy-load | ✅ | `index.tsx`: 6 adet `React.lazy()`, `bun run build` çıktısında gerçek ayrı chunk'lar (`Identity-*.js` 4KB, `AiPipeline-*.js` 12KB, `Projects-*.js` 8KB, vb.), test: 7/7 pass |
| AC-2 [Critical] — Hero statik, lazy-load edilmez | ✅ | `index.tsx`: `import { Hero } from "@/components/system/Hero"` ilk `React.lazy`'den önce, test: 3/3 pass |
| AC-3 [High] — Suspense fallback + skeleton, CLS korunur | ✅ | `SectionSkeleton` her lazy section'a gerçek yüksekliğine yakın `minHeight` ile geçiliyor, test: 3/3 pass |
| AC-4 [High] — Error Boundary hata izolasyonu | ✅ | `SectionErrorBoundary`, her section kendi boundary'sinde, test: 14/14 pass |
| AC-5 [Medium] — SSR/JS-kapalı | ⏭️ | Unit testle doğrulanamaz (gerekçeli skip), `verify` adımında gerçek `wrangler dev` + manuel kontrol yapılacak |
| AC-6 [Medium] — Lighthouse metrikleri | ⏭️ | Unit testle doğrulanamaz (gerekçeli skip), `verify` adımında gerçek Lighthouse ölçümü yapılacak |

## Test Sonucu (orkestratör tarafından gerçekten çalıştırıldı, bağımsız doğrulandı)
```
bun run test (tüm proje)
 Test Files  5 passed (5)
      Tests  103 passed | 4 skipped (107)
Exit code: 0

bunx tsc --noEmit → 0 hata
npx eslint <değişen dosyalar> → 0 hata
npx prettier --check <değişen dosyalar> → temiz
bun run build → 0 uyarı, 0 hata, gerçek ayrı client-side chunk'lar üretildi
```

## Bulunan ve Düzeltilen Sorunlar (bu oturumda)
1. **test-copilot'un ilk turu:** `index.test.tsx`'te bir test hem `indexOf()`'a regex nesnesi geçiriyordu (her zaman -1 dönen bug) hem de sonucu koşullu bir `if` guard'ı içine almıştı (implementasyon yokken sessizce "geçiyor" görünüyordu — daha önce bu projede tespit edilen anti-pattern'in regex-tabanlı bir versiyonu). Ayrı bir Haiku turuyla düzeltildi.
2. **code-copilot'un implementasyon turu sonrası:** `bunx tsc --noEmit` 6 gerçek hata verdi — `SectionErrorBoundary.tsx`'te `override` modifier eksikliği (2 hata) ve test dosyasındaki `ThrowingComponent`'in `void` dönüş tipi JSX component olarak kullanılamıyordu (4 hata). Sub-agent'ın kendi raporu bu hataları hiç bahsetmemişti — orkestratörün bağımsız `bunx tsc --noEmit` çalıştırması yakaladı. İki ayrı Haiku turuyla düzeltildi.
3. **`bun run build` EBUSY hatası:** İlk denemede `.output` klasörü kilitli çıktı — kök neden araştırıldı, önceki task'tan (#372, Lighthouse ölçümü) kalan bir `wrangler dev --local` process ağacı (workerd.exe + node.exe supervisor, watch-mode'da kendi kendini yeniden başlatıyordu) hâlâ `.output/server/.wrangler/state/` altındaki SQLite dosyalarını kilitli tutuyordu. Tüm process ağacı (`taskkill /T` ile) temizlenip build tekrarlandı, başarılı oldu.
4. **`bun run build` route-file uyarısı:** `index.test.tsx`, `src/routes/` klasöründe olduğu için TanStack Router tarafından route adayı sanılıp uyarı veriyordu. Projenin kendi konvansiyonuyla (`routeFileIgnorePrefix: "-"`) `-index.test.tsx`'e yeniden adlandırıldı (içerik değişmedi), uyarı gitti, testler hâlâ çalışıyor.

## CAVEMAN Self-Review (orkestratör doğrulaması)
- 2 yeni dosya (`SectionSkeleton.tsx`, `SectionErrorBoundary.tsx`) — plan.md'de tanımlı, gerekli.
- Yeni npm bağımlılığı yok — React'in kendi `lazy`/`Suspense`/`Component` API'leri.
- Mevcut section component'lerinin kendi içeriği değişmedi, sadece `index.tsx`'in import/render stratejisi değişti.
- TODO/FIXME/placeholder yok.

## Sonraki Adım
`verify` — gerçek prod build + `wrangler dev --local` + gerçek Lighthouse
ölçümü ile AC-5 (SSR) ve AC-6 (performans metrikleri) doğrulanacak. Bu
task `.tsx` dosyalarına dokunduğu için vision-test/manuel görsel kontrol
de gerekiyor (skeleton'ların CLS'yi bozmadığını doğrulamak için).
