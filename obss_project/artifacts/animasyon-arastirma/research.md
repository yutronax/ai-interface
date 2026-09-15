# Araştırma — Animasyon Türleri (Saga #389)

_Kaynak: web araştırması (2026-09-15) + mevcut kod tabanı (`src/components/system/*`,
`src/styles.css`) + `obss_project/artifacts/portfolyo-icerik-karar-matrisi/decision-matrix.md`'nin
"Görsel/Hareket" bölümü._

## Mevcut durum (kod tabanından doğrulandı)

- Animasyon motoru: `motion/react` (Framer Motion) — scroll-pin (`useSectionProgress`),
  `whileInView`, `useTransform`, `AnimatePresence` zaten yaygın kullanılıyor
  (Hero, Experience, Projects, AiPipeline, GitHubSection, Footer).
- `prefers-reduced-motion: reduce` global olarak `styles.css`'te ele alınıyor
  (tüm `*`/`::before`/`::after` için).
- Terminal/glitch estetiği zaten var: `TerminalWindow`, `CharReveal`, typewriter
  (`use-typewriter.ts`), execution-trace paneli.
- `mobile-uyarlama` (Saga #388, bu oturumdan önce) sırasında bir gözlem: Experience
  bölümündeki sayaçlar (`MESSAGES/DAY`, `AUTOMATION%`, `RESPONSE LATENCY`) programatik
  `scrollIntoView()` ile jump-scroll yapıldığında "0" gösterdi — gerçek kullanıcı
  scroll'unda `whileInView` tetiklendiği için muhtemelen çalışıyor, ama doğrulanmadı.
  **Bu görev kapsamında değil, #391'e (implementasyon) not düşülmeli.**

## Bulgular (kaynaklı)

### 1. Scroll-driven animasyon — mevcut yaklaşım hâlâ doğru, native CSS henüz tam hazır değil
CSS'in yerel `animation-timeline`/`scroll-timeline`/`view()` API'si 2026 ortası itibarıyla
Chrome/Edge 115+ ve Safari 26+'da var, ama **Firefox 152'de (2026-06) hâlâ flag arkasında**
(stable'da varsayılan kapalı) — bu yüzden bir portfolyo sitesi için native CSS'e geçiş
şu an tam bir Framer Motion ikamesi değil, en fazla kademeli bir iyileştirme adayı.
**Öneri: `motion/react` kullanımına devam et, native scroll-timeline'ı ayrı ve düşük
öncelikli bir "performans iyileştirmesi" olarak not et — bu görevin kapsamında değil.**
(Kaynak: [MDN — animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline), [CSSAWWWARDS scroll-driven guide 2026](https://cssawwwards.com/blog/css-scroll-driven-animations-guide-2026))

### 2. Micro-interaction — düşük risk, yüksek etki
2026 trendi "amaçlı" micro-animation'lara kaymış (buton hover, ikon geçişi, progress
göstergesi) — dekoratif değil, kullanıcıya geri bildirim veren efektler öne çıkıyor.
Mevcut sitede `rule-link-under` (hover altı çizgi) ve `NavIndicator`'ın collapse/expand
geçişi (Saga #388'de eklendi) zaten bu kategoride. **Ek öneri: Projects kartlarındaki
"OPEN ON GITHUB"/evidence linklerine hover'da hafif bir ok kayması (`AiPipeline`'daki
chevron rotate paterniyle tutarlı) eklenebilir — küçük, düşük risk, mevcut disipline uygun.**
(Kaynak: [Vertical Wise — 2026 animation trends](https://www.verticalwise.com/top-website-animation-trends-for-2026-enhancing-user-experience-and-engagement/))

### 3. Terminal/glitch metin efekti — mevcut typewriter'ı GENİŞLETME, YENİ glitch EKLEME
Araştırma, glitch/scramble efektlerinin üç kesin kuralını doğruluyor:
- DOM'daki gerçek metin hiçbir zaman kalıcı olarak değiştirilmemeli (screen reader için).
- `prefers-reduced-motion: reduce` altında tamamen kapatılmalı (WCAG 2.3.3 — saniyede
  3'ten fazla flaş yasak).
- Monospace font + karakter genişliğinde `min-width` ile scramble sırasında layout
  shift önlenmeli.
Mevcut `use-typewriter.ts` zaten DOM metnini bozmuyor (state üzerinden render ediyor)
ve global `prefers-reduced-motion` kuralı var — **yeni bir glitch/scramble efekti
eklemek yerine mevcut typewriter'ın zaten bu üç kuralı karşıladığını doğrulamak
yeterli; decision-matrix'in "tek imza etkileşim" ilkesine göre EK bir glitch efekti
eklemek scope creep olur, ÖNERİLMİYOR.**
(Kaynak: [CodeFronts — reduced-motion glitch guard](https://codefronts.com/motion/css-glitch-text-effect/), [GitHub PR — prefers-reduced-motion text scramble](https://github.com/user309dec/yechenliu-github.io/pull/182))

### 4. Brütalist/ekspresif tipografi — kapsam dışı ama not edilir
2026 portfolyo trendi brütalist estetik ve büyük/ekspresif tipografiyi destekliyor —
Footer'daki `BUILD SYSTEMS THAT ACT.` (15vw font) zaten bu yönde. **Ek değişiklik
önerilmiyor, mevcut tasarım yönü zaten trendle uyumlu.**
(Kaynak: [Domestika — 2026 portfolio trends](https://www.domestika.org/en/blog/14311-top-25-creative-and-inspiring-portfolios-of-2026-that-you-should-know-about))

## Section → Animasyon eşlemesi (öneri özeti)

| Section | Mevcut | Öneri | Öncelik | Risk |
|---|---|---|---|---|
| Hero | typewriter + SYSTEM ONLINE pulse | Değişiklik yok — zaten kanıtlı metafor (decision-matrix Bulgu 02 çözüldü) | — | — |
| Experience (sayaçlar) | `whileInView` sayı animasyonu | Gerçek kullanıcı scroll'unda sayaçların 0'da kalmadığını doğrula (Playwright, gerçek scroll simülasyonu) | Medium | Düşük (test eksikliği, kod değil) |
| Projects (kanıt linkleri) | `rule-link` hover altı çizgi | Hover'da ok (↗) kayma micro-interaction'ı ekle | Low | Düşük |
| AiPipeline | tıkla-genişlet + chevron rotate | Değişiklik yok — zaten doğru pattern | — | — |
| GitHubSection | statik satır `whileInView` | Değişiklik yok | — | — |
| Footer | CharReveal büyük başlık | Değişiklik yok | — | — |

## Kapsam Dışı (bilinçli olarak önerilmiyor)
- Yeni glitch/scramble metin efekti (mevcut typewriter yeterli, "tek imza etkileşim" ilkesi ihlali olur).
- Native CSS `scroll-timeline`'a geçiş (Firefox desteği olgunlaşmadan riskli).
- Parallax arka plan efektleri (decision-matrix'in "noise'a çökme" uyarısına aykırı, mevcut `grid-field` deseniyle çakışabilir).

## Sonraki Adım
Bu bulgular Saga #391'in (araştırılan içerik/animasyonları webe ekle) ATDD sürecine
girdi olacak. Somut, düşük riskli iki aday var: (1) Projects kartı hover micro-interaction,
(2) Experience sayaçlarının gerçek scroll'da çalıştığının doğrulanması (test/fix).
Daha büyük scope (native CSS geçişi, yeni glitch efekti) bilinçli olarak reddedildi.
