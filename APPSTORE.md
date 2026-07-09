# App Store Submission — ShareCycle

Stand: 2026-07-09. Diese Datei ist Doku/Checkliste für eine spätere Einreichung im Apple App Store. Es wurde noch kein nativer Wrapper und kein Xcode-Projekt gebaut.

---

## 1. Checkliste — Was fehlt noch

- [ ] **Apple Developer Account** — noch NICHT vorhanden. Anmeldung unter developer.apple.com/register, 99 USD/Jahr (Einzelperson oder Organisation), Auto-Renewal. Voraussetzung: Apple-ID mit aktivierter Zwei-Faktor-Authentifizierung.
- [ ] **Rechtsform der Anmeldung klären** — Einzelperson ("Individual") reicht i. d. R.; bei Firma zusätzlich D-U-N-S-Nummer nötig (Vorlauf mehrere Wochen).
- [ ] **Bundle-ID** — TBD, z. B. `app.sharecycle.ios` oder `com.<domain>.sharecycle` (reverse-DNS, muss zur Domain/Marke passen, später nicht mehr änderbar).
- [ ] **App Store Connect App-Eintrag** — TBD, nach Freigabe des Developer Accounts anzulegen.
- [ ] **Nativer Wrapper (Capacitor)** — TBD, noch nicht umgesetzt. Reine PWA/Webview wird von Apple mit hoher Wahrscheinlichkeit wegen Guideline 4.2 abgelehnt (siehe unten).
- [ ] **Mac + Xcode** — für den iOS-Build zwingend erforderlich (Xcode 26, macOS). Falls kein Mac vorhanden: Cloud-Build-Dienste (z. B. Ionic Appflow, Capawesome Cloud) als Alternative prüfen.
- [ ] **Screenshots** — TBD, müssen nach Wrapper-Fertigstellung erstellt werden (Pflichtgrößen siehe Abschnitt 2).
- [ ] **App-Icon** — 1024×1024 px, PNG, kein Alpha-Kanal (aktuell nur PWA-Icons vorhanden, ggf. weiterverwendbar).
- [ ] **Privacy Policy URL** — Text liegt als Entwurf in Abschnitt 4 vor, muss noch auf einer öffentlich erreichbaren URL gehostet werden (z. B. als Route auf sharecycleapp.netlify.app).
- [ ] **PrivacyInfo.xcprivacy** — Privacy-Manifest-Datei, seit Mai 2024 Pflicht für jeden Build, sonst automatische Ablehnung. Muss im Xcode-Projekt ergänzt werden (Teil des Capacitor/Xcode-Setups, nicht der Webapp).
- [ ] **App Privacy Nutrition Label** — in App Store Connect auszufüllen (Fragebogen zu gesammelten Daten). Für ShareCycle voraussichtlich einfach zu beantworten, da keine Datenerhebung stattfindet (siehe Abschnitt 2).
- [ ] **Support-URL / Marketing-URL** — TBD, mind. Support-URL ist Pflichtfeld.
- [ ] **App-Store-Metadaten final** — Entwurf liegt vor (Abschnitt 3), muss vor Einreichung final abgestimmt und ggf. übersetzt werden.
- [ ] **Testgeräte / TestFlight-Runde** — vor Store-Einreichung empfehlenswert, insbesondere Offline-Verhalten prüfen (siehe Guideline 4.2).
- [ ] **Xcode-Version prüfen** — Apple verlangt seit 28. April 2026 Builds mit iOS/iPadOS 26 SDK oder neuer; ältere Xcode-Versionen werden nicht mehr akzeptiert.

---

## 2. Recherche-Zusammenfassung

### Apple Developer Program — Anmeldung, Kosten, Dauer
- Kosten: 99 USD/Jahr für Einzelpersonen und Organisationen (Apple Developer Enterprise Program: 299 USD/Jahr, nur für interne Firmenverteilung — für ShareCycle nicht relevant).
- Voraussetzung: Apple-ID mit 2FA.
- Anmeldung über developer.apple.com/register bzw. die Apple-Developer-App; jährliche automatische Verlängerung.
- Freigabe/Verifizierung der Mitgliedschaft kann je nach Fall (Einzelperson vs. Organisation mit D-U-N-S-Nummer) von wenigen Tagen bis mehrere Wochen dauern.
- App-Review-Dauer nach Einreichung: im Schnitt 24–72 Stunden, Grenzfälle (z. B. sensible Datenkategorien, Health-Themen) bis zu 7–10 Tage.

### App Store Connect Setup — grober Ablauf
1. Apple Developer Program Mitgliedschaft aktiv.
2. Bundle-ID im Developer Portal registrieren.
3. In App Store Connect unter "Meine Apps" → "+" → "Neue App": Plattform (iOS), Name, Primärsprache, Bundle-ID, SKU festlegen.
4. Metadaten (Beschreibung, Keywords, Screenshots, Privacy Policy URL, Support URL) hinterlegen.
5. App Privacy Nutrition Label ausfüllen (Pflicht für jede Einreichung, auch Updates).
6. Build aus Xcode hochladen (Archive → Upload); Build muss mit aktuellem SDK erstellt sein und ein PrivacyInfo.xcprivacy-Manifest enthalten.
7. Build der Version zuordnen, "Submit for Review".

### Screenshot-Pflichtgrößen (Stand 2026)
- **iPhone:** Referenzgröße ist das 6.9″-Format (iPhone 17/16 Pro Max) mit **1320 × 2868 px**, Hochformat. Wird dieses Set geliefert, skaliert Apple automatisch für kleinere/ältere Geräte herunter — separate Screenshots für jede Displaygröße sind nicht mehr zwingend nötig. Fallback-Referenz ist das 6.7″-Format mit 1290 × 2796 px, falls kein 6.9″-Set vorhanden ist.
- **iPad:** Falls die App iPad unterstützt (React-Webapp läuft grundsätzlich responsive), ist mind. ein iPad-Screenshot Pflicht. Referenzgröße 13″ iPad Pro (M4): **2064 × 2752 px**; 12.9″ iPad Pro (2048 × 2732 px) wird ebenfalls akzeptiert. Ohne iPad-Screenshot blockiert App Store Connect die Einreichung, sobald iPad als unterstütztes Gerät markiert ist — Alternative: iPad-Unterstützung explizit deaktivieren, dann entfällt die Pflicht.
- Format: PNG oder JPEG, RGB-Farbraum, kein Alpha-Kanal/keine Transparenz.
- Menge: 1–10 Screenshots pro Gerätegröße.
- Empfehlung für ShareCycle: primär 6.9″-iPhone-Set liefern (deckt die meisten Fälle ab), iPad-Unterstützung im ersten Release ggf. bewusst ausschließen, um zusätzlichen Screenshot-Aufwand zu sparen.

### App Privacy Nutrition Label
- Pflichtangabe für jede neue App und jedes Update in App Store Connect (Fragebogen zu Datenarten, Verknüpfung mit Nutzeridentität, Tracking).
- Da ShareCycle keine Daten sammelt, überträgt oder an Dritte weitergibt (alles bleibt in localStorage auf dem Gerät), lässt sich das Label voraussichtlich mit "Es werden keine Daten erfasst" beantworten — das ist der bestmögliche/einfachste Fall.
- Zusätzlich seit Mai 2024 Pflicht: `PrivacyInfo.xcprivacy`-Manifest im App-Bundle, das u. a. genutzte "Required Reason APIs" deklariert. Wird im Xcode-Projekt (Capacitor-Wrapper) ergänzt, nicht in der React-Codebase.
- Privacy Policy URL ist unabhängig vom Label ein separates Pflichtfeld in App Store Connect.

### Guideline 4.2 (Minimum Functionality) — Risiko für ShareCycle
- Kernaussage: Die App muss über eine reine "verpackte Website" hinausgehen ("elevate it beyond a repackaged website"); reine URL-Wrapper ohne native Elemente werden mit hoher Wahrscheinlichkeit abgelehnt.
- Typischer Rejection-Text: "the experience your app provides is not sufficiently different from a web browsing experience, as it would be if displayed in Safari."
- Konkrete Prüfpunkte der Reviewer:
  - Verhalten im Flugmodus/Airplane Mode: zeigt die App einen weißen Bildschirm oder Browserfehler, ist das ein klares Ablehnungssignal.
  - Fehlende native Navigation (z. B. Tab-Bar, native Übergänge).
  - Keine Nutzung gerätespezifischer Fähigkeiten.
- **Für ShareCycle günstig:** Die App ist bereits offline-first (localStorage, kein Backend), das PWA-Grundgerüst mit Service Worker sollte auch offline funktionieren — das ist ein Pluspunkt gegenüber typischen Webview-Wrappern.
- **Mitigation für die Einreichung:**
  - Klar sichtbare native Elemente ergänzen (z. B. native Share-Sheet-Integration statt reinem Web-Share, native Tab-/Navigationsleiste im Wrapper, Statusbar-Anpassung, Safe-Area-Handling).
  - Optional native Zusatzfunktionen: lokale Push-/Erinnerungs-Notifications (z. B. "Periode steht bevor"), Home-Screen-Widget, Haptic Feedback.
  - Offline-Verhalten vor Einreichung explizit im Flugmodus testen.
  - App-Beschreibung und UI sollten den Mehrwert gegenüber der Website betonen (z. B. Offline-Nutzung, Benachrichtigungen, geräteinterne Speicherung).

### Empfohlener nativer Wrapper — Capacitor
- Capacitor (Ionic) kapselt die bestehende Vite/React-Produktion (`dist/`) in eine native WebView und stellt eine TypeScript-API für native Features bereit (Notifications, Share, Haptics etc.).
- Grober Ablauf: bestehendes React-Projekt bleibt unverändert bestehen; Capacitor wird als zusätzliche Schicht hinzugefügt (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`), `npx cap init`, `npm run build`, `npx cap add ios`, `npx cap sync`, danach Öffnen/Bauen in Xcode.
- Voraussetzungen für den iOS-Build: macOS, Xcode 26.0+ (Pflicht seit den 2026er SDK-Anforderungen), Apple Developer Program Mitgliedschaft für Code-Signing.
- Ohne eigenen Mac: Cloud-Build-Dienste wie Ionic Appflow oder Capawesome Cloud können iOS-Builds von Windows/Linux aus signieren und bereitstellen.
- Vorteil: bestehende Webapp-Codebasis (`src/ShareCycle.jsx`) bleibt Single Source of Truth; der Wrapper ist ein separates, dünnes Projekt obendrauf.

### Health-/Zyklus-App-Besonderheiten (Guideline 5.1.x)
- Guideline 5.1 verlangt für Apps mit Gesundheitsbezug grundsätzlich eine Privacy Policy und explizite Nutzerzustimmung zur Datenerhebung.
- Falls perspektivisch Apple HealthKit angebunden würde: Daten aus HealthKit dürfen nicht für Werbung oder Data-Mining verwendet werden, keine Speicherung von Gesundheitsdaten in iCloud, App muss bei jeder Datenanfrage den Verwendungszweck klar erklären.
- **Für ShareCycle aktuell nicht relevant**, da keine HealthKit-Integration geplant ist und keine Datenübertragung stattfindet — das vereinfacht die Einreichung erheblich. Sollte HealthKit später ergänzt werden, gelten die oben genannten strengeren Auflagen zusätzlich.
- Dennoch: Da es sich um eine Zyklus-Tracking-App handelt, ist bei der Store-Beschreibung und beim Privacy-Label besondere Sorgfalt angebracht (sensible Datenkategorie), auch wenn keine Daten das Gerät verlassen. Klare, verifizierbare Aussagen zur On-Device-Speicherung wirken sich positiv auf Vertrauen und Review aus.

---

## 3. Entwurf App-Store-Metadaten

### Titel
- DE: **ShareCycle — Zyklus & Partner**
- EN: **ShareCycle — Cycle & Partner**

(App-Store-Titel max. 30 Zeichen — bei Bedarf kürzen, z. B. "ShareCycle" allein, 10 Zeichen, plus Untertitel für den Zusatz.)

### Untertitel (Subtitle, max. 30 Zeichen)
- DE: Zyklus teilen, PMS verstehen
- EN: Share cycles, understand PMS

### Beschreibung

**DE:**

ShareCycle ist eine Zyklus-Tracking-App, die konsequent auf Privatsphäre setzt: alle Daten bleiben ausschließlich auf deinem Gerät gespeichert — kein Konto, kein Server, kein Tracking.

Das Besondere an ShareCycle: Du kannst deine Zyklusdaten gezielt mit deinem Partner oder deiner Partnerin teilen — per einfachem Link, wahlweise mit vollem Detailgrad, nur mit Periodendaten oder nur mit dem Eisprung-Zeitraum. So entsteht echtes Verständnis für die PMS-Phase, ohne dass du deine kompletten Gesundheitsdaten preisgeben musst. Weniger Missverständnisse, mehr Rücksichtnahme — gemeinsam durch den Zyklus.

Funktionen:
- Zyklus-, Perioden- und Eisprung-Vorhersage
- Übersicht über die aktuelle Zyklusphase (Periode, Follikelphase, Eisprung, Lutealphase, PMS)
- Teilen per Link mit einstellbarer Detailtiefe (voll / nur Periode / nur Eisprung)
- Helles und dunkles Farbschema
- Vollständig offline nutzbar, keine Registrierung nötig
- Keine Werbung, kein Datenverkauf, kein Tracking

ShareCycle richtet sich an alle, die ihren Zyklus im Blick behalten und ihre Partnerschaft durch besseres gegenseitiges Verständnis stärken möchten.

**EN:**

ShareCycle is a menstrual cycle tracker built around one principle: your data never leaves your device. No account, no server, no tracking.

What sets ShareCycle apart: you can choose to share selected cycle details with your partner through a simple link — full data, period dates only, or ovulation window only. This helps your partner understand your PMS phase without you having to expose your entire health history. Less friction, more empathy — navigating the cycle together.

Features:
- Cycle, period and ovulation predictions
- Clear view of the current cycle phase (period, follicular, ovulation, luteal, PMS)
- Share via link with adjustable detail level (full / period-only / ovulation-only)
- Light and dark theme
- Fully usable offline, no sign-up required
- No ads, no data sales, no tracking

ShareCycle is for anyone who wants to stay on top of their cycle — and build more understanding with their partner along the way.

### Keywords (max. 100 Zeichen, kommagetrennt, ohne Leerzeichen nach Komma spart Platz)

- DE: `zyklus,periode,menstruation,pms,fruchtbarkeit,eisprung,partner,teilen,privatsphäre,tracker`
- EN: `cycle,period,menstrual,pms,fertility,ovulation,partner,share,privacy,tracker`

(Vor finaler Einreichung Zeichenlimit prüfen und ggf. gezielt auf Suchvolumen optimieren.)

### Kategorie
- Primär: Gesundheit & Fitness (Health & Fitness)
- Sekundär (optional): Lifestyle

### Altersfreigabe
- Voraussichtlich 12+ oder 17+ wegen medizinischer/gesundheitsbezogener Inhalte — im Age-Rating-Fragebogen von App Store Connect final bestimmen.

---

## 4. Entwurf Privacy Policy

*(Für Hosting unter z. B. sharecycleapp.netlify.app/privacy — Platzhalter [DATUM] und [KONTAKT-E-MAIL] vor Veröffentlichung ausfüllen.)*

**Datenschutzerklärung — ShareCycle**

Stand: [DATUM]

ShareCycle ("die App") ist eine Anwendung zur Zyklus-Verfolgung, die konsequent auf den Schutz deiner Privatsphäre ausgelegt ist.

**1. Keine Datenerhebung durch uns**
ShareCycle verfügt über keinen Server und kein Backend. Wir — die Entwickler der App — erheben, speichern, verarbeiten oder übertragen keinerlei Nutzerdaten. Es gibt kein Nutzerkonto, keine Registrierung und keine Analyse- oder Tracking-Dienste innerhalb der App.

**2. Lokale Speicherung auf deinem Gerät**
Alle von dir eingegebenen Daten (z. B. Name/Kürzel, Datum der letzten Periode, Zykluslänge, Periodendauer, Theme-Einstellung) werden ausschließlich lokal im Speicher deines Geräts (localStorage) abgelegt. Diese Daten verlassen dein Gerät zu keinem Zeitpunkt automatisch und werden nicht an uns oder Dritte übermittelt.

**3. Teilen-Funktion**
ShareCycle bietet eine optionale Funktion, mit der du ausgewählte Zyklusdaten über einen von dir selbst erzeugten Link mit einer Person deiner Wahl teilen kannst. Dabei gilt:
- Das Teilen erfolgt ausschließlich durch deine aktive, bewusste Handlung (Erzeugen und Versenden des Links).
- Die geteilten Daten werden direkt in den Link selbst codiert (Hash-Fragment der URL) — es gibt keinen Server, über den diese Daten laufen oder gespeichert werden.
- Du entscheidest selbst über den Detailgrad der geteilten Daten (vollständig, nur Periodendaten oder nur Eisprung-Zeitraum).
- Sobald du einen Link teilst, trägst du die Verantwortung dafür, über welchen Kanal (z. B. Messenger) dieser Link übermittelt wird; dieser Kanal unterliegt der jeweils eigenen Datenschutzerklärung des genutzten Dienstes.

**4. Keine Weitergabe an Dritte**
Da wir keine Daten erheben, findet auch keine Weitergabe an Dritte, Werbenetzwerke oder Analysedienste statt. Es sind keine Software Development Kits (SDKs) von Drittanbietern zu Tracking- oder Werbezwecken integriert.

**5. Löschung deiner Daten**
Da alle Daten ausschließlich lokal gespeichert werden, kannst du sie jederzeit selbst löschen — entweder über die entsprechende Funktion in der App oder durch Löschen der Browser-/App-Daten deines Geräts. Nach einer Deinstallation der App bzw. dem Löschen der Website-Daten sind sämtliche Informationen unwiderruflich entfernt.

**6. Keine Übertragung an Apple/App Store über die App hinaus**
Über die üblichen, von Apple selbst bereitgestellten Systemdienste hinaus (z. B. anonymisierte technische Absturzberichte, sofern vom Nutzer im Betriebssystem aktiviert) erhebt die App selbst keine Diagnosedaten.

**7. Kontakt**
Bei Fragen zu dieser Datenschutzerklärung erreichst du uns unter: [KONTAKT-E-MAIL]

**8. Änderungen**
Diese Datenschutzerklärung kann bei Weiterentwicklung der App aktualisiert werden. Die jeweils aktuelle Version ist unter dieser URL abrufbar.

---

## 5. Zeitschätzung und nächste Schritte

Grobe Einschätzung, keine verbindliche Projektplanung:

| Schritt | Aufwand | Abhängigkeit |
|---|---|---|
| 1. Apple Developer Account anlegen | 1–3 Tage Wartezeit nach Anmeldung (bei Einzelperson meist schnell, bei Organisation mit D-U-N-S-Nummer mehrere Wochen) | Apple-ID mit 2FA |
| 2. Bundle-ID festlegen, Developer-Portal-Setup | < 1 Tag | Account aktiv |
| 3. Capacitor-Wrapper aufsetzen (iOS-Projekt, Icons, Splash Screen, Safe Areas) | 2–5 Tage | Mac + Xcode vorhanden |
| 4. Native Mitigation für Guideline 4.2 (native Navigation/Share, ggf. lokale Notifications) | 3–7 Tage | Wrapper steht |
| 5. Offline-Test (Flugmodus), interne QA | 1–2 Tage | Wrapper funktionsfähig |
| 6. App Store Connect: App-Eintrag, Metadaten, Privacy Label, Screenshots erstellen | 2–4 Tage | Account + fertige App |
| 7. Privacy Policy hosten (Route/Seite live schalten) | < 1 Tag | Text steht (Abschnitt 4) |
| 8. TestFlight-Runde (optional, empfohlen) | 3–7 Tage | Build hochgeladen |
| 9. Einreichung zur Review | 24 Std. – 10 Tage (Apple-seitig) | alles oben abgeschlossen |

**Empfohlene Reihenfolge:**
1. Apple Developer Account anmelden (kann parallel zu allem anderen laufen, da die Wartezeit der limitierende Faktor sein kann).
2. Privacy Policy Text finalisieren und live hosten.
3. Capacitor-Wrapper lokal aufsetzen, Build auf einem Testgerät/Simulator prüfen.
4. Offline-Verhalten und native Mitigation für Guideline 4.2 umsetzen.
5. Bundle-ID reservieren, App Store Connect App-Eintrag anlegen.
6. Screenshots (6.9″ iPhone-Set, ggf. iPad ausschließen) erstellen.
7. Metadaten final abstimmen (Abschnitt 3 als Ausgangsbasis) und eintragen.
8. TestFlight-Test, dann Einreichung.

Gesamteinschätzung bis zur ersten Einreichung: **ca. 2–4 Wochen**, abhängig vor allem von der Freigabedauer des Developer Accounts und dem Umfang der nativen Mitigation für Guideline 4.2.
