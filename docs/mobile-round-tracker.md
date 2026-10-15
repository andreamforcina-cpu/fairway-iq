# Round Tracker

The Rounds tab now supports course setup, 9 or 18 holes, hole-by-hole par/strokes/putts entry, a running score, and a completed scorecard, automatic draft saving, and local round history. Existing dashboard data remains a separate sample preview and is not updated by these rounds.

## State and components

`mobile/types/round.ts` defines editable draft interfaces and numeric completed-round interfaces. `mobile/utils/round.ts` handles course validation, bounded integer parsing, hole generation, totals, and finalization. `mobile/components/HoleScoreCard.tsx` reuses existing cards and typography for inputs. The Rounds route delegates to `mobile/components/RoundTracker.tsx`. `useRoundLibrary` restores and saves draft, active-hole and completed-history snapshots through `services/roundStore.ts`; the selected scorecard is transient UI state. The shared Screen accepts an optional keyboard tap setting; other screens keep their previous defaults.

AsyncStorage 2.2.0, installed through Expo’s SDK-compatible installer, stores one versioned device-local library. Draft scores and the selected hole restore on reload. Finishing adds a dated scorecard and clears the draft in one snapshot; starting another round preserves history. Opening a historical scorecard preserves any active draft. Rounds are shared across accounts and sample preview on this device, are unencrypted, and are not backend-synced. No credentials or tokens are stored here; authentication still uses SecureStore. There are no backend or GPS calls.

## Validation and score semantics

- Course name: required, trimmed, at most 100 characters, no control characters.
- Hole count: 9 or 18 only, sequentially numbered.
- Par: integer 1–6; initialized to 4, which must be checked against the course.
- Strokes: integer 1–30.
- Putts: integer 0–30 and cannot exceed strokes; zero must be entered explicitly.
- Negative, fractional, malformed, or blank required values are invalid. Draft text stays editable; invalid text is not counted as a valid score and blocks finishing.
- Running strokes/par use holes with valid par and strokes. Completed-hole and recorded-putt totals additionally require valid putts. Unplayed holes do not count toward par; before any valid score, the UI shows a dash.
- Finish requires at least one played hole. Early finish asks for confirmation and saves the completed prefix only; untouched trailing holes do not count toward strokes or par. Gaps or partially entered scores within the played prefix still block finishing. Scorecards and history label played/planned holes explicitly. Relative-to-par formatting uses E, +n, or -n.

These input limits are MVP bounds, not a claim about official golf scoring rules. No pickup/maximum-score mode, handicap calculation or course lookup is implemented. History is limited to 1,000 completed rounds; no automatic deletion, export or deletion UI is provided.

## Verification

`npm run typecheck`, `npm run lint`, and `npm test` pass: 31 independent tests, including all 20 existing API tests and 11 focused round calculation/validation tests. The focused tests cover both hole counts, input boundaries, blank scores, invalid putt/stroke relationships, partial totals, finish validation, numeric summary independence, and relative score formatting.

Native keyboard behavior, alerts, screen-reader announcements, large-text layout, and complete device navigation remain unverified for this increment. The earlier successful iPhone launch was for the preceding app version.

## iPhone check

```sh
cd /Users/andreaforcina/fairway-iq/mobile
npm start -- --lan
```

Use the same Expo account on the CLI and phone and connect both to the same Wi-Fi. Scan the QR code with iPhone Camera and open Expo Go. If the server is already running, reload the app to get the current code.

1. Open Rounds. Try starting without a course; confirm validation.
2. Enter a course, select 9 holes, and tap Start Round.
3. Hole 1: par 4, strokes 5, putts 2. Confirm total 5 and +1.
4. Hole 2: par 3, strokes 2, putts 0. Confirm total 7 and E.
5. Try putts greater than strokes; confirm inline error and blocked finish. Try Finish with remaining holes blank; confirm it selects the first incomplete hole.
6. Complete holes 3–9 at par 4, strokes 4, putts 2. Finish: expect 35 strokes, par 35, E, and 16 putts.
7. Switch to Home and back; confirm the summary remains while mounted and the dashboard is unchanged.
8. Start another round, confirm replacement, and select 18 holes. Confirm all 18 hole selectors exist.
9. Reload during an unfinished round: confirm scores and selected hole restore. Finish, reload again, and open the saved scorecard from Round history. Start another draft, open an older scorecard, and return to the active draft; its scores must remain unchanged. Check large text, VoiceOver, and keypad/button usability before approving device verification.

No commit or push was performed for this increment.


## Persistence verification — 14 October 2026

Mobile typecheck, lint, all 64 tests and iOS bundle export passed. Export output was written outside the repository to `/private/tmp/fairway-rounds-ios`. The test suite includes seven new persistence tests. They cover partial/invalid editable scores, active-hole restoration, completed numeric score validation, corrupted/unsupported data, atomic draft-to-history snapshots, unique history IDs, ordered snapshot writes and recovery after a failed write. These are automated logic/storage-adapter checks; actual iPhone persistence, small-screen/large-text layouts, keyboard and screen-reader interactions remain unverified.

Reads validate version, sizes, hole sequence, text types, completion timestamps and numeric score bounds. A failed/corrupt read blocks entry and retains existing bytes; retry is available. Writes serialize, and failed saves show a retry action. Changes not yet confirmed saved may be lost if the app closes. There is no destructive reset for unreadable data in this increment.

The SDK 57 versioned AsyncStorage documentation was unavailable; the [current Expo documentation](https://docs.expo.dev/versions/latest/sdk/async-storage/) and installed SDK compatibility mapping were checked. npm audit reports 28 existing-tree advisories (10 moderate, 18 high); none name AsyncStorage or its added dependencies. All advisory package names were already present in the preceding lockfile. Fix suggestions include incompatible Expo/React Native version changes; no unrelated upgrades were applied.


## Early finish correction — 14 October 2026

Following the user's report that Finish Round blocked ending at hole 3, the tracker now supports ending before all planned holes are played. Strokes or putts identify played holes; par alone does not. Trailing blank holes are excluded, while incomplete played holes and gaps still require correction. A confirmation screen allows continuing play without changing the draft. Confirmation stores only completed holes, retains the planned 9/18 length, and history labels played/planned counts. Finished scorecards cannot be resumed. Existing full-round history remains compatible.

Current checks: typecheck, lint, all 69 mobile tests and `git diff --check` pass. Five additional tests cover early-finish totals, empty/incomplete/gapped rounds, full-round equivalence, partial-history restoration and stored-hole-count bounds. The preceding iOS export predates this correction and was not rerun. The user confirmed draft saving and completed-history reopening on iPhone before this correction; early finish and its confirmation/cancel interactions still require device verification.

Device check: enter complete strokes/putts on holes 1–3, leave 4–9 blank, tap Finish Round, and confirm 3/9 holes. Try Keep playing first to check draft preservation. Finish again, confirm, reload, and reopen the 3/9 scorecard from history. Scores and par must include only the three played holes. If hole 3 is blank, expect an offer to save 2/9 instead. No changes in this increment have been committed or pushed.
