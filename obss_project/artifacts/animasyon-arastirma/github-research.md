# Araştırma — GitHub İçerik Zenginleştirme (Saga #390)

_Kaynak: web araştırması (2026-09-15, GitHub resmi dokümantasyonu + Scrapling repo)
+ mevcut kod tabanı (`src/lib/github-api.ts`, `src/components/system/GitHubSection.tsx`)._

## Mevcut durum (kod tabanından doğrulandı)

`fetchGitHubStats()` (`src/lib/github-api.ts`) client-side, kimliksiz (unauthenticated)
tek bir REST çağrısı yapıyor: `GET https://api.github.com/users/yutronax/repos`.
Bu yanıttan sadece `stargazers_count` toplamı ve repo sayısı kullanılıyor — ama
**GitHub'ın bu tek endpoint'i zaten `description`, `language`, `pushed_at`, `topics`,
`html_url` gibi alanları da döndürüyor, hiç ek çağrı gerekmeden.** Şu an bu alanlar
kullanılmıyor; `GitHubSection.tsx`'teki repo satırları (`stack`, `language`, `stars`,
`activity`) hâlâ `portfolio-data.ts`'teki elle yazılmış `REPOS` sabitinden geliyor.

## Bulgular

### 1. Rate limit — mevcut yaklaşım (kimliksiz REST) mimari olarak doğru
- Kimliksiz REST: **60 istek/saat** (IP başına).
- Kimlikli REST (token ile): 5.000 istek/saat.
- **GraphQL API kimliksiz KULLANILAMAZ** — token zorunlu.
- Mevcut kod client-side (her ziyaretçinin kendi tarayıcısından) çağrı yapıyor ve
  1 saatlik in-memory cache kullanıyor → her ziyaretçi kendi IP'sinin 60/saat
  limitini kullanıyor, sunucu tarafında paylaşılan bir limit riski yok. Bu, tek bir
  build-time/sunucu taraflı çağrıya göre **daha güvenli** bir mimari (tek nokta
  hatası/limit tükenmesi yok).
(Kaynak: [GitHub Docs — REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [GitHub Discussion — GraphQL unauthenticated](https://github.com/orgs/community/discussions/139866))

### 2. Scrapling (Python) — ÖNERİLMİYOR
Scrapling genel amaçlı bir HTML scraping framework'ü (D4Vinci/Scrapling) — hız,
düşük bellek kullanımı ve adaptif DOM navigasyonu güçlü yanları, ama:
- **Python kütüphanesi**, bu proje TypeScript/React/TanStack Start (Node/Vite).
  Kullanmak için ayrı bir Python mikroservisi veya build-time subprocess gerekir —
  mevcut mimariye yabancı bir bağımlılık ekler.
- GitHub zaten yapılandırılmış, resmi, ücretsiz bir REST/GraphQL API sunuyor;
  HTML scraping bunun üzerine hiçbir gerçek veri avantajı sağlamıyor (aynı veriye
  API'den çok daha güvenilir ve ToS-uyumlu şekilde ulaşılıyor). GitHub'ın kendi
  sayfalarını scrape etmek `robots.txt`/ToS ihlali riski taşır, API bunu taşımaz.
- **Sonuç: scrapling bu görev için gereksiz karmaşıklık — kullanılmayacak.**
(Kaynak: [D4Vinci/Scrapling README](https://github.com/D4Vinci/Scrapling/blob/main/README.md))

### 3. Önerilen yöntem — mevcut REST çağrısını genişlet (yeni bağımlılık YOK)
`fetchGitHubStats()` zaten çektiği `/users/yutronax/repos` yanıtından ek alanları
parse edip döndürmesi yeterli — yeni istek, yeni kütüphane, yeni kimlik doğrulama
gerekmez:

```ts
interface GitHubRepoDetail {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string; // ISO — "activity" (RECENT/2 MONTHS/...) hesaplamak için
}
```

`GitHubSection.tsx`'in şu an `portfolio-data.ts::REPOS`'tan okuduğu `stack`/`language`/
`stars`/`activity` alanları, API'den gelen gerçek veriyle değiştirilebilir — bu,
decision-matrix'in "Sosyal Kanıt" bölümündeki "gerçek, canlı veriye bağlı sayılar"
ilkesini repo satırlarına da taşır (şu an sadece üstteki 3 özet sayı canlı, repo
tablosunun kendisi hâlâ statik).

### 4. Daha zengin veri (README özeti, dil yüzdesi, katkı grafiği) — build-time/server-side gerektirir
README içeriği veya per-repo dil yüzdesi (`GET /repos/:owner/:repo/languages`)
gibi veriler ek istek gerektirir ve `60/saat` limitini hızla tüketebilir (4 repo ×
1 dil-yüzdesi çağrısı = tek ziyarette 5 istek). Bunlar için:
- **Build-time fetch (SSR/statik üretim sırasında, sunucu env'inde saklanan bir
  `GITHUB_TOKEN` ile, 5.000/saat limitiyle) + sonucu build çıktısına gömme** en
  güvenli yol — TanStack Start'ın server function/loader mekanizması buna uygun.
  Token asla client'a sızmaz.
- Client-side'da böyle bir token'ı KULLANMA — tarayıcıda görünür olur, kötüye
  kullanılabilir.
- **Bu görev kapsamında değil** (README özeti/dil yüzdesi şu an istenmedi) —
  yalnızca ileride istenirse mimari not olarak burada duruyor.

## Önerilen Entegrasyon Noktası
`src/lib/github-api.ts` → `fetchGitHubStats()` yerine (veya yanında)
`fetchGitHubRepoDetails(): Promise<GitHubRepoDetail[]>` eklenir, aynı tek REST
çağrısını kullanır (ek istek yok), aynı 1 saatlik cache paternini takip eder, aynı
"hata olursa `REPOS` sabitine sessizce düş" davranış sözleşmesini korur (mevcut
AC-2/AC-6 ile tutarlı). `GitHubSection.tsx` bu yeni fonksiyonu tüketir, `portfolio-data.ts::REPOS`
sadece fallback olarak kalır.

## Kapsam Dışı (bilinçli olarak önerilmiyor)
- `scrapling`/HTML scraping (gereksiz, ToS riski, yabancı stack).
- README içerik özeti, dil yüzdesi, katkı grafiği (ek istek hacmi + token/build-time
  mimari gerektirir — ayrı bir görev olarak ele alınmalı, istenirse).
- GraphQL API'ye geçiş (kimliksiz kullanılamıyor, mevcut ihtiyaç için REST yeterli).

## Sonraki Adım
Bu bulgular Saga #391'in ATDD sürecine girdi. Somut, düşük riskli öneri: mevcut
`fetchGitHubStats()` çağrısını genişletip `GitHubSection.tsx`'in repo tablosunu
`portfolio-data.ts::REPOS`'tan gerçek API verisine taşımak — yeni bağımlılık,
yeni istek, yeni kimlik doğrulama gerektirmiyor.
