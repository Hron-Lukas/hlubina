# HLUBINA // Sektor 7

## Nativní Rust verze pro Linux/Fedoru

Repozitář nyní obsahuje také nativní desktopovou verzi hry v Rustu. Spouští se jako samostatné okno na Fedoře s GNOME a nevyžaduje Node.js ani webový prohlížeč.

### Požadavky

- Fedora/Linux s grafickým prostředím (GNOME, X11 nebo Wayland přes kompatibilní backend)
- Rust a Cargo (`sudo dnf install rust cargo`)

### Spuštění

```bash
cargo run --release
```

Výsledný binární soubor je `target/release/hlubina`.

Rustová verze zachovává hlavní herní smyčku původní webové hry: pohyb, míření myší, boj zblízka i střelbu, vlny nepřátel, elitní nepřátele, dropy, pět slotů inventáře, šrot a dílnu s upgrady. Vykreslování a vstup zajišťuje knihovna `macroquad`.

Top-down akční survival hra do prohlížeče v temném průmyslovém stylu. Hráč začíná s krumpáčem, likviduje vlny nepřátel, sbírá šrot a lepší zbraně, spravuje pětislotový inventář a v dílně si kupuje trvalá vylepšení.

Hra je celá v češtině, běží bez instalace a bez externích knihoven. Grafika, svět i zvuky se generují procedurálně v prohlížeči.

## Rychlý start

```bash
cd /home/lukas/Projekty/caver
python3 -m http.server 8765
```

Potom otevři:

```text
http://127.0.0.1:8765/index.html
```

Hru lze otevřít i přímo přes `index.html`, ale lokální HTTP server je doporučený.

## Ovládání

| Vstup | Akce |
| --- | --- |
| `WASD` / šipky | Pohyb postavy |
| Myš | Míření |
| Levé tlačítko myši | Útok aktivní zbraní, podržením pokračuje v palbě |
| `Space` | Útok aktivní zbraní |
| `1` až `5` | Výběr slotu inventáře |
| `E` | Sebrání zbraně, případně výměna s aktivním slotem |
| `Q` | Odhození zbraně z aktivního slotu |
| Pravé tlačítko na slotu | Odhození zbraně z daného slotu |
| `B` | Otevření dílny |
| `H` | Nápověda / ovládání |
| `Esc` | Pauza, zavření obchodu nebo nápovědy |
| `M` | Zapnutí/vypnutí zvuku |
| `Enter` / `Space` v menu | Start hry |
| `R` / `Enter` / `Space` po smrti | Nová hra |

## Cíl hry

Přežít co nejvíce vln nepřátel. Za zabité nepřátele hráč dostává šrot a občas zbraně. Šrot slouží k nákupu vylepšení postavy a k opravě integrity. Po každé dokončené vlně následuje krátká přestávka, léčení a odměna.

Hra nemá ukládání postupu. Obnovení stránky nebo nová hra resetuje celý postup.

## Mechaniky

### Hráč

- Základní integrita: `100 HP`.
- Maximální integrita roste s upgradem Chladicí jádro až na `340 HP`.
- Základní rychlost pohybu: `220 px/s`.
- Poloměr postavy: `16 px`.
- Svět má rozměry `2800 × 2100 px`; kamera hráče plynule následuje a je omezená hranicemi světa.
- Dekorace světa jsou pouze vizuální. Kolidují pouze hranice mapy, ne bedny, barely ani potrubí.
- Po zásahu je hráč na `0,32 s` nezranitelný, aby nedocházelo k okamžitému vícenásobnému poškození.
- Hráč nemá pasivní regeneraci. Léčit se dá medkitem, dokončením vlny nebo opravou v dílně.
- Hra se automaticky pozastaví při ztrátě fokusu okna nebo při skrytí záložky.

### Boj

Zbraň se používá podle aktivního slotu. Útok má vlastní prodlevu (`cooldown`) a nevyžaduje munici ani nabíjení.

Poškození zbraně se počítá zhruba takto:

```text
základní poškození zbraně
× multiplikátor kvality
× měřítko podle vlny při vygenerování zbraně
× bonus Serva úderu
× případný kritický zásah
```

Konkrétně:

- Vygenerovaná zbraň má poškození `základ × kvalita × (1 + 0,1 × (vlna - 1))`.
- Servo úderu přidává `+15 %` poškození za úroveň.
- Kritický zásah násobí poškození `1,75×`.
- Na blízko je šance na krit `9 %`.
- U střelných zbraní je šance na krit `8 %` na každý projektil.
- Zásah na blízko má knockback a používá úhel, dosah a oblouk zbraně.
- Střelné zbraně vytvářejí projektily s vlastní rychlostí, rozptylem, dosahem a případným průbojem.
- Projektily nepřátel i hráče používají kolizi po úsečce, takže se nedají snadno „proskočit“ mezi snímky.

Zásah na blízko zasáhne všechny nepřátele v oblouku a dosahu zbraně. Střelná zbraň může zasáhnout více cílů, pokud má průboj.

### Inventář

Hráč má přesně pět slotů.

- Startovní inventář obsahuje krumpáč v prvním slotu a čtyři prázdné sloty.
- Aktivní slot se volí klávesami `1` až `5` nebo kliknutím na hotbar.
- Pokud je v inventáři volný slot, zbraň ze země se automaticky sebere při přiblížení na `30 px`.
- Pokud je inventář plný, zobrazí se výzva k výměně. Klávesa `E` vymění zbraň na zemi za zbraň v aktivním slotu.
- Vyměněná stará zbraň vypadne u hráče s krátkým zpožděním `1,1 s`, aby nedošlo k okamžitému opětovnému sebrání.
- Odhození aktivního slotu: `Q` nebo pravé tlačítko myši na slotu.
- Odhozené zbraně a dropy mají omezenou životnost.

### Šrot, dropy a sbírání

Šrot je jediná měna. Získává se z mincí, které vypadnou z nepřátel, a jako bonus za dokončení vlny.

- Z nepřítele vypadne `1 až 3` hromádky mincí.
- Celková hodnota mincí vychází z typu nepřítele, roste s vlnou a elita má dvojnásobek.
- Mince se přitahují magnetem. Základní dosah magnetu je `105 px`, každá úroveň Polního magnetu přidává `+28 %`.
- Mince se seberou ve vzdálenosti `20 px`.
- Medkit má šanci `6,5 %`, léčí `30 HP` a má magnet o velikosti `70 %` běžného magnetu. Sebere se ve vzdálenosti `25 px`.
- Zbraně se přitahují pouze jako interakce, ne magnetem.
- Životnost dropů: mince `24 s`, medkit `26 s`, zbraň `45 s`.
- Šance na drop zbraně z nepřítele:

```text
min(0,58; 0,20 + 0,018 × úroveň štěstí + 0,005 × číslo vlny + 0,12 u elity)
```

- Po dokončení vlny hráč dostane bonus `8 + 6 × číslo vlny` šrotu, vyléčí se o `12 %` maximální integrity a u hráče se objeví odměnová zbraň.

### Vlny

Vlny začínají automaticky a mezi nimi je přestávka `5 s`.

- Počet nepřátel ve vlně: `5 + 2 × číslo vlny`.
- První vlna má tedy `7` nepřátel, druhá `9`, třetí `11` a tak dále.
- Interval spawnu: `max(0,18; 0,64 - 0,024 × číslo vlny)` sekundy.
- Nepřátelé se spawnují ve vzdálenosti `620 až 850 px` od hráče, pokud to dovolí hranice mapy.
- Spawn má krátké telegraph zpoždění `0,55 s`, efekt prstence a částice.
- Šance na elitu: `min(0,22; 0,02 + 0,012 × číslo vlny)`.
- Počet zbývajících nepřátel se zobrazuje v HUD.

Škálování nepřátel podle vlny:

- HP: `+17 %` za každou vlnu po první.
- Poškození: `+9 %` za každou vlnu po první.
- Rychlost: `+1,4 %` za vlnu, maximálně `+22 %`.
- Hodnota mincí: `+8 %` za vlnu po první.

### Elitní nepřátelé

Elita je silnější varianta běžného nepřítele.

- HP: `1,7×`.
- Poškození: `1,2×`.
- Rychlost: `0,94×`.
- Poloměr: `1,13×`.
- Mince: `2×`.
- Šance na drop zbraně: `+12 procentních bodů`.
- Vizuálně má zlatý prstenec a výraznější efekty.

### Dílna

Dílna se otevírá tlačítkem v HUD nebo klávesou `B`. Během nákupu je simulace hry pozastavená.

Cena další úrovně se počítá jako:

```text
round(základní cena × růst^aktuální úroveň)
```

| Vylepšení | Základní cena | Růst | Maximum | Efekt |
| --- | ---: | ---: | ---: | --- |
| Servo úderu | 40 | 1,55 | 15 | `+15 %` poškození všech zbraní za úroveň |
| Pancéřové pláty | 45 | 1,60 | 10 | `-6,5 %` přijímaného poškození za úroveň, strop `68 %` |
| Chladicí jádro | 35 | 1,50 | 12 | `+20` maximální integrity a `+20` léčení za úroveň |
| Exo-servo | 50 | 1,58 | 10 | `+6 %` rychlosti pohybu za úroveň |
| Spektrální skener | 60 | 1,62 | 10 | Zvyšuje šanci na vzácnější zbraně |
| Polní magnet | 30 | 1,50 | 8 | `+28 %` dosahu přitahování šrotu za úroveň |

Oprava integrity stojí:

```text
max(8; ceil(chybějící HP × 0,65))
```

Oprava vždy doplní integritu na maximum. Vylepšení jsou trvalá do konce aktuální hry.

### Smrt a konec hry

Když integrita klesne na nulu, hra končí. Zobrazí se souhrn:

- dosažená vlna,
- počet eliminací,
- celkově vydělaný šrot,
- čas směny.

Nová hra resetuje hráče, inventář, vlny, šrot i všechna vylepšení.

## Zbraně

### Kvality zbraní

Každá vygenerovaná zbraň má kvalitu. Kvalita určuje násobek poškození, barvu, suffix názvu a také mírné zkrácení prodlevy.

| Kvalita | Násobek poškození | Váha | Suffix | Barva |
| --- | ---: | ---: | --- | --- |
| Obyčejná | 1,00× | 52 | bez suffixu | šedozelená |
| Neobvyklá | 1,20× | 26 | `Mk. II` | zelená |
| Vzácná | 1,48× | 13 | `Mk. III` | modrá |
| Epická | 1,85× | 6 | `// Prototyp` | fialová |
| Legendární | 2,35× | 3 | `// Relikvie` | zlatá |

Prodleva zbraně se zkracuje podle kvality:

```text
výsledná prodleva = základní prodleva × (1 - (násobek kvality - 1) × 0,045)
```

Spektrální skener zvyšuje váhy kvalit:

- Neobvyklá: `+2,4` váhy za úroveň.
- Vzácná: `+1,7` váhy za úroveň.
- Epická: `+1,1` váhy za úroveň.
- Legendární: `+0,65` váhy za úroveň.
- Obyčejná zůstává stejná.

### Zbraně na blízko

| Zbraň | Poškození | Prodleva | Dosah | Oblouk | Knockback | Minimální vlna | Váha |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Krumpáč | 18 | 0,42 s | 64 | 1,45 rad | 145 | start | 0 |
| Trubkový klíč | 27 | 0,58 s | 72 | 1,30 rad | 190 | 1 | 9 |
| Řezný nůž | 20 | 0,24 s | 58 | 1,02 rad | 70 | 1 | 9 |
| Bourací kladivo | 58 | 0,88 s | 84 | 1,90 rad | 285 | 3 | 5 |
| Řetězová pila | 13 | 0,13 s | 66 | 1,02 rad | 42 | 3 | 5 |
| Plazmový řezák | 70 | 0,44 s | 90 | 1,65 rad | 225 | 5 | 3 |

Krumpáč je startovní zbraň a neobjevuje se v běžném drop poolu. Ostatní zbraně se odemykají podle minimální vlny.

### Střelné zbraně

| Zbraň | Poškození | Prodleva | Dosah | Rychlost projektilu | Rozptyl | Projektilů | Průboj | Minimální vlna | Váha |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Šrotová pistole | 17 | 0,31 s | 720 | 980 | 0,025 | 1 | 0 | 1 | 10 |
| Hřebíkovačka | 9 | 0,10 s | 650 | 1050 | 0,075 | 1 | 0 | 2 | 7 |
| Kompresní SMG | 12 | 0,085 s | 700 | 1100 | 0,110 | 1 | 0 | 3 | 6 |
| Šrotovnice | 11 | 0,78 s | 430 | 850 | 0,300 | 5 | 0 | 2 | 7 |
| Průbojná puška | 58 | 0,92 s | 1000 | 1600 | 0,008 | 1 | 2 | 4 | 4 |
| Obloukový vybíječ | 31 | 0,24 s | 620 | 760 | 0,040 | 1 | 1 | 5 | 3 |

Střelné zbraně nemají munici. Rozptyl je v radiánech a udává maximální odchylku od zaměření. Šrotovnice vystřelí pět projektilů najednou, puška a obloukový vybíječ mohou zasáhnout více nepřátel díky průboji.

### Generování zbraní

- Zbraň se generuje z šablony, která je dostupná pro aktuální vlnu.
- Kvalita se losuje podle vah a úrovně štěstí.
- Poškození se násobí kvalitou a měřítkem vlny.
- Zbraně padají z nepřátel, z elit a jako odměna za dokončení vlny.
- Odměna za vlnu používá bonus štěstí `1,5`.
- Název zbraně se skládá ze jména šablony a suffixu kvality.

## Nepřátelé

| Nepřítel | HP | Rychlost | Poškození | Poloměr | Mince | Chování | Odemčení |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Šrotovník | 42 | 74 | 9 | 15 | 3–7 | Běžný kontaktní útočník | vlna 1 |
| Dron | 30 | 104 | 7 | 12 | 4–8 | Střelec, drží odstup asi 285 px, střílí po 2,15 s | vlna 2 |
| Stínošlap | 32 | 150 | 11 | 13 | 5–9 | Velmi rychlý kontaktní útočník | vlna 3 |
| Vrtačka | 76 | 56 | 12 | 19 | 8–14 | Pomalý střelec, drží odstup asi 335 px, střílí po 2,45 s | vlna 4 |
| Těžkooděnec | 190 | 44 | 22 | 25 | 12–22 | Pomalý tank s vysokým poškozením | vlna 5 |

Parametry jsou základní hodnoty před škálováním podle vlny.

Chování nepřátel:

- Kontaktní nepřátelé se pohybují přímo k hráči a útočí při kontaktu. Mezi útoky mají prodlevu přibližně `1,05 s`.
- Střelci se snaží udržet preferovanou vzdálenost, mohou strafeovat do stran a střílet projektily.
- Nepřátelé se od sebe odpuzují, aby se nevršili na jednom místě.
- Nepřátelé se rodí s krátkým zpožděním, během kterého jsou nezranitelní a nejde na ně útočit.
- Od 8. vlny se mění váhy výběru a častěji se objevují těžší typy nepřátel.

Výběr typu nepřítele je vážený:

- Šrotovník: váha 10, od 8. vlny 7.
- Dron: váha 6 od 2. vlny.
- Stínošlap: váha 5 od 3. vlny, od 8. vlny další váha 7.
- Vrtačka: váha 4 od 4. vlny, od 8. vlny další váha 6.
- Těžkooděnec: váha 3 od 5. vlny, od 8. vlny další váha 5.

## Vizuální a zvukový styl

- Tmavá průmyslová paleta s oranžovými a špinavě zelenými akcenty.
- Factorio-like prostředí: kovové pláty, skvrny, praskliny, dopravníky, potrubí, bedny, barely, lampy, výdechy a uhlíky.
- Všechna grafika je kreslená procedurálně na Canvas 2D, bez obrázků a externích assetů.
- Svět se generuje deterministicky pomocí seedovaného PRNG (`mulberry32`).
- Efekty: částice, kouř, jiskry, výbuchy, prstence, plovoucí čísla poškození, otřes kamery a červený záblesk při zásahu.
- Zvuky jsou syntetizované přes Web Audio API: údery, výstřely, zásahy, smrt, mince, sběr, léčba, vylepšení, vlna a game over.
- Zvuk lze vypnout klávesou `M` nebo tlačítkem v HUD.

## Technické provedení

### Jazyky a technologie

- **HTML5** pro strukturu stránky a overlay obrazovky.
- **CSS3** pro temný průmyslový vzhled, responzivní layout a animace UI.
- **JavaScript** (klasické skripty, bez modulů a bez buildu) pro celou herní logiku.
- **Canvas 2D** pro vykreslování světa, postav, nepřátel, projektilů a efektů.
- **Web Audio API** pro procedurální zvuky.
- **Selenium + Firefox** byly použity při vývojovém testování; hra samotná žádné testovací závislosti nepotřebuje.

Hra je v češtině. Kód používá anglické identifikátory, dokumentace a herní texty jsou české.

### Struktura souborů

```text
caver/
├── index.html      # HTML struktura, HUD, menu, dílna, pauza, nápověda, game over
├── style.css       # kompletní vizuální styl a responzivní rozložení
├── README.md       # tato dokumentace
└── js/
    ├── core.js     # data, konstanty, stav hry, vstupy, audio, inventář, shop, UI
    ├── world.js    # simulace, pohyb, boj, nepřátelé, projektily, dropy, vlny
    ├── actors.js   # kreslení hráče, nepřátel a ikon zbraní
    └── render.js   # vykreslování světa, efekty, resize a hlavní smyčka
```

Skripty se načítají v tomto pořadí:

```html
<script src="js/core.js"></script>
<script src="js/world.js"></script>
<script src="js/actors.js"></script>
<script src="js/render.js"></script>
```

Používají sdílený globální lexikální scope. Na pořadí načtení záleží: `core.js` definuje data a stav, `world.js` herní logiku, `actors.js` kreslicí funkce a `render.js` spouští inicializaci a hlavní smyčku.

### Architektura

Hra používá jednoduchý stavový automat:

```text
menu → playing ⇄ paused
                ├→ shop
                ├→ help
                └→ gameover → playing
```

Hlavní smyčka:

- používá `requestAnimationFrame`,
- počítá delta čas a ořezává ho na maximálně `0,05 s`, aby po zaseknutí nevznikly obrovské skoky,
- aktualizuje simulaci pouze ve stavu `playing`,
- v menu pomalým pohybem posouvá kameru,
- každý snímek vykresluje Canvas.

Vykreslování:

- Canvas se přizpůsobuje velikosti okna a device pixel ratio, maximálně `2×`.
- Kamera se plynule přibližuje hráči a je omezená hranicemi světa.
- Svět se vykresluje po vrstvách: podlaha, dekorace, dropy, nepřátelé, hráč, projektily, efekty, částice a reticle.
- Dekorace se cullují podle kamery, aby se nekreslilo vše mimo obrazovku.
- UI je záměrně řešené jako DOM a CSS nad Canvasem, což usnadňuje tlačítka, hotbar, dílny a overlay obrazovky.

Procedurální generování:

- `mulberry32` vytváří deterministickou pseudo-náhodnou sekvenci pro dekorace světa.
- Herní náhoda používá běžný `Math.random`.
- Zbraně, rarity, dropy a spawny nepřátel jsou náhodné.

### Spuštění a vývoj

Projekt nepotřebuje Node.js, npm, bundler ani žádnou instalaci závislostí. Stačí statický HTTP server a moderní prohlížeč.

```bash
python3 -m http.server 8765
```

Po úpravách stačí obnovit stránku. Cache lze obejít tvrdým reloadem.

### Ověření

Během vývoje byla hra testovaná v headless Firefoxu přes Selenium:

- načtení a start z menu,
- pohyb, míření a útok myší i klávesnicí,
- melee i střelné zbraně,
- poškození hráče, pancíř a nezranitelnost,
- spawn nepřátel, jejich AI a projektily,
- dropy mincí, medkitů a zbraní,
- pětislotový inventář, výměna a odhazování,
- dílna, všechny upgrady a oprava,
- vlny, přestávky, odměny a přechod do další vlny,
- pauza, nápověda, game over a restart,
- responzivní layout při různých velikostech okna,
- 60sekundová simulace hry bez chyb.

Chromium nebylo v prostředí dostupné, takže automatické testování proběhlo ve Firefoxu. Hra používá standardní webové API a je navržená pro moderní Chromium, Firefox i další moderní prohlížeče.

## Omezení

- Hra vyžaduje klávesnici a myš; není navržená pro dotykové ovládání.
- Neexistuje ukládání postupu ani leaderboard.
- Dekorace nemají kolize.
- Všechny zbraně mají nekonečnou munici.
- Hra nemá zvukové soubory ani obrázky; vše vzniká za běhu procedurálně.
