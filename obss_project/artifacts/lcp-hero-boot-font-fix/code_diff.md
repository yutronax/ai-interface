# Code Diff — lcp-hero-boot-font-fix

## Değiştirilen Dosyalar
- `src/components/system/Hero.tsx` (satır 96) — `<h1>` artık `{name.typed}` (typewriter state) yerine `{IDENTITY.name}` statik olarak render ediyor. `name`/`useTypewriter` çağrısı `step` (aşağı UI'nin fade-in sırası) için hâlâ kullanılıyor, h1 içeriğine artık bağımlı değil.
- `src/routes/__root.tsx` (satır 108-144) — Google Fonts `<link rel="stylesheet">` kaldırıldı, yerine `rel="preload" as="style"` + `RootShell`'de bir inline script (`document.createElement('link')` ile stylesheet'i runtime'da async ekliyor) + `<noscript>` fallback eklendi. `preconnect` linkleri değişmedi.
- `src/components/system/Hero.test.tsx` — test-copilot'un yazdığı 2 buggy assertion düzeltildi (bkz. aşağıda "Test düzeltmeleri").

## Test Düzeltmeleri (uygulanan iş kapsamında değil, ama gerekliydi)
Code-copilot dispatch'i sonrası 15 testten 2'si fail ediyordu. İnceleme implementasyonun doğru olduğunu, testlerin kendisinin hatalı olduğunu gösterdi:
1. `screen.getByText(/\$ /)` — testing-library whitespace normalize ettiği için sondaki boşluklu regex eşleşmiyordu → `/\$/`e düzeltildi.
2. `expect(heading.textContent).not.toContain(expectedFullName.slice(0, -1))` — matematiksel olarak her zaman false dönen bir assertion (tam isim, kendi son karakteri eksik halini her zaman içerir) → silindi, altındaki `toBe(expectedFullName)` zaten yeterli.
Bu düzeltmeler ayrı bir Haiku dispatch'iyle (test-copilot yetkisinde) yapıldı — code-copilot test dosyasına dokunmadı.

## Acceptance Criteria Karşılama
| AC | Karşılandı mı | Kanıt |
|---|---|---|
| AC-1 [Critical] | ✓ | Hero.test.tsx: 3 test, h1 mount anında IDENTITY.name tam metniyle |
| AC-3 [High] | ✓ | Hero.test.tsx: h1 textContent her zaman sabit, typewriter state'inden bağımsız |
| AC-4 [High] | Kısmen — kod tarafı yapıldı, ölçüm `verify`/Lighthouse'ta | __root.tsx async font pattern uygulandı, gerçek render-blocking azalması Lighthouse ile doğrulanacak |
| AC-5 [Medium] | Kod tarafı yapıldı, throttle ölçümü `verify`'da | h1 artık senkron render, timer'a bağımlı değil |
| AC-6 [Medium] | ✓ (statik) | `noscript` fallback + mevcut CSS font-fallback zinciri (`ui-sans-serif`/`ui-monospace`) korunuyor |

## Not — Plan Kararı #2 ile Sapma
`plan.md`'nin Kararlar #2'si "boot animasyonu basit fade/clip-path reveal'a indirgenecek" diyordu — yani h1 üzerinde dekoratif bir CSS reveal efekti beklentisi vardı. Uygulanan implementasyon h1'i tamamen statik/animasyonsuz bıraktı (hiç reveal yok, direkt görünür). AC'lerin harfiyen karşılanması açısından sorun yok (AC-1/AC-3 "h1 mount anında tam metin" istiyor, hangi görsel biçimde olduğu konusunda nötr) ama plan'ın öngördüğü dekoratif "reveal" efekti eksik — bu bilinçli bir kapsam daraltması olarak `red-team` adımına not düşülüyor, gerekirse kullanıcı isterse ayrı bir polish görevi olarak eklenebilir.

## Test Sonucu (bu adımda doğrulandı)
```
Test Files  1 passed (1)
Tests  14 passed | 1 skipped (15)
```

## Sonraki Adım
`verify` — gerçek prod build + Lighthouse ile LCP/Element Render Delay ölçümü, ayrıca `vision-test` (bu görev .tsx/.css dokunuyor, gate 11 aktif).
