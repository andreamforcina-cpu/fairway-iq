# FAIRWAY IQ — Product Vision

Strategy aligned 2026-10-16. Product direction, not a claim of market validation or implementation authorization. Current delivery evidence lives in [CURRENT_STATE.md](CURRENT_STATE.md).

## Mission and positioning

**FAIRWAY IQ — Your Personal Golf Improvement System.**

Track your rounds. Understand your weaknesses. Practice smarter. Lower your scores.

Help amateur golfers turn trustworthy round records into understandable decisions about what to practice, then observe subsequent results. The tagline states the intended journey; the current app does not yet diagnose weaknesses, prescribe practice or demonstrate score improvement. V1 earns trust through reliable tracking and honest descriptive analytics.

## Primary users and problems

Primary discovery segment: US amateur golfers who typically report gross 18-hole scores between 90 and 110. This is a targeting hypothesis, not an estimate of segment size. Do not convert nine-hole scores into this segment by doubling them. Include occasional nine-hole players in research and keep their statistics separate.

Users may want to break 100 or 90, putt more consistently, reduce penalties or make practice more purposeful. Break 80 is a later goal option, not a reason to broaden the initial target. Penalty reduction is a user need, but current data does not record penalties and cannot identify them.

Problem hypotheses: recording scores does not always reveal what to practice; dense statistics may be hard to interpret; recording detailed shot data may take more effort than some golfers want; recommendations may not lead to repeatable practice. No interviews have yet substantiated these assumptions for FAIRWAY IQ.

## Value proposition and improvement loop

| Stage | Intended user value | Evidence boundary |
| --- | --- | --- |
| TRACK | Keep real full/partial rounds safely under the user's account | Implemented local/backend slice; cross-device/native release acceptance still needs explicit evidence |
| ANALYZE | See scoring and putting summaries with clear filters, denominators and missing-data states | Home and basic Analytics share acknowledged complete-round summaries; native acceptance of the new screen is pending |
| PRACTICE | Choose one justified priority and a short, reviewed activity | V1.2 proposal, not current functionality |
| IMPROVE | Compare later eligible records with a personal baseline | Descriptive comparisons first; no guaranteed or causally attributed improvement |

Only store additional fields when a later approved feature needs them. Score/putt counts alone cannot establish that putting, driving or penalties are the main cause of high scores. Offer an observation or a user-chosen focus when the data cannot support a diagnosis.

## Positioning and differentiation hypotheses

Basic score tracking, statistics and an AI label are not unique advantages. Existing products already combine these, and some explicitly connect weaknesses to instruction. See the sourced [competitive analysis](COMPETITIVE_ANALYSIS.md); it is not a hands-on product ranking.

- H1: the 90–110 segment will prefer a short, clear next-action journey over more feature breadth. Test comprehension and choice against the user's current workflow, not an invented competitor experience.
- H2: a useful starting journey can work without mandatory new hardware or shot-by-shot capture. Test whether the information is actionable enough despite its limits; do not claim competitors all require hardware.
- H3: explicit evidence, small samples and missing-data explanations will build trust. Test whether users understand both the observation and what it cannot establish.
- H4: linking an opted-in practice commitment to later records will encourage continued use. Competitors already address this area; the hypothesized advantage is execution and segment fit, not category invention.

Invalidate or narrow these hypotheses when behavior does not support them. Do not promise lower scores, official handicaps, unique AI, market leadership or validated switching demand.

## Success metrics and measurement policy

These are proposed definitions, not collected results or industry benchmarks. Begin with consented pilot observation/manual logs; no analytics SDK is requested by this document.

| Metric | Definition and denominator | Phase |
| --- | --- | --- |
| First-round activation | New pilot accounts with a first server-acknowledged round within 14 days / all new enrolled pilot accounts; report who had a golf opportunity separately | V1 |
| Record reliability | Acknowledged submissions retrievable with identical scores; count attempted, failed, pending and retried submissions separately | V1 technical gate |
| Analysis comprehension | Participants who correctly explain a shown real-data summary and its sample size / participants completing the task | V1 usability |
| Repeat-use signal | Enrolled activated users with a second acknowledged round and analysis view within 30 days / all activated enrolled users; report opportunity/seasonality without silently excluding dropouts | V1 pilot |
| Practice follow-through | Completed planned sessions / accepted practice plans, with cancellations/missing reports retained | V1.2 |
| Observed performance change | Within-person score/putt changes for like-length complete rounds, with sample counts, course caveats and missing records | V1.1 onward; descriptive, not proof of product causality |
| Trust/safety | Unsupported-statistic, cross-account disclosure and false-save incidents; investigate each rather than averaging away severe failures | All phases |

Proposed pilot targets and explicit go/revise rules are in [MARKET_VALIDATION_PLAN.md](MARKET_VALIDATION_PLAN.md). No active-user, revenue, conversion or score-reduction result is claimed.

## Product and architecture principles

Preserve premium, minimal, fast, intuitive, professional, data-driven and motivating behavior. Existing tokens remain background #000000, surface #141414, accent #B8F28B, text #FFFFFF and secondary #A1A1AA. Maintain information hierarchy, accessible controls and reduced-motion support; animations must help a task. No screen redesign occurs in this strategy update.

Keep React Native/Expo/TypeScript, React/Vite/Tailwind, FastAPI and PostgreSQL/SQLAlchemy/Alembic. Preserve opaque access/refresh sessions and SecureStore token handling. PostgreSQL acknowledged records are the account record; device drafts and pending copies are clearly distinguished. Legacy preview records are not silently imported. Account privacy and reliable records come before coaching sophistication.

V1 is a controlled invited mobile pilot with a reproducible demonstrator, not unrestricted public registration or a second authenticated web app. The web remains an honest landing/demo. Goals, practice, AI, GPS and tournaments follow the [versioned roadmap](PRODUCT_ROADMAP.md), not a rebuild of working functionality.
