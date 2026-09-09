# Plan — github-canli-veri
_Reference: atdd.md_

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| src/routes/index.tsx | `Route`'a bir `loader` eklenir (`fetchGitHubStats()` çağrılır), `Index` component'i `Route.useLoaderData()` ile veriyi alıp `GitHubSection`'a prop olarak geçirir (AC-1, AC-2, AC-5, AC-6) | medium |
| src/components/system/GitHubSection.tsx | `REPOS`'u doğrudan import edip kullanmak yerine, dışarıdan `stats: { repoCount: number; totalStars: number }` prop'u alacak şekilde değiştirilir. Repo satırlarının kendisi (isim/stack/dil/aktivite) hâlâ `REPOS` sabitinden gelir — sadece dashboard strip'teki (PUBLIC REPOS / TOTAL STARS) iki sayı canlı veriden gelir (AC-1, AC-3, AC-4) | medium |

## New Files
| File | Purpose |
|------|---------|
| src/lib/github-api.ts | `fetchGitHubStats()`: `https://api.github.com/users/yutronax/repos` çağrısı, `stargazers_count` toplamı + repo sayısı hesaplama, null/eksik `stargazers_count` için 0 varsayma (AC-4), in-memory module-level cache + TTL (1 saat, atdd.md varsayımı), 403/429/network hatasında `portfolio-data.ts`'teki `REPOS` fallback'ine düşme (AC-2), try/catch ile hiçbir zaman throw etmeme (AC-2, AC-6) |

## Dependencies
- `IDENTITY.github` (`src/lib/portfolio-data.ts:6`) — GitHub kullanıcı adı `yutronax` zaten burada tanımlı, `github-api.ts` bunu tekrar hardcode etmek yerine buradan alabilir veya URL'den parse edebilir (basit olan: `IDENTITY.github`'dan username'i türetmek yerine, doğrudan sabit bir `GITHUB_USERNAME = "yutronax"` sabiti kullanmak daha az bağımlılık — CAVEMAN: iki satırlık bir regex/parse yerine tek sabit).
- `REPOS` (`src/lib/portfolio-data.ts:146-179`) — fallback verisi olarak KALACAK, silinmeyecek (Rollback Beklentisi).
- Route'un mevcut `head()` konfigürasyonu (`src/routes/index.tsx:12-30`) değişmeyecek, sadece `loader` eklenecek — TanStack Router'ın `createFileRoute(...)({ head, loader, component })` imzası bunu destekliyor.
- `eslint.config.js`'teki `no-restricted-imports` kuralı `server-only` paketini yasaklıyor ve `*.server.ts`/`@tanstack/react-start/server-only` kullanılmasını öneriyor — ancak projede henüz böyle bir dosya yok. `github-api.ts` bir public API'ye (auth gerektirmeyen) fetch attığı ve client'ta çalışması sakıncalı olmadığı için (sadece rate-limit optimizasyonu için server-side loader'da çağrılıyor) `.server.ts` uzantısına GEREK YOK — bu bir CAVEMAN kararı, gereksiz karmaşıklık eklenmiyor.

## Migration Required?
Hayır — statik/in-memory veri, veritabanı/şema yok.

## Risks
- (atdd.md'den) TanStack Start SSR loader'ının cold-start'ta (Cloudflare Workers hedefli build) in-memory cache'i sıfırlaması riski — kabul edilebilir, kişisel site trafiği düşük, her cold start'ta tek bir ekstra API çağrısı rate-limit'i tehlikeye atmaz.
- (yeni bulgu) Projede şu an hiç `loader` kullanan bir route yok — bu ilk kullanım. TanStack Start'ın `loader` fonksiyonunun bu proje versiyonunda (`@tanstack/react-start@1.168.32`, `@tanstack/react-router@1.170.18`) tam olarak nasıl çağrıldığı (build sırasında mı, her request'te mi, client-side navigasyonda tekrar mı) doğrulanmalı — code-copilot implementasyon sırasında TanStack Start dokümantasyonuna/tip tanımlarına bakarak doğru imzayı kullanmalı.
- `fetchGitHubStats()`'ın gerçek `fetch` çağrısı test ortamında (happy-dom + vitest) mutlaka mock'lanmalı — gerçek ağ isteği test sırasında atılırsa hem yavaş hem rate-limit riski taşır (atdd.md Test Strategy'de zaten belirtilmiş).

## Open Questions (Kararlar)
1. Cache TTL süresi? **Karar: 1 saatlik varsayımla devam.** Kişisel portfolyo sitesi düşük trafikli, GitHub public API limiti saatte 60 istek — 1 saat TTL bolca pay bırakıyor. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: ekstra onay turu CAVEMAN ilkesine aykırı olur)
2. In-memory cache yapısı? **Karar: Basit modül-seviyesi değişken (`let cache: {data, timestamp} | null`).** Tek instance, tek route, düşük trafikli bir SSR loader için yapılandırılmış bir çözüm YAGNI ihlali olur. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: cold-start sıfırlanma riski her iki yaklaşımda aynı, karmaşıklık artışı fayda sağlamıyor)
