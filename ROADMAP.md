# ROADMAP.md

Stand: 2026-07-09. Knapper Überblick über erledigte, kurzfristige und spätere Themen. Keine spekulativen Features — abgeleitet aus README, CLAUDE.md und APPSTORE.md.

## Erledigt

- Kernfunktionen: Zyklus-, Perioden- und Eisprung-Vorhersage, Phasenanzeige (Periode, Follikelphase, Eisprung, Lutealphase, PMS)
- Helles/dunkles Farbschema mit phasenspezifischen Farben
- PWA-Grundgerüst: installierbar, offline-fähig, Service Worker via `vite-plugin-pwa`
- Teilen per Link (Hash-Fragment, base64-codiert, kein Server)
- Granulares Teilen: phasenweise Auswahl (statt nur "Vollständig/Minimal") plus optionale partnerfreundliche Erklärtexte pro Phase (`PTXT`)
- Deployment auf Netlify mit SPA-Routing

## Kurzfristig

- Entscheidung und ggf. Merge von `feature/pms-logging` in `main`
- Review/Merge von `feature/partner-share-granular`
- Manuelles Testen des neuen Teilen-Sheets (Partner-Vorschau, alte Share-Links ohne `sp`)
- Ggf. Privacy-Policy-Text (Entwurf in APPSTORE.md) als eigene Route/Seite live schalten — wird ohnehin für den App-Store-Pfad benötigt

## App-Store-Pfad (eigene Phase)

Vollständige Checkliste, Recherche und Zeitschätzung siehe **APPSTORE.md**. Kurzfassung der Voraussetzungen:

- Apple Developer Account (noch nicht vorhanden, 99 USD/Jahr)
- Nativer Wrapper via Capacitor (noch nicht umgesetzt) — reine PWA würde an Guideline 4.2 scheitern
- Bundle-ID, App-Icon, Screenshots, Privacy-Manifest (`PrivacyInfo.xcprivacy`)
- Geschätzter Gesamtaufwand bis zur ersten Einreichung: ca. 2–4 Wochen

## Später / Ideen

- Native Zusatzfunktionen im Rahmen des Capacitor-Wrappers (lokale Erinnerungs-Notifications, Haptic Feedback) — dienen auch als Mitigation für Guideline 4.2
- Android-Store-Pfad (Google Play), falls gewünscht — aktuell nicht geplant/dokumentiert
