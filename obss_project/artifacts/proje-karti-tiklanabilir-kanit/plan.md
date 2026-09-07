# Plan — proje-karti-tiklanabilir-kanit
_Reference: atdd.md_

## Files to Modify
| File | Why | Risk |
|------|-----|------|
| src/lib/portfolio-data.ts | `Project` tipine opsiyonel `evidence` alanı eklenir (AC-1/AC-2/AC-6: kanıt verisi opsiyonel olmalı, mevcut projelere veri girilir) | low |
| src/components/system/Projects.tsx | `Panel` component'inde `p.evidence` varsa "OPEN ON GITHUB" linkinin yanına/altına ikinci bir tıklanabilir kanıt elemanı eklenir; yoksa mevcut davranış korunur (AC-1, AC-2, AC-5) | medium |

## New Files
(Yok — mevcut component'ler yeterli, ayrı bir "EvidenceLink" component'i şu ölçekte gereksiz; Panel içinde inline eklenecek.)

## Dependencies
- `Project` tipi (`src/lib/portfolio-data.ts:69-77`) — `PROJECTS` dizisindeki 4 obje (flood-detection, ViLT, windowsphereAI, ml-lab) bu tipe uyar, yeni alan eklenirken tip opsiyonel (`evidence?:`) olmalı ki mevcut objeler kırılmasın (AC-6: build başarılı kalmalı).
- `ProjectVisual.tsx` — şu an tamamen dekoratif SVG/ASCII render ediyor, gerçek kanıt DEĞİL; bu component'e dokunulmuyor, kanıt elemanı ayrı ve ek olacak.
- Görsel tipi kanıt eklenirse (`type: "image"`), `<img loading="lazy" onError={...}>` deseni kullanılacak (AC-3, AC-4).
- `prefers-reduced-motion` kontrolü için projede zaten bir yardımcı/hook var mı doğrulanmadı — mevcut `motion/react` kullanım deseninde `viewport={{ once: true }}` var ama reduced-motion sorgusu görülmedi; gerekirse CSS `@media (prefers-reduced-motion: reduce)` ile çözülecek (yeni JS hook eklemeye gerek yok, sadece animasyonlu kanıt tipi eklenirse).

## Migration Required?
Hayır — statik TypeScript veri dosyası, veritabanı/şema yok.

## Risks
- (atdd.md'den) Bazı projeler için gerçek görsel/demo/notebook materyali mevcut olmayabilir — bu task sadece mekanizmayı kurar, her 4 proje için içerik üretmek zorunlu değil (AC-5: kısmi kabul edilebilir).
- (yeni bulgu) `PROJECTS` dizisindeki tüm `url` alanları şu an generic `https://github.com/yutronax` profiline gidiyor, gerçek repo linkine değil — bu decision-matrix'in kapsamındaki bir bulgu değil ama "kanıt" eklerken aynı yanlışın tekrarlanmaması için not edildi (ör. evidence linki de generic olmamalı).
- `Panel` component'i zaten yoğun bir `motion/react` animasyon dizisi kullanıyor (clip-path, opacity, fade sırası) — yeni eleman bu sıraya (delay 0.6 sonrası) eklenirken mevcut layout'u (h-[70vh] sabit yükseklik) taşırmamalı.

## Open Questions (Kararlar)
1. Kanıt tipi kaç çeşit olacak? **Karar: İlk implementasyon sadece harici link ("VIEW DEMO →" tarzı, `<a target="_blank">`).** `evidence.type: "link" | "image"` olarak tip düzeyinde opsiyonel genişletilebilir bırakılır ama görsel/GIF (`loading="lazy"`+`onError`+`prefers-reduced-motion`) desteği bu task'ta zorunlu değil. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: en düşük riskli/en hızlı mekanizma, atdd.md'nin kapsam-dışı maddesiyle uyumlu — "sıfırdan görsel/GIF prodüksiyonu" hariç tutulmuştu)
2. Hangi projelerde gerçek kanıt materyali mevcut? **Karar: Placeholder kalacak — 4 projeden (flood-detection, ViLT, windowsphereAI, ml-lab) hiçbiri için doğrulanmış/erişilebilir gerçek kanıt linki yok.** Testler `evidence` alanının var/yok koşullarını (conditional render, tip güvenliği) doğrular; gerçek içerik (hangi projeye hangi link) ayrı bir veri-girişi işi olarak bırakılır. (Sonnet 5 low alt-ajanı tarafından yanıtlandı: atdd.md'nin Unknowns/Kapsam Dışı bölümleriyle tutarlı)
