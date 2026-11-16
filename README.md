# X-Talent portfolio: de treinrit

De creatieve versie van mijn X-Talent-portfolio. Je zit vooraan in de trein en rijdt langs
de stations van mijn X-Talent-traject:

- **Vertrek**: het perron met mijn naam, met mijn voorstelling
- **Spoor 2 (2TIN)**: seminaries, projectweek + Crossroads, POP-sessies
- **De tunnel**: de overgang naar het 3de jaar; daarna verandert het landschap
- **Spoor 3 (3TIN)**: seminaries, hackathon, Duitsland, POP-sessie
- **Eindstation**: mijn eindreflectie en de X-Factor

Bij elke halte kun je **afstappen**: de camera stapt uit op het perron en draait naar de muur
van het stationsgebouw, waar de foto's hangen. Ernaast lees je de volledige uitleg; bij
projectweek, hackathon en Duitsland is dat het hele verslag (omschrijving, verslag en reflectie,
volgens de richtvragen). Met **Opstappen** (of Esc) ga je terug de trein in en rij je verder.
Onder de rit staat het overzicht van alle activiteiten.

Gemaakt met Vue 3 en Vite, en automatisch gepubliceerd op GitHub Pages.

## Lokaal starten

```bash
npm install
npm run dev
```

Open daarna de link uit je terminal (meestal http://localhost:5173/X-Talent/).

## Inhoud aanpassen

Alle tekst staat in **één bestand**: `src/data/portfolio.json`.

- `voorstelling`: wie je bent, je interesses en wat je uit de POP-sessies meenam
- `jaren`: per jaar de stations. Elk station heeft:
  - `bord`: de naam op het stationsbord
  - `samenvatting`: de korte tekst op het gele bord
  - `fotos`: de foto's op de muur van het station (maximaal drie), met een onderschrift
  - `activiteiten`: de rijen voor het overzicht (titel, omschrijving, locatie, datum, duur, zelf aangebracht)
  - `verslag` (optioneel): maakt er een uitgebreide activiteit van, met een knop "Lees het verslag"
- `eindreflectie`: je antwoorden op de vragen van de eindreflectie

Foto's zet je in `public/images/`. Verwijs ernaar als `images/mijnfoto.jpg`.
Een station toevoegen of weghalen mag: de rit wordt vanzelf langer of korter.

## Hoe het werkt

- `src/components/TrainRide.vue`: een heel hoog scrollspoor met daarin een "sticky" podium
  dat altijd in beeld blijft. Daarop staat de 3D-wereld, gemaakt met CSS-transforms.
- `src/journey/engine.js`: zet de scrollpositie om in de positie van de trein, verschuift alles
  in de wereld en bepaalt de tekenvolgorde (wat verst weg is, eerst). Je scrollwiel wordt nooit overgenomen,
  behalve als je afgestapt bent: dan staat de trein stil tot je weer opstapt.
- `src/journey/layout.js`: waar de stations, de tunnel, de palen en de bomen staan.
- `src/components/world/`: de onderdelen van de wereld (landschap, stations, tunnel, bomen).
- `src/components/RideHud.vue`: het vertrekbord, de lijnkaart en de gele informatieborden.
- `src/components/PlatformPanel.vue`: de uitleg die je leest als je afgestapt bent.
- `src/components/ActivityOverview.vue`: het overzicht van alle activiteiten.

## Online zetten (GitHub Pages)

1. Zorg dat `.github/workflows/deploy.yml` bestaat en push naar de `main`-branch.
2. Ga op GitHub naar **Settings → Pages** en kies bij **Source** voor **GitHub Actions**.
3. Na elke push wordt de site automatisch opnieuw gepubliceerd op
   `https://<jouw-gebruikersnaam>.github.io/X-Talent/`.

Heet je repository anders? Pas dan `base` aan in `vite.config.js`.
