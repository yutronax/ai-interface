# Code Diff — github-canli-veri
_Reference: atdd.md, plan.md, test_diff.md_

## Oluşturulan/Değiştirilen Dosyalar
| Dosya | Değişiklik |
|---|---|
| `src/lib/github-api.ts` (yeni) | `fetchGitHubStats()` — `api.github.com/users/yutronax/repos`'a fetch, null/undefined `stargazers_count` → 0, 1 saat TTL'li modül-seviyesi cache, hata durumunda `REPOS`'tan fallback, asla throw etmez. |
| `src/routes/index.tsx` | `Route`'a `loader: () => fetchGitHubStats()` eklendi, `Index` component'i `useLoaderData({ from: "/" })` ile veriyi alıp `<GitHubSection stats={stats} />` geçiriyor. `head()` değişmedi. |
| `src/components/system/GitHubSection.tsx` | `stats: { repoCount, totalStars }` prop'u eklendi, dashboard strip artık `REPOS.length`/`reduce` yerine `stats.repoCount`/`stats.totalStars` kullanıyor. Repo satırları (isim/stack/dil/aktivite) hâlâ `REPOS`'tan geliyor. |

## Acceptance Criteria Doğrulama (gerçek Read + test çalıştırma ile)
| AC | Durum | Kanıt |
|---|---|---|
| AC-1 [Critical] — API başarılı, veriyle eşleşir | ✅ | `github-api.ts:67-71`, test: 3/3 pass |
| AC-2 [Critical] — hata durumunda throw etmez, fallback | ✅ | `github-api.ts:48-49,79-82`, test: 5/5 pass |
| AC-3 [High] — boş dizi geçerli, fallback'e düşmez | ✅ | `github-api.ts:67` (boş dizi → repoCount:0), test: 2/2 pass |
| AC-4 [High] — null/undefined stargazers_count → 0 | ✅ | `github-api.ts:69` (`?? 0`), test: 4/4 pass |
| AC-5 [Medium] — TTL içinde cache, fetch 1 kez | ✅ | `github-api.ts:36-38`, test: 3/3 pass |
| AC-6 [Medium] — her koşulda valid obje, throw yok | ✅ | try/catch her yolu kapsıyor, test: 5/5 pass |

## Test Sonucu (orkestratör tarafından gerçekten çalıştırıldı)
```
bun run test
 Test Files  2 passed (2)
      Tests  42 passed (42)
```
(16 önceki task'tan — proje-karti-tiklanabilir-kanit — + 26 bu task'tan)

## CAVEMAN Self-Review (orkestratör doğrulaması)
- 1 yeni dosya (`github-api.ts`) — gerekli, plan.md'de tanımlı.
- `getFallbackStats()` yardımcı fonksiyonu — 2 çağrı noktasında (response.ok false + catch bloğu) tekrarı önlüyor, makul.
- Yeni public API yok, mevcut component/route deseni takip edildi.
- TODO/FIXME/placeholder yok.

## Kalan Sınırlamalar
- Cold-start'ta (Cloudflare Workers) in-memory cache sıfırlanabilir — atdd.md'de kabul edilmiş risk.
- Gerçek GitHub API'sine karşı canlı bir doğrulama yapılmadı (testler mock'lu) — `verify` adımında dev sunucusu üzerinden manuel kontrol edilecek.

## Sonraki Adım
`verify` — test suite'i (zaten yeşil doğrulandı) + build/lint/type-check ve diğer kalite kapılarını çalıştıracak. Bu değişiklik `.tsx` (GitHubSection.tsx, index.tsx) dosyalarına dokunduğu için `verify`'ın vision-test gate'i (gate 12) N/A değil AKTİF çalışmalı.
