# STATUS.md

Stand: 2026-08-19. Lebendes Statusdokument — hier reicht ein Blick, um in einem neuen Kontextfenster sofort weiterzumachen.

## Projekt

ShareCycle ist eine privacy-first Zyklus-Tracking-PWA (React/Vite, **zweisprachige UI: Deutsch + Englisch** per In-App-Umschalter). Alle Daten bleiben in `localStorage` — kein Backend, kein Account.

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

## Offener PR (Session 2026-07-23)

**PR #5 — Zweisprachigkeit DE/EN** (`claude/tree-en-version-planning-5a4cd5 → main`, noch offen): In-App-Sprachumschalter, **ein Build für beide Sprachen** (kein separater englischer Fork). Alle UI-Strings in einem `STR`-Dictionary (`{de,en}`), dazu sprach-gekeyte `PLBL`/`PTXT`/`MO`/`WD`; `dTxt`/`niceFmt` nehmen die Sprache (Datum `en-US` vs `de-DE`, Woche in beiden Mo-first). Sprache wird beim ersten Start aus dem Browser erkannt (`detectLang()`), in Einstellungen → Darstellung (DE/EN) umschaltbar, als `lg` in `sc-v1` persistiert; `document.documentElement.lang` mitgeführt. Geteilte `#p=`-Links tragen keine Sprache — jede*r sieht sie in der eigenen. `index.html` + PWA-Manifest auf Englisch. **Regel in CLAUDE.md verankert:** neuer UI-Text immer als DE- **und** EN-Key, nie inline, nie einen sprachspezifischen Build forken. Branch wurde auf aktuelles `main` rebased, erbt also alle Features (Blüte, Rück-Kalender, granulares Teilen, PMS-Logging).

## Aktuelle Session (2026-08-19)

**Bugfix — Vormonate verschieben sich nicht mehr** (Branch `claude/periodenbeginn-vormonat-bug-wg5kdd`): Bisher wurde jedes Datum als `dif(date, lp) % cl` berechnet — ein einziger Periodenbeginn plus Zykluslänge. Trug man den tatsächlichen Beginn im aktuellen Monat ein, wurde damit rückwirkend der komplette Kalender neu gerechnet: vergangene, real erlebte Perioden rutschten auf andere Tage. Jetzt gibt es eine **Historie aller eingetragenen Periodenbeginne** (`ps`, ISO-Array, aufsteigend; `lp` bleibt als letztes Element für Abwärtskompatibilität erhalten und wird bei Altdaten zu `ps: [lp]` migriert).

Neue Kernfunktion `segOf(date, starts, cl)` liefert das Zyklus-Segment eines Datums (`{s, len, logged}`): Es wird am letzten *eingetragenen* Beginn davor verankert. Liegen zwei eingetragene Beginne vor, ist die Segmentlänge der **echte Abstand** zwischen ihnen — abgeschlossene Zyklen sind damit fixiert. Nur der offene (letzte) Zyklus und Zeiträume ohne Eintrag werden weiterhin mit der Standard-Zykluslänge fortgeschrieben. `phOf`/`cycDay`/`isPeak`/`isFertile` nehmen jetzt dieses Segment statt `(start, cl)`, `nextPer`/`nextOvu` rechnen vom Segment des Bezugsdatums aus.

Weitere Punkte:
- Eingetragene Periodenstarts werden solid dargestellt, prognostizierte/extrapolierte gestrichelt.
- `putStart()` behandelt einen neuen Beginn im Abstand < 10 Tagen (`MINGAP`) als Korrektur des bestehenden Eintrags statt als neuen Zyklus; der Datepicker in den Einstellungen ersetzt gezielt den aktuellsten Eintrag.
- Neue Long-Press-Option „Periodenbeginn entfernen" (DE/EN), sichtbar nur auf einem eingetragenen Starttag und nur solange mehr als einer existiert.
- **Gleiches Problem beim PMS-Beginn mitbehoben:** `lps` war ein einzelnes Datum, dessen Zyklustag-Offset auf *jeden* Zyklus angewendet wurde — ein neu eingetragener PMS-Start verschob also die Luteal→PMS-Grenze auch in allen Vormonaten. Jetzt Historie `pss` (ISO-Array; `lps` bleibt als letztes Element für Abwärtskompatibilität, Altdaten → `pss: [lps]`). Neue Funktion `pmsFor(seg, pmsStarts, lastOff)` löst die Grenze **pro Zyklus** auf: ein im Zyklus eingetragener PMS-Start gewinnt dort; Zyklen *nach* dem neuesten Eintrag erben dessen Offset als verfeinerte Schätzung (Prognose profitiert weiterhin); frühere Zyklen ohne Eintrag behalten die Standardschätzung `len-5`. Eingetragene PMS-Tage solid, geschätzte gestrichelt; Long-Press-Option „PMS-Beginn entfernen" (DE/EN) ergänzt.
- Share-Link-Payload trägt `ps` mit, damit die Partneransicht dieselben Vormonate zeigt; alte Links ohne `ps` funktionieren unverändert (`[lp]`).
- Verifiziert mit Browser-Smoke-Test: nach Eintragen eines neuen Perioden- bzw. PMS-Beginns ändert sich in den Vormonaten keine einzige Kalenderzelle mehr (vorher: kompletter Rutsch), Altdaten und alte Share-Links rendern fehlerfrei.
- **Auslieferung:** Der Fix ist erst im Branch. Auf dem Homescreen des Nutzers läuft weiterhin der `main`-Stand — Netlify deployt nur von `main`, also braucht es Merge → Deploy. Die PWA aktualisiert sich danach von selbst (`registerType: 'autoUpdate'`, `sw.js` mit `Cache-Control: no-cache`): App einmal komplett schließen und neu öffnen, ggf. zweimal. Kein Neu-Installieren nötig, `localStorage` bleibt erhalten.

## Partner-Ansicht abgedichtet (2026-08-19, gleicher Branch)

Gemeldet: Share-Link in Safari geöffnet und via „Zum Home-Bildschirm → als Web-App" gesichert → beim Start landete der Partner in den Einstellungen und sollte einen Periodenbeginn eintragen.

Ursache: iOS nutzt beim Installieren die `start_url` des Manifests (`/`) statt der Seiten-URL und wirft damit das `#p=`-Fragment weg — ohne Hash und ohne eigene Daten hielt sich die App für eine Erstinstallation.

Behoben:
- Neuer localStorage-Key **`sc-pv1`** `{p, dk, lg}`: zuletzt geöffnetes Share-Payload plus die Darstellungs-Einstellungen *dieses* Betrachters. Beim Start ohne Hash wird daraus die Partner-Ansicht wiederhergestellt — eigene Daten in `sc-v1` haben immer Vorrang, die Partner-Ansicht schreibt nie nach `sc-v1`.
- In der Partner-Ansicht wird der `<link rel="manifest">` entfernt und `#p=…` per `history.replaceState` wieder in die URL gesetzt, damit „Zum Home-Bildschirm" die vollständige Share-URL mitnimmt.
- Partner-Ansicht ist jetzt strikt read-only: Name nur als Label (nicht mehr editierbar), kein Teilen-Button, Long-Press ohne Wirkung, und die Einstellungen zeigen **nur** die Gruppe „Darstellung" (Dunkles Design + Sprache). Das Setup-Sheet geht dort nie automatisch auf; der „↩"-Button erscheint nur, wenn das Gerät eigene Daten hat.
- Verifiziert im Browser: Partner mit frischem Storage — Link direkt geöffnet und Start ohne Hash zeigen beide den Kalender statt des Setups, `sc-v1` bleibt leer, Settings enthalten nur „Darstellung". Besitzerinnen-Flow unverändert (Erststart öffnet Setup, volle Einstellungen, Teilen-Button, Manifest bleibt).

## Lokale Vorschau

`.claude/launch.json` definiert den Dev-Server (`sharecycle-dev`, `npm run dev`, Port 5173, cwd `sharecycle-pwa`) — für die Browser-Vorschau in Claude Code bzw. lokal via `npm run dev` im `sharecycle-pwa/`-Ordner.

## Nächste Schritte / offene Punkte

- **Apple Developer Account** existiert noch nicht — Voraussetzung für den App-Store-Pfad (Checkliste in APPSTORE.md: Bundle-ID, Capacitor-Wrapper, Screenshots stehen aus).
- **PR #5 (Zweisprachigkeit)** wartet auf Review/Merge in `main`. Danach Branch aufräumen.
