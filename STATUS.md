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
- Branch `feature/partner-share-granular` (Basis: `feature/pms-logging`): enthält die Änderungen dieser Session (Teilen-Menü-Umbau + Doku), Commit `caa0eda`. **Noch nicht gepusht.**
- **Push-Workflow (bewusste Entscheidung):** Die Cowork-Sandbox ist eine isolierte Linux-Umgebung ohne Zugriff auf den Mac-Schlüsselbund/SSH-Agent — anders als eine lokale Claude-Code-Session im Terminal. SSH zu GitHub ist über das Sandbox-Netzwerk technisch auch gar nicht erreichbar (nur HTTP/HTTPS freigegeben). Michael hat sich bewusst dagegen entschieden, ein GitHub-Token in der `.git/config` zu hinterlegen (würde via Dropbox mitsynchronisiert). **Michael pusht deshalb selbst lokal** — nach jeder Session am Mac ausführen: `git push -u origin <branchname>` (aktuell: `git push -u origin feature/partner-share-granular`).

## Diese Session — was gemacht wurde

1. **Teilen-Menü granular umgebaut** (`sharecycle-pwa/src/ShareCycle.jsx`, Build sauber):
   - Alter Modus-State `sm` ("full"/"minimal") ersetzt durch `sp` (Objekt mit 5 Phasen-Booleans: `period`, `follicular`, `ovulation`, `luteal`, `pms`) plus `sxt` (Boolean, steuert ob Partner-Erklärtexte angezeigt werden)
   - Neue Konstante `PTXT`: 5 partnerfreundliche Erklärtexte pro Phase, erscheinen nur in der Partner-Vorschau (Hero-Card), wenn `sxt` aktiv und die jeweilige Phase geteilt ist
   - Share-Link-Payload (`#p=<base64>`) enthält jetzt `{nm,lp,cl,pl,sp,sxt}` statt des alten `mode`-Strings; alte Links ohne `sp` werden defensiv als "alles sichtbar" interpretiert
   - Share-Sheet-UI: statt Segmented-Control "Vollständig/Minimal" jetzt ein Toggle-Switch pro Phase (mit Phasenfarbpunkt) plus ein Toggle "Partner-Infos"
2. **APPSTORE.md** neu erstellt (Projekt-Root): Checkliste + Recherche für eine spätere App-Store-Einreichung (Apple Developer Account noch nicht vorhanden, Bundle-ID TBD, Capacitor-Wrapper TBD, Screenshots TBD). Details siehe dort.
3. **Doku aktualisiert:** dieses STATUS.md, ROADMAP.md, CLAUDE.md (Data-Model-Abschnitt + neuer Abschnitt "Working environment & workflow preferences"), `sharecycle-pwa/README.md` (Setup-Anleitung).
4. **Grundsatzklärung Cowork vs. Code:** Cowork (Home-Tab) und Claude Code (Code-Tab) laufen in derselben Desktop-App, aber Cowork's Shell ist eine isolierte Cloud-Sandbox ohne Zugriff auf Mac-Schlüsselbund/SSH — Code läuft dagegen direkt lokal auf dem Mac (siehe SmartMarkers-Projekt, dort bereits SSH-Key für GitHub eingerichtet). **Entscheidung: Git-/Terminal-lastige Arbeit an diesem Projekt künftig im Code-Tab, nicht in Cowork.** Beide Tabs arbeiten auf demselben Ordner auf der Platte — kein Datei-Umzug nötig, nur eine neue Code-Session auf diesen Ordner zeigen lassen. Details/Begründung in CLAUDE.md.
5. **Agentic-Workflow-Präferenz dokumentiert** (in CLAUDE.md): bei größeren Cowork-Aufgaben `fable` als Orchestrator, der an `sonnet`-Subagenten delegiert; bei Blockaden löst der Orchestrator selbst, statt aufzugeben.

## Nächste Schritte

- Im Code-Tab ein Projekt/eine Sitzung auf diesen Ordner zeigen lassen (existiert dort noch nicht in der Projektliste) — `CLAUDE.md` + `STATUS.md` geben sofort den vollen Kontext
- Von dort: `git push -u origin feature/partner-share-granular` (ggf. vorher Remote auf SSH umstellen, siehe CLAUDE.md)
- Michael entscheidet über Merge von `feature/pms-logging` → `main`
- Review und ggf. Merge von `feature/partner-share-granular`
- Bei Bedarf: App-Store-Weg gemäß APPSTORE.md angehen (siehe dort für Details/Zeitschätzung)

## Offene Punkte

- `git push -u origin feature/partner-share-granular` — jetzt im Code-Tab statt Cowork (s.o.)
- Merge-Entscheidung `feature/pms-logging` → `main` steht noch aus
- Apple Developer Account existiert noch nicht (Voraussetzung für App-Store-Pfad)
- Aufräumen (im Finder löschen, in der Sandbox nicht löschbar; beides git-ignoriert bzw. außerhalb der Versionierung): `sharecycle-pwa/dist_old/` und `.git/stale-*`-Dateien
- **Bekannte Cowork-Sandbox-Eigenheit (kein Code-Bug):** `npm run build` kann in der Cowork-Sandbox mit `EPERM: operation not permitted, unlink '.../dist/...'` fehlschlagen, wenn ein alter `dist/`-Ordner bereits existiert — die Dropbox-Cloud-Mount-Umgebung der Sandbox erlaubt kein Löschen bestehender Dateien (nur Anlegen). Verifiziert: Build in frisches Verzeichnis (`vite build --outDir dist_verify_test`) läuft fehlerfrei durch — der Code ist sauber. Auf dem echten Mac (natives Dateisystem) tritt das nicht auf.
