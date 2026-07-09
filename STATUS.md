# STATUS.md

Stand: 2026-07-09. Lebendes Statusdokument — hier reicht ein Blick, um in einem neuen Kontextfenster sofort weiterzumachen.

## Projekt

ShareCycle ist eine privacy-first Zyklus-Tracking-PWA (React/Vite, deutschsprachige UI). Alle Daten bleiben in `localStorage` — kein Backend, kein Account.

**USP:** Zyklusdaten gezielt und granular mit dem Partner/der Partnerin teilen (phasenweise auswählbar), um Verständnis für PMS und den Zyklus allgemein zu schaffen — ohne die kompletten Gesundheitsdaten preiszugeben.

**Live-URL:** https://sharecycleapp.netlify.app

## Tech-Stack

- React 19 + Vite 6, Single-Component-Architektur (`sharecycle-pwa/src/ShareCycle.jsx`)
- `vite-plugin-pwa` (Workbox, auto-update Service Worker)
- Datenhaltung: ausschließlich `localStorage` (Key `sc-v1`), kein Server, kein Tracking
- Deployment: Netlify (`netlify.toml`, SPA-Routing)

## Git-Stand

- Repo: `https://github.com/keptnahab/sharecycle.git` (Remote `origin`, bereits vorhanden — kein neues Repo nötig)
- Branch `main`: stabiler Stand
- Branch `feature/pms-logging`: 6 Commits vor `main`, up to date mit origin, **noch nicht gemerged** — offene Entscheidung für Michael, nicht eigenmächtig mergen
- Die Änderungen dieser Session (Teilen-Menü-Umbau + Doku) werden vom Orchestrator im Anschluss auf einem neuen Branch `feature/partner-share-granular` (Basis: `feature/pms-logging`) committet und gepusht

## Diese Session — was gemacht wurde

1. **Teilen-Menü granular umgebaut** (`sharecycle-pwa/src/ShareCycle.jsx`, Build sauber):
   - Alter Modus-State `sm` ("full"/"minimal") ersetzt durch `sp` (Objekt mit 5 Phasen-Booleans: `period`, `follicular`, `ovulation`, `luteal`, `pms`) plus `sxt` (Boolean, steuert ob Partner-Erklärtexte angezeigt werden)
   - Neue Konstante `PTXT`: 5 partnerfreundliche Erklärtexte pro Phase, erscheinen nur in der Partner-Vorschau (Hero-Card), wenn `sxt` aktiv und die jeweilige Phase geteilt ist
   - Share-Link-Payload (`#p=<base64>`) enthält jetzt `{nm,lp,cl,pl,sp,sxt}` statt des alten `mode`-Strings; alte Links ohne `sp` werden defensiv als "alles sichtbar" interpretiert
   - Share-Sheet-UI: statt Segmented-Control "Vollständig/Minimal" jetzt ein Toggle-Switch pro Phase (mit Phasenfarbpunkt) plus ein Toggle "Partner-Infos"
2. **APPSTORE.md** neu erstellt (Projekt-Root): Checkliste + Recherche für eine spätere App-Store-Einreichung (Apple Developer Account noch nicht vorhanden, Bundle-ID TBD, Capacitor-Wrapper TBD, Screenshots TBD). Details siehe dort.
3. **Doku aktualisiert:** dieses STATUS.md, ROADMAP.md, CLAUDE.md (Data-Model-Abschnitt), `sharecycle-pwa/README.md` (Setup-Anleitung).

## Nächste Schritte

- Michael entscheidet über Merge von `feature/pms-logging` → `main`
- Review und ggf. Merge von `feature/partner-share-granular`
- Bei Bedarf: App-Store-Weg gemäß APPSTORE.md angehen (siehe dort für Details/Zeitschätzung)

## Offene Punkte

- Merge-Entscheidung `feature/pms-logging` → `main` steht noch aus
- Apple Developer Account existiert noch nicht (Voraussetzung für App-Store-Pfad)
