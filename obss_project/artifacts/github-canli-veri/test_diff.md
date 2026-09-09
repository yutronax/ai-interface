# Test Diff — github-canli-veri
_Reference: atdd.md, plan.md_

## Oluşturulan Test Dosyası (Haiku alt-ajanı tarafından)
| Dosya | Durum |
|---|---|
| `src/lib/github-api.test.ts` | Yeni (614 satır) — henüz RED (`./github-api` modülü yok, import hatası) |

## Acceptance Criteria → Test Eşlemesi
| AC | Test describe/it | Beklenen sonuç (şu an) |
|---|---|---|
| AC-1 [Critical] — API başarılı, repoCount/totalStars API verisiyle eşleşir | `AC-1 [Critical]: GitHub API responds successfully` (3 test) | RED (import hatası) |
| AC-2 [Critical] — 403/429/network hatasında throw etmez, fallback döner | `AC-2 [Critical]: Fallback on rate-limit or network error` (5 test) | RED (import hatası) |
| AC-3 [High] — boş repo listesi geçerli durum, fallback'e düşmez | `AC-3 [High]: Empty repo list (valid state, no fallback)` (2 test) | RED (import hatası) |
| AC-4 [High] — null/undefined stargazers_count 0 sayılır, crash yok | `AC-4 [High]: Null/undefined stargazers_count handled defensively` (4 test) | RED (import hatası) |
| AC-5 [Medium] — TTL içinde art arda çağrıda fetch 1 kez çağrılır (cache) | `AC-5 [Medium]: Caching within TTL window` (3 test) | RED (import hatası) |
| AC-6 [Medium] — her koşulda geçerli obje döner, asla throw etmez | `AC-6 [Medium]: Fallback guaranteed, no throw on any error` (5 test) | RED (import hatası) |
| (ek) | `Edge Cases & Defensive Patterns` | RED (import hatası) |

## Varsayımlar (Haiku alt-ajanının raporundan)
- `fetchGitHubStats()` adlı async, named export bir fonksiyon bekleniyor: `Promise<{ repoCount: number; totalStars: number }>`.
- GitHub API URL: `https://api.github.com/users/yutronax/repos`.
- Fallback sabitleri `REPOS`'tan hesaplanıyor: `repoCount: 4`, `totalStars: 46` (12+8+21+5).
- Cache mekanizması modül-seviyesi değişken, TTL 1 saat (3600000ms) — plan.md kararıyla birebir.
- Testler `vi.resetModules()` + dinamik `await import("./github-api")` ile her testte taze modül state'i simüle ediyor (henüz var olmayan implementasyon detayına bağımlı bir varsayım, ama plan.md'nin "basit modül-seviyesi cache" kararıyla tutarlı).
- `fetch` global olarak `vi.fn()` ile mock'lanıyor, gerçek ağ isteği atılmıyor (atdd.md'nin Test Strategy kısıtıyla uyumlu).

## Sonraki Adım
`code-copilot` — bu testleri yeşile çeviren implementasyonu yazacak:
1. `src/lib/github-api.ts` (yeni): `fetchGitHubStats()` — fetch + null/undefined stargazers_count koruması + modül-seviyesi cache (1 saat TTL) + hata durumunda `REPOS` fallback'i, asla throw etmeyen.
2. `src/routes/index.tsx`: `Route`'a `loader` eklenip `fetchGitHubStats()` çağrılacak.
3. `src/components/system/GitHubSection.tsx`: canlı `stats` prop'unu alacak şekilde güncellenecek.
