# Round Tracker — first increment

The Rounds tab now supports course setup, 9 or 18 holes, hole-by-hole par/strokes/putts entry, a running score, and a completed scorecard. Existing dashboard data remains a separate sample preview and is not updated by these rounds.

## State and components

`mobile/types/round.ts` defines editable draft interfaces and numeric completed-round interfaces. `mobile/utils/round.ts` handles course validation, bounded integer parsing, hole generation, totals, and finalization. `mobile/components/HoleScoreCard.tsx` reuses existing cards and typography for inputs. The Rounds route holds draft, active-hole, and summary state locally. The shared Screen accepts an optional keyboard tap setting; other screens keep their previous defaults.

There are no new dependencies, backend calls, GPS operations, storage, or shared global player state. Navigation between tabs retains the state while the Rounds screen remains mounted. Restarting, reloading, or unmounting may lose it. Starting another round replaces the unsaved summary only after an explicit confirmation.

## Validation and score semantics

- Course name: required, trimmed, at most 100 characters, no control characters.
- Hole count: 9 or 18 only, sequentially numbered.
- Par: integer 1–6; initialized to 4, which must be checked against the course.
- Strokes: integer 1–30.
- Putts: integer 0–30 and cannot exceed strokes; zero must be entered explicitly.
- Negative, fractional, malformed, or blank required values are invalid. Draft text stays editable; invalid text is not counted as a valid score and blocks finishing.
- Running strokes/par use holes with valid par and strokes. Completed-hole and recorded-putt totals additionally require valid putts. Unplayed holes do not count toward par; before any valid score, the UI shows a dash.
- Finish requires valid values for every hole and generates a separate numeric summary. Relative-to-par formatting uses E, +n, or -n.

These input limits are MVP bounds, not a claim about official golf scoring rules. No pickup/maximum-score mode, partial-round finish, handicap calculation, course lookup, or history is implemented.

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
9. Reload: confirm no round is restored. Check large text, VoiceOver, and keypad/button usability before approving device verification.

No commit or push was performed for this increment.
