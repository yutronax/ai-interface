# AI Interface

Mevcut GitHub profilimdeki içerikleri kullanarak sıradan bir portfolio sitesi oluşturma. Bu proje klasik landing page, kartlar, fade-in animasyonları veya standart navbar tasarımına benzememeli.

Amaç: Kullanıcının sayfayı scroll ederek ilerlediği, her bölümün kendi içinde yaşayan bir sistem gibi davrandığı, bilgilerin tek seferde ekrana düşmek yerine parça parça ortaya çıktığı, teknik ve deneysel bir AI Engineer portfolio deneyimi oluşturmak.

Tasarım dili:

Dark-first, yüksek kontrastlı, teknik ve deneysel bir arayüz.

Siyah/koyu graphite taban.

Mavi neon ağırlıklı ama abartılı cyberpunk görünüm kullanma.

Glassmorphism'u minimumda tut.

Büyük gradient blob'lar, klasik glowing cards, floating particles ve hazır SaaS template estetiği kullanma.

Arayüz "AI portfolio template" gibi görünmemeli.

Görsel dil GitHub + terminal + research lab + modern interface hissini birleştirmeli.

Her section birbirinden tamamen farklı bir görsel davranışa sahip olmalı.

Emoji kullanımını minimuma indir. 🚀 🤖 💡 🔥 gibi sıradan teknoloji emojilerini kullanma. Bunun yerine küçük geometrik semboller, monospaced glyph'ler, teknik işaretler, custom SVG ikonlar ve veri görselleştirmeleri kullan.

Mümkün olduğunca gerçek HTML/CSS/SVG tabanlı görsel öğeler kullan.

ANA ETKİLEŞİM PRENSİBİ:

Scroll sadece sayfayı aşağı götürmemeli.

Scroll = interface interaction.

Her section viewport'a girerken kendi animasyon sistemini başlatmalı.

Bilgiler bir anda görünmemeli.

Örneğin bir section viewport'a girdiğinde:

Önce section'ın iskeleti ortaya çıksın.

Ardından küçük metadata parçaları gelsin.

Sonra başlık karakter/kelime bazında oluşsun.

Sonra açıklama satırları terminal çıktısı gibi sırayla gelsin.

Ardından grafik, bağlantı veya teknik detay ortaya çıksın.

En son section tamamen stabilize olsun.

Kullanıcı scroll'a devam ettiğinde section doğal biçimde bir sonraki section'a dönüşsün.

Bu animasyonlar sadece fade-in olmamalı.

Kullan:

clip-path reveal

masked text reveal

character/word stagger

horizontal translation

parallax

scale transitions

SVG path drawing

counter animations

terminal typing

data stream animations

element morphing

horizontal scroll sections

pinned scroll sections

scroll progress driven transforms

Ancak hiçbir efekti sırf animasyon olsun diye kullanma. Her animasyon içerdiği bilginin anlamına hizmet etmeli.

HERO:

Hero klasik "Hi, I'm Yusuf" bölümü olmamalı.

Ekran ilk açıldığında kullanıcı doğrudan bir AI system interface ile karşılaşmalı.

İlk birkaç saniyede bilgiler parça parça oluşturulsun:

SYSTEM INITIALIZING
→ IDENTITY
→ DOMAIN
→ CURRENT WORK
→ SYSTEM STATUS

Örneğin:

[YUSUF ÇINAR]
AI ENGINEER

MULTI-AGENT SYSTEMS
COMPUTER VISION
NLP PIPELINES

OBSS AI INTERN
TÜBİTAK RESEARCHER

Bu bilgiler terminal çıktısı gibi sırayla oluşsun.

Sonrasında kullanıcı scroll yaptığında hero tamamen başka bir görsel forma geçsin.

İsim küçülüp üst navigation seviyesine taşınabilir.
Ana domain bilgisi yatay şekilde hareket edebilir.
Arka plandaki grid veya data layer farklılaşabilir.

Hero'nun sonunda kullanıcının scroll etmesiyle ikinci section'a fiziksel bir geçiş hissi oluştur.

ABOUT / IDENTITY:

"Who Am I?" şeklinde standart bölüm yapma.

Bunun yerine bir sistem profili oluştur.

Örneğin:

IDENTITY
01

NAME
Yusuf Çınar

ROLE
AI Engineer

DOMAIN
...

Buradaki bilgiler tek kart içinde bulunmasın.

Her bilgi farklı koordinattan veya farklı katmandan gelsin.

Örneğin:

isim üstten

role soldan

domain sağdan

university alttan

Scroll ilerledikçe bu katmanlar hizalansın.

Kullanıcı scroll etmeye devam ettikçe bu katmanlar birleşerek tek bir sistem profiline dönüşsün.

EXPERIENCE:

Experience bölümünü klasik timeline yapma.

Her deneyimi ayrı bir "system execution" olarak göster.

Örneğin:

OBSS
PROCESS RUNNING

INPUT
AI-Native Development

STACK
Claude / Cursor / Codex

METHOD
ATDD / Test-first / Red-team

Her deneyim viewport'a girdiğinde önce sadece kurum ve tarih görünür.

Scroll ilerledikçe:

rol

kullanılan teknoloji

yapılan iş

ölçülebilir sonuç

parça parça ortaya çıksın.

Mavi Lojistik bölümünde özellikle 2,000+ WhatsApp messages/day gibi metrikleri büyük bir data visualization olarak göster.

Örneğin:

2,000+
MESSAGES / DAY

85–90%
AUTOMATION

3 MIN
→
5 SEC

Bu değerler scroll progress ile animate edilmeli.

TÜBİTAK deneyiminde 20,000+ Sentinel-2 görüntüsünü basit text olarak gösterme.

Uydu görüntüsü / segmentation mask / model comparison hissi veren SVG veya canvas tabanlı bir görsel sistem oluştur.

U-Net → DeepLabV3+
IoU +12%
Generalization +10%

PROJECTS:

"Projects on GitHub" şeklinde klasik kart grid kullanma.

Projeleri horizontal cinematic scroll sistemi olarak göster.

Bir proje viewport'a girdiğinde:

PROJECT 01

önce repository adı ortaya çıksın.

Sonra kısa açıklama.

Sonra teknoloji stack.

Sonra teknik detay.

Sonra GitHub bağlantısı.

Kullanıcı scroll ettikçe proje kartları yatay yönde ilerlesin.

Kartların hepsi aynı tasarımda olmasın.

Örneğin:

flood detection → satellite / segmentation visual

ViLT → vision-language interface

windowsphereAI → operating system / file tree interface

ML projects → data / graph visualization

Her proje kendi teknolojisinin görsel metaforunu taşımalı.

TECH STACK:

Büyük logo duvarı oluşturma.

Teknolojileri canlı bir dependency/network graph olarak göster.

Örneğin:

Python
├── PyTorch
├── OpenCV
├── Transformers
└── FastAPI

Scroll sırasında network genişlesin.

Bir teknoloji seçildiğinde bağlı teknolojiler vurgulansın.

AI-NATIVE DEV TOOLS:

Claude, Cursor ve Codex'i üç sıradan badge olarak gösterme.

Bunları development pipeline'ın üç farklı katmanı olarak göster:

PLAN
→ BUILD
→ VERIFY

Her birinin üzerine gelindiğinde veya scroll ile ilerlediğinde pipeline'ın ilgili kısmı aktive olsun.

GITHUB SECTION:

GitHub repository'lerini sadece link listesi olarak gösterme.

Repository verilerini canlı bir developer dashboard gibi sun.

Repository:
stars
language
last activity
stack
project type

gibi bilgileri küçük metadata parçaları halinde göster.

GitHub profil linkini sonunda açık şekilde sun.

SCROLL SYSTEM:

Sayfanın en önemli özelliği scroll davranışı.

IntersectionObserver veya tercihen Framer Motion / Motion tabanlı scroll animation kullan.

Mümkün olduğunda scroll progress değerini doğrudan transform değerlerine bağla.

Bazı section'larda:

position: sticky

kullanarak section'ı viewport'ta sabitle ve scroll'u section'ın içindeki animasyonu kontrol etmek için kullan.

Özellikle:

Hero

Experience

Projects

Tech Stack

bölümlerinde scroll-driven storytelling kullan.

Animasyonlar performanslı olmalı.

GPU-friendly properties kullan:
transform
opacity
clip-path

Layout thrashing oluşturma.

Mobil cihazlarda ağır scroll animasyonlarını azalt ama tamamen kaldırma. Responsive scroll deneyimi korunmalı.

NAVIGATION:

Klasik navbar istemiyorum.

Ekranın bir köşesinde küçük bir system indicator olabilir:

01 / 06
IDENTITY

02 / 06
EXPERIENCE

03 / 06
PROJECTS

...

Scroll ilerledikçe bu gösterge değişsin.

Navigation kullanıcıya sayfanın nerede olduğunu hissettirmeli ama ekranı kaplamamalı.

MICRO INTERACTIONS:

Hover durumlarında sadece scale-up kullanma.

Kullan:

cursor-following micro elements

text displacement

underline drawing

SVG path animation

subtle magnetic movement

data reveal

coordinate changes

Ancak performansı bozacak aşırı efekt kullanma.

EMOJILER:

Klasik emoji kullanımını tamamen bırak:

🚀 🤖 🔥 💡 🧠 ⚡ ❌

Bunların yerine:
⌁
◌
◍
◇
△
∷
01
/ /
[ ]
<>
ve custom SVG/glyph kullan.

Sonuç "emoji-heavy GitHub README" gibi görünmemeli.

TYPOGRAPHY:

Başlıklar için modern grotesk / geometric sans.

Teknik metadata için JetBrains Mono veya benzeri monospace.

Font ağırlıkları ve boyutları arasında ciddi hiyerarşi oluştur.

Bazı metinleri çok büyük ve parçalı kullan.

Örneğin:

BUILD
SYSTEMS
THAT
ACT.

gibi ifadeleri viewport genişliğini kullanarak oluştur.

FOOTER:

Standart "Thanks for visiting" footer yapma.

Sayfanın sonunda bütün sistemin tekrar birleştiği bir final state oluştur.

Örneğin:

SYSTEM STATUS
ONLINE

YUSUF ÇINAR
AI ENGINEER

MULTI-AGENT SYSTEMS
COMPUTER VISION
NLP

ardından GitHub / LinkedIn bağlantıları.

Footer wave veya hazır animated footer kullanma.

GENEL KURAL:

Bu siteyi bir CV'nin web versiyonu olarak tasarlama.

Bir "AI Engineer operating interface" olarak tasarla.

Kullanıcı sayfayı okumasın.

Kullanıcı sayfayı scroll ederek sistemi keşfetsin.

Her scroll hareketi yeni bir bilgi katmanı açsın.

Her section önceki section'dan görsel ve davranışsal olarak farklı hissettirsin.

Hazır portfolio template, SaaS landing page, generic developer portfolio veya Dribbble clone üretme.

Kod temiz, component-based ve sürdürülebilir olsun.

React + TypeScript kullan.

Animasyonlarda mevcut proje yapısına uygunsa Framer Motion / Motion kullan.

Tüm mevcut içerikleri ve verilen GitHub repository bilgilerini koru. İçeriği uydurma veya CV'deki rakamları değiştirme.

Öncelik sırası:

Scroll-driven storytelling

Layered information reveal

Unique interaction design

Technical visual language

Performance

Responsive behavior

Content readability

Animasyon hiçbir zaman okunabilirliğin önüne geçmesin. kalan kısımları yap

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2bdbd839-dec0-4596-818f-960df024f912).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
