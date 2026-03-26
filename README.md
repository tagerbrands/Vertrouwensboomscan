# Borgingsrapport Examencommissie

Deze applicatie helpt examencommissies bij het in kaart brengen en borgen van de kwaliteit van toetsing.

## Ontwikkeling (Lokaal draaien)

1. Installeer de afhankelijkheden:
   ```bash
   npm install
   ```

2. Start de ontwikkelserver:
   ```bash
   npm run dev
   ```

3. Bouw de applicatie voor productie:
   ```bash
   npm run build
   ```

## Deployment op GitHub Pages

Deze repository is geoptimaliseerd voor automatische deployment naar GitHub Pages via GitHub Actions.

### Hoe het werkt:
Zodra je wijzigingen pusht naar de `main` of `master` branch, zal GitHub Actions automatisch de applicatie bouwen en publiceren naar GitHub Pages.

### Instellen in GitHub:
1. Ga naar de repository **Settings** in GitHub.
2. Navigeer naar **Pages** (in het linkermenu).
3. Onder **Build and deployment**, kies bij **Source** voor **GitHub Actions**.
4. Push je code naar GitHub. De workflow `.github/workflows/deploy.yml` doet de rest!

*Let op: zorg ervoor dat je de afbeelding `vertrouwensboom.png` in de `public/` map plaatst voordat je deployt, zodat deze correct wordt weergegeven.*
