# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:5173
npm run build     # Production build → dist/
npm run preview   # Serve the built dist/ locally
```

There are no tests or linters configured.

## Architecture

ShareCycle is a privacy-first menstrual cycle tracking PWA. All user data stays in `localStorage` — no backend, no accounts. The UI is **bilingual (German + English)** via an in-app language toggle (see "Internationalization" below).

**Single-component architecture:** All app logic lives in [`src/ShareCycle.jsx`](sharecycle-pwa/src/ShareCycle.jsx) (~600 lines). There are intentionally no helper functions that return JSX — only plain utility functions. The main React component holds all state (~20 hooks) and renders the full UI inline.

**Data model** (localStorage key `sc-v1`):
```js
{ nm, lp, ps, cl, pl, dk, lps, pss, lg }
// name, last-period date (ISO), ps = period-start history (array of ISO dates, ascending),
// cycle length (days), period length (days), dark-mode bool,
// lps = newest logged PMS start (ISO, optional), pss = PMS-start history (array of ISO
// dates, ascending, optional). A PMS start shifts the luteal→PMS boundary of *its own*
// cycle to the actual start instead of the default len-5 estimate. Absent on older data.
// lg = UI language "de" | "en" (optional). Absent on older data → treated as "de".
```
`ps`/`pss` are the source of truth for everything the calendar shows; `lp`/`lps` are kept
as their last elements for backwards compatibility (older data / older share links carry
only `lp` and `lps`, migrated to `ps: [lp]` / `pss: [lps]` on load).

**Core pure utilities** (all in ShareCycle.jsx):
| Function | Purpose |
|----------|---------|
| `segOf(date, starts, cl)` | The cycle segment a date falls into: `{s, len, logged}` — see below |
| `pmsFor(seg, pmsStarts, lastOff)` | The luteal→PMS boundary of a segment: `{off, logged}` |
| `phOf(date, seg)` | Returns cycle phase for a date: `period`, `follicular`, `ovulation`, `luteal`, `pms` |
| `cycDay(date, seg)` | Cycle day number (1-based) |
| `isPeak(date, seg)` | True on peak ovulation day |
| `isFertile(date, seg)` | True in the fertile window |
| `nextPer()` / `nextOvu()` | Next period / ovulation date relative to a reference date |
| `putStart()` / `delStart()` | Add/correct/remove an entry in the period-start history |
| `encShare()` / `decShare()` | Base64-URL encode/decode cycle data for sharing |
| `loadLS()` / `saveLS()` | Read/write the `sc-v1` localStorage entry |

**Past cycles never move (fixed 2026-08-19):** every date is resolved through `segOf()`,
which anchors it to the last *logged* period start at or before it. A cycle bounded by two
logged starts uses the real gap between them as its length, so its phases stay put forever;
only the open (latest) cycle and cycles with no logged start are extrapolated with the
default `cl`. Logging a new period start therefore never repaints earlier months — the bug
where it did came from computing every date as `dif(date, lp) % cl`. Logged period starts
render solid in the calendar, predicted/extrapolated ones hatched. Two starts closer than
`MINGAP` (10 days) are treated as a correction of the same entry, not as two cycles; a
logged start can be removed again via long-press (only while more than one exists).

The same holds for PMS starts (`pss`): `pmsFor()` resolves the luteal→PMS boundary **per
cycle** — a PMS start logged inside a cycle wins there, cycles *after* the newest logged one
inherit its offset as a refined estimate (so predictions still benefit), and earlier cycles
without a log keep the default `len-5`. Logging a PMS start therefore never repaints past
months either. Logged PMS days render solid, estimated ones hatched; a logged PMS start can
be removed again via long-press.

**URL sharing:** Share links use hash fragments (`#p=<base64>`). The app detects these on load and enters a read-only preview mode. The share payload is `{nm,lp,ps,cl,pl,sp,sxt}` (`ps` so the partner sees the same past
months; links without it fall back to `[lp]`):
- `sp` — object of 5 phase booleans (`period`, `follicular`, `ovulation`, `luteal`, `pms`) controlling which phases are visible to the partner
- `sxt` — boolean toggling whether partner-friendly explanation texts are shown

Sharing goes through the **native share sheet**: the share sheet's primary button calls `navigator.share({title,text,url})` (iOS/Android). Browsers without `navigator.share` fall back to the clipboard, and where `navigator.share` exists a secondary "copy instead" button keeps the clipboard path available. `shareLink()` must stay synchronous up to the `navigator.share()` call — Safari rejects it otherwise (user-gesture requirement).

In the partner preview the nav bar shows `{S.sharedBy} NAME` instead of the (tappable, name-editing) name pill.

In the partner preview the phase filter pills are **filtered down to the shared phases** (`pills`, built right before the render) — non-shared phases are omitted entirely rather than shown greyed out or locked, and the shared ones toggle normally, since they only filter the display. If nothing is shared, the pill row is dropped. Because they are interactive in a preview too, `vis` in the calendar loop always reads the local filter state (never a hardcoded `true` for `pv`).

There is exactly **one** round gear button in the top right. Normally (and for a partner) it opens the settings sheet; when the owner opens her own share link (`pv&&own`) the same button leaves the preview instead (clear hash + reload → back to the real app). Two gears side by side would be confusing, and the previous `↩` character rendered as a blue emoji box on iOS.

Older links without `sp` are treated defensively as "everything visible". The `PTXT` constant holds 5 warm, short partner-facing explanation texts (one per phase), shown only in the partner preview (hero card) when `sxt` is on and the current phase is shared.

Default `sp` when opening the share sheet for the first time: `{period:true,follicular:false,ovulation:true,luteal:false,pms:true}` — period/ovulation/PMS are the phases most relevant to a partner, follicular/luteal are off by default. `sxt` (explanation texts) defaults to `true`.

**Partner view (`pv`) is strictly read-only (fixed 2026-08-19):** the share-link viewer sees
the name (plain label, not editable), the phase pills (disabled), the hero card and the
calendar. No share button, no logging (long-press is a no-op), and Settings show *only* the
"Appearance" group — name/period/cycle/save/delete belong to the owner and are hidden behind
`{!pv&&(…)}`. The setup sheet never auto-opens in the partner view. The "↩ back to my own
app" button only appears when this device actually has own data in `sc-v1`.

The partner view survives being installed to the home screen. iOS follows the manifest's
`start_url` ("/") instead of the page URL and therefore drops the `#p=` fragment, which used
to land the partner in the setup sheet. Two things prevent that: the last opened payload plus
that viewer's appearance prefs are stored under **`sc-pv1`** `{p,dk,lg}` and restored when
there is no hash *and* no own data (own `sc-v1` data always wins), and while in the partner
view the app removes the `<link rel="manifest">` and puts `#p=…` back into the URL via
`history.replaceState`, so an "Add to Home Screen" captures the full share URL. Never let the
partner view write to `sc-v1`.

**Explicitly out of scope (decided 2026-07-09, don't re-add without asking):** a separate toggle for whether the name or future predictions are shared was considered and explicitly rejected by Michael when the granular-sharing feature was speced — only phase-selection + explanation-text toggle were requested.

**Internationalization (one codebase, both languages):** There is **no separate English build or branch** — DE and EN ship from this single file, so features are shared across languages by construction. The language mirrors the existing theme pattern (`T = dk ? DK : LK`): `const L = lg; const S = STR[L];`.
- `STR = {de:{…}, en:{…}}` — flat dictionary of every UI string. `PLBL`, `PTXT`, `MO` (months), `WD` (weekday headers) are likewise keyed by language: `PLBL[L].period`, `MO[L][mn]`, etc.
- `dTxt(v, L)` and `niceFmt(s, L)` take the language; date formatting uses `L==="en" ? "en-US" : "de-DE"`. Calendar stays Monday-first in both.
- Language is auto-detected from the browser on first run (`detectLang()` → `navigator.language`), switchable in Settings → Appearance (DE/EN), persisted as `lg`. A `useEffect` keeps `document.documentElement.lang` in sync. Shared `#p=` links carry no language — each viewer sees them in their own chosen language.

> **RULE — keep languages in sync (do not let them drift):** any new user-facing string MUST be added as **both** a `de` and an `en` key in `STR` (or `PLBL`/`PTXT`), never hardcoded inline. Never fork a language-specific build. When adding a feature, translating its strings is part of the same change, not a follow-up. `index.html` (`lang`, og tags) and the `vite.config.js` PWA manifest (`name`, `description`, `lang`) are English.

**Color theming:** Two palettes (dark `DK` / light `LK`) with phase-specific colors — period (coral), follicular (green), ovulation (gold), luteal (purple), PMS (mauve). Theme toggle is stored in `dk` inside the localStorage object.

**PWA / deployment:**
- Service worker is auto-generated by `vite-plugin-pwa` (Workbox, auto-update strategy)
- Google Fonts are cached for 1 year via Workbox runtime caching
- Deployed to Netlify (`netlify.toml`); all routes redirect to `index.html` for SPA routing
- Service worker is served with `Cache-Control: no-cache` so updates are picked up immediately

## Working environment & workflow preferences

Michael works on this project through two different surfaces of the same Claude Desktop app:
- **Cowork ("Home" tab):** file tools work directly on this folder, but the shell/bash tool runs in an isolated cloud sandbox — no access to the Mac's SSH agent/keychain, no outbound SSH. Good for docs, planning, non-git file work.
- **Claude Code ("Code" tab):** runs as a real local process on Michael's Mac — full access to git, SSH, `gh` CLI, macOS Keychain. **This is the preferred surface for anything involving `git push`/`git pull`/GitHub or other terminal/credential work.** Michael already has a working SSH key registered with GitHub on this MacBook Pro (set up during the SmartMarkers project) — reuse it (`git remote set-url origin git@github.com:keptnahab/sharecycle.git` if the remote is still on HTTPS) instead of asking for tokens.

Both surfaces read/write the same folder on disk — there is no "migration" step between them, just open a Code session pointed at this folder.

**Agentic orchestration preference (Cowork sessions):** When a task is large enough to warrant subagents, use a `fable`-model agent as the orchestrator, which breaks the work into pieces and delegates execution to `sonnet`-model subagents (via the Agent tool). If a Sonnet subagent gets stuck or produces a bad result, the Fable orchestrator should not give up — it should diagnose the problem itself and re-issue clearer instructions (or fix it directly), continuing until everything is done, then report back a consolidated summary.

**General rule:** only change what's currently being worked on — no incidental refactors. After every major decision or step, update this file and `STATUS.md` so a fresh context window can pick up immediately.
