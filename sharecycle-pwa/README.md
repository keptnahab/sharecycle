# ShareCycle — PWA

Dein privater Zykluskalender als Progressive Web App.

## Projekt auf neuem Rechner einrichten

1. Repo klonen:
   ```bash
   git clone https://github.com/keptnahab/sharecycle.git
   cd sharecycle/sharecycle-pwa
   ```
2. Node-Version: getestet mit **v22.19.0** (nvm oder vergleichbaren Version-Manager empfohlen)
3. Dependencies installieren und Dev-Server starten (siehe unten)

## Lokale Entwicklung

```bash
npm install
npm run dev
```
Öffnet auf `http://localhost:5173`

## Build

```bash
npm run build
```
Erzeugt den deploy-fertigen `dist/`-Ordner.

## Deployment auf Netlify

### Schnellster Weg (Drag & Drop, ~5 Minuten)

1. [app.netlify.com](https://app.netlify.com) öffnen, kostenlos registrieren
2. Dashboard → "Add new site" → "Deploy manually"
3. Im Terminal: `npm install && npm run build`
4. Den **`dist`**-Ordner ins Netlify-Browserfenster ziehen
5. Live-URL erhalten (z.B. `sharecycle-abc123.netlify.app`)

### Über Git (für automatische Updates)

Das GitHub-Repo (`https://github.com/keptnahab/sharecycle.git`) existiert bereits — einfach Änderungen committen und pushen:
```bash
git add .
git commit -m "..."
git push
```
1. Auf Netlify: "Add new site" → "Import an existing project" → GitHub
2. Build Command: `npm run build`, Publish Directory: `dist`
3. Bei jedem Push wird automatisch neu deployed

## iPhone-Installation für Testerinnen

1. Netlify-Link in **Safari** öffnen (muss Safari sein!)
2. Teilen-Button (□↑) tippen
3. "Zum Home-Bildschirm" wählen
4. Fertig — die App verhält sich wie nativ:
   - Eigenes Icon auf dem Homescreen
   - Vollbild ohne Browser-UI
   - Funktioniert offline
   - Daten bleiben lokal

## Projektstruktur

```
sharecycle/
├── index.html
├── vite.config.js          ← PWA-Konfiguration
├── netlify.toml            ← SPA-Routing + Caching
├── package.json
├── public/
│   ├── sharecycle-symbol.png    ← Logo (in App)
│   ├── icon-192.png             ← Android
│   ├── icon-512.png             ← Splash
│   ├── icon-512-maskable.png    ← Adaptive Icons
│   ├── apple-touch-icon.png     ← iOS Homescreen
│   └── favicon-32.png           ← Browser-Tab
└── src/
    ├── main.jsx
    └── ShareCycle.jsx           ← App-Logik
```
