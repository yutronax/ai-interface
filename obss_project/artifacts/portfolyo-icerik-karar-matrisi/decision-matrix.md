# Karar Matrisi — ai-interface portfolyosu

_Kaynaklar: `design_research.html` (nicodiansk.dev kıyası, 2026 portfolyo trendleri, 5 bulgu) + `web-quality-skills` denetimi (accessibility 89→100, 3 gerçek bulgu düzeltildi)._

Her madde bir kaynağa/örneğe bağlı. Kaynaksız/jenerik tavsiye yazılmadı.

## 1. Hero / Açılış

| OLMALI | OLMAMALI |
|---|---|
| Rol + en güçlü sayı ilk ekranda, kaydırmadan görünür (kaynak: SitesPlaced/Colorlib ortak bulgusu, "recruiter 5 saniyede ne anlamalı") | Sadece isim + jenerik ünvan, hiçbir kanıt/sayı olmadan (jenerik AI-portfolyo hissi verir) |
| Metafor (burada: "sistem/terminal") gerçek bir etkileşimle kanıtlanır — nicodiansk.dev'de Matrix/glitch efekti, bizde "SYSTEM ONLINE" + canlı ilerleme göstergesi | Metafor sadece dekoratif etiket kalır, hiçbir gerçek veriye/etkileşime bağlanmaz (bkz. Bulgu 02, aşağıda "İçerik/Anlatı"da tekrar) |
| Tek, tutarlı görsel dil (bizim: monospace etiket, ince grid, tek vurgu rengi — Mat Voyce vakasının "performans disiplini" ilkesiyle uyumlu) | Birden fazla rekabet eden efekt aynı anda (glitch + particle + scanline + parallax) — Giulio Collesei vakası bile bunun "noise'a çökme" riski taşıdığını kabul ediyor |

## 2. Navigasyon / CTA

| OLMALI | OLMAMALI |
|---|---|
| Tek, görsel olarak baskın bir sonraki-adım (SitesPlaced: "bir obvious next move") | Üç eşit ağırlıklı link (**şu anki `ai-interface` footer'ı: "GITHUB · LINKEDIN · MAIL", hepsi aynı ağırlıkta — bu doğrudan Bulgu 01'in anti-pattern örneği**) |
| Dokunma/tıklama hedefleri ≥24×24px (WCAG, ölçülen: `NavIndicator.tsx`'teki 12×12px hedef Lighthouse'ta gerçekten fail verdi, 32×32'ye çıkarılınca `target-size` denetimi geçti) | 12px'ten küçük tıklanabilir alan (ölçülmüş anti-pattern, düzeltildi — bkz. accessibility 89→100 denetimi) |
| Klavye ile erişilebilir, görünür focus durumu | Sadece hover/mouse'a bağımlı etkileşim (klavye kullanıcısını dışlar) |

## 3. İçerik / Anlatı

| OLMALI | OLMAMALI |
|---|---|
| "İş önce, kelime sonra" — proje/deneyim kartlarında somut metrik (bizde zaten var: "IoU +12%", "2.000+ mesaj/gün" — SitesPlaced'in "work first" ilkesiyle uyumlu) | İddia var ama kanıt yok: metrik var ama tıklanabilir kanıt (demo, görsel, notebook) yok (**Bulgu 04'ün tam tarifi**) |
| Başlık hiyerarşisi mantıklı sırada (h1→h2→h3, atlama yok — ölçülen: `Experience.tsx`'teki h3, sayfanın tek h1'inden sonra doğrudan geliyordu, h2 hiç yoktu → düzeltildi, `heading-order` denetimi artık geçiyor) | Başlık seviyesi atlanır (ekran okuyucu kullanıcısı sayfa yapısını yanlış anlar — ölçülmüş anti-pattern, düzeltildi) |
| Kısmi sistem-jargonu (terminal estetiğine uygun) ama gerçek insan diliyle dengelendi | Sadece jargon, hiçbir yerde "bu ne işe yarıyor" açıklaması yok |

## 4. Sosyal Kanıt

| OLMALI | OLMAMALI |
|---|---|
| Gerçek, canlı veriye bağlı sayılar (nicodiansk.dev'in "Skills Dashboard"ı gibi ama daha ötesi — GitHub API'sinden gerçek zamanlı çekilen repo/star sayısı) | Hard-coded sayılar ("04 PUBLIC REPOS · 46 TOTAL STARS" — **bu ai-interface'in şu anki GitHubSection.tsx'inin tam kendisi**, statik görünüyor, "gerçek sistem" metaforunu zayıflatıyor) |
| Emsal karşılaştırması dürüstçe yapılabilir (nicodiansk.dev gibi aynı kulvardaki bir sitenin ne yaptığını bilmek, kopyalamadan farkını bulmak) | Rastgele/doğrulanamaz iddialar ("sektörün en iyisi" gibi kanıtsız üstünlük cümleleri) |

## 5. Görsel / Hareket

| OLMALI | OLMAMALI |
|---|---|
| Bir imza etkileşim, cilalanmış (R—K '26 vakası: "hacim değil, varlık için inşa edildi") | On yarım-pişmiş efekt aynı anda (matrix rain + glitch + particle + scanline'ın hepsi birden — nicodiansk.dev'in riske attığı, bizim şu an kaçındığımız tuzak) |
| `prefers-reduced-motion` her yeni harekette kontrol edilir (`portfolio-site`'ta zaten uygulanan disiplin, buraya da taşınmalı) | Hareket OS-seviyesi tercihi görmezden gelir |
| Renk kontrastı WCAG AA'yı geçer (ölçülen: `--signal-dim` token'ı 0.5→0.62 lightness'a çekilerek, `text-border`'ın metin olarak kullanılması 7 dosyada düzeltilerek — `color-contrast` denetimi artık geçiyor) | Border/ayırıcı rengi metin rengi olarak kullanılır (semantik karışıklık + düşük kontrast — ölçülmüş anti-pattern, düzeltildi) |

**DURUMA GÖRE:** Video-hero/canlı demo — nicodiansk.dev ve Mat Voyce vakası bunu güçlü buluyor (kanıtlanmış metafor), ama Mat Voyce vakası da "performans tuzağı" uyarısı yapıyor (aynı anda tek video oynat, geri kalanı poster'da tut, lazy-load). **Karar:** eklenirse bu disiplinle eklenmeli, disiplinsiz eklenirse OLMAMALI tarafına düşer.

## 6. Performans

| OLMALI | OLMAMALI |
|---|---|
| Production build'de ölçülen gerçek Core Web Vitals (dev-mode ölçümü yanıltıcı — kendi denetimimizde LCP 51s çıktı ama bu sadece minify edilmemiş dev sunucusu yüzündendi) | Dev sunucusu skorunu "gerçek performans" diye sunmak (kendi hatamız, denetim raporunda açıkça not edildi) |
| Büyük bağımlılıklar (framer-motion 374KB, @tanstack/react-router 649KB — kendi build çıktımızdan ölçülen gerçek sayılar) code-splitting ile bölünür | Tüm JS'i tek pakette, lazy-import olmadan yüklemek |
| Gerçek bir deploy (Cloudflare/Vercel) üzerinden Lighthouse ile doğrulanır | Sadece localhost dev sunucusunda "iyi görünüyor" diye kabul etmek |

## Durum Özeti — ne zaten karşılanıyor, ne eksik

| Kategori | Durum |
|---|---|
| Navigasyon/CTA — dokunma hedefi | ✅ Karşılanıyor (bu oturumda düzeltildi: 32×32px) |
| İçerik/Anlatı — başlık hiyerarşisi | ✅ Karşılanıyor (bu oturumda düzeltildi: h3→h2) |
| Görsel/Hareket — kontrast | ✅ Karşılanıyor (bu oturumda düzeltildi: token + text-border temizliği) |
| Navigasyon/CTA — tek baskın CTA | ❌ Eksik (footer hâlâ 3 eşit link) |
| İçerik/Anlatı — proje kartlarında tıklanabilir kanıt | ❌ Eksik |
| Sosyal Kanıt — canlı GitHub verisi | ❌ Eksik (hâlâ hard-coded) |
| Hero — metaforu kanıtlayan gerçek etkileşim | ❌ Eksik (AI-Native Pipeline bölümü hâlâ statik 3 kart) |
| Performans — gerçek prod ölçümü | ❌ Eksik (deploy henüz yapılmadı) |

Bu 5 eksik madde, bir sonraki `plan` adımının doğrudan girdisi.
