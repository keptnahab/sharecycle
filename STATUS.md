# STATUS.md

Stand: 2026-07-23. Lebendes Statusdokument — hier reicht ein Blick, um in einem neuen Kontextfenster sofort weiterzumachen.

## Projekt

ShareCycle ist eine privacy-first Zyklus-Tracking-PWA (React/Vite, deutschsprachige UI). Alle Daten bleiben in `localStorage` — kein Backend, kein Account.

**USP:** Zyklusdaten gezielt und granular mit dem Partner/der Partnerin teilen (phasenweise auswählbar), um Verständnis für PMS und den Zyklus allgemein zu schaffen — ohne die kompletten Gesundheitsdaten preiszugeben.

**Live-URL:** https://sharecycleapp.netlify.app (deployt automatisch von `main`)

## Tech-Stack

- React 19 + Vite 6, Single-Component-Architektur (`sharecycle-pwa/src/ShareCycle.jsx`)
- `vite-plugin-pwa` (Workbox, auto-update Service Worker)
- Datenhaltung: ausschließlich `localStorage` (Key `sc-v1`), kein Server, kein Tracking
- Deployment: Netlify (`netlify.toml`, SPA-Routing)

## Git-Stand

- Repo: `git@github.com:keptnahab/sharecycle.git` (Remote `origin`, SSH — nutzt den vorhandenen Mac-Key)
- Branch `main`: **aktueller stabiler Stand, enthält beide Features unten, live.** Einziger aktiver Branch.
- Feature-Branches `feature/pms-logging` und `feature/partner-share-granular`: via PR in `main` gemergt (PR #1 bzw. #2) und danach **lokal + remote gelöscht** (2026-07-23).
- **Arbeitssurface:** Git-/Terminal-Arbeit läuft im **Claude-Code-Tab** (lokaler Mac-Prozess, Zugriff auf SSH/Keychain), nicht in der Cowork-Sandbox. Push/Pull/PRs funktionieren hier direkt (`gh` authentifiziert). Hintergrund siehe CLAUDE.md.

## Zuletzt gemergt (Session 2026-07-23)

1. **PR #1 — PMS-Logging** (`feature/pms-logging → main`): tatsächlichen PMS-Beginn eintragbar statt Schätzung „Zykluslänge − 5". Neues optionales Datenfeld `lps` (logged PMS start); `phOf()` verschiebt die Luteal→PMS-Grenze entsprechend. Long-Press öffnet ein Auswahl-Modal (🩸 Periodenbeginn / 🌙 PMS-Beginn), inkl. Desktop-Maus-Support. Geloggte PMS-Tage solid im Kalender.
2. **PR #2 — Granulares Partner-Teilen** (`feature/partner-share-granular → main`): Teilen-Menü phasenweise umgebaut. Share-State `sp` (5 Phasen-Booleans) + `sxt` (Erklärtexte an/aus) statt altem `mode`-String. Neue Konstante `PTXT` (5 partnerfreundliche Erklärtexte). Link-Payload `#p=<base64>` trägt `{nm,lp,cl,pl,sp,sxt}`; alte Links ohne `sp` werden defensiv als „alles sichtbar" interpretiert. Default-Auswahl: Periode/Eisprung/PMS an, Follikel/Luteal aus, Erklärtexte an.
3. **Doku nachgezogen:** `lps` im Datenmodell in CLAUDE.md dokumentiert; APPSTORE.md/README.md/CLAUDE.md auf granulares Teilen umgestellt.
4. **PR #3 — Eisprung-Blüte + 6-Monats-Kalender** (`feature/ovulation-bloom-6month-calendar → main`): Eisprung-Symbol jetzt SVG-Blüte statt `✿` — Blütenblätter wachsen zum Eisprung hin (15→20→15px) und werden röter (blass → kräftig rot mit weißer Mitte → blass), danach wieder abnehmend. Kalender zeigt jetzt 6 Monate rückwirkend (−6 bis +11, 18 Monate); Wochentags-Kopf sticky; Auto-Scroll auf den aktuellen Monat beim Öffnen (an `document.fonts.ready` gekoppelt, damit der Webfont-Reflow den Scroll nicht verfälscht). `isPeak`/`isFertile` dadurch ungenutzt, aber als dokumentierte Utilities belassen.

## In Arbeit (Branch `fix/preview-lock-nonshared-filters`, 2026-08-19)

- **Nicht geteilte Phasen-Filter in der Partner-Vorschau ausgeblendet:** erst gesperrt/ausgegraut (Commit `64efc2d`), jetzt komplett weggelassen — in der Vorschau erscheinen nur die freigegebenen Pillen, und die sind normal an-/abwählbar. Sind gar keine Phasen freigegeben, entfällt die Pillen-Zeile.
- **Zahnrad statt `↩` in der Vorschau-Titelleiste:** der Button oben rechts (zurück zur eigenen App/Einstellungen) nutzt jetzt das gleiche Zahnrad-Icon und den gleichen runden Button-Stil wie im Eigen-Modus (das `↩`-Zeichen wurde auf iOS als blaues Emoji gerendert).
- **Teilen über das iPhone-Teilen-Menü:** Der Primärbutton im Teilen-Sheet ruft jetzt `navigator.share({title,text,url})` auf (iOS/Android-Share-Sheet, Text „Mein Zyklus – geteilt von NAME"). Ohne `navigator.share` (Desktop) fällt er auf die Zwischenablage zurück; wo Share existiert, gibt es zusätzlich „Stattdessen kopieren".
- **Titelleiste in der Partner-Vorschau** zeigt statt der Namens-Pille `geteilt von „NAME"` (nicht klickbar, kein versehentliches Namens-Editieren in der Vorschau).
- Noch nicht committet/gemergt.

## Lokale Vorschau

`.claude/launch.json` definiert den Dev-Server (`sharecycle-dev`, `npm run dev`, Port 5173, cwd `sharecycle-pwa`) — für die Browser-Vorschau in Claude Code bzw. lokal via `npm run dev` im `sharecycle-pwa/`-Ordner.

## Nächste Schritte / offene Punkte

- **Apple Developer Account** existiert noch nicht — Voraussetzung für den App-Store-Pfad (Checkliste in APPSTORE.md: Bundle-ID, Capacitor-Wrapper, Screenshots stehen aus).
- Keine offenen Merge-/Push-Entscheidungen mehr — `main` ist der einzige aktive Stand.
