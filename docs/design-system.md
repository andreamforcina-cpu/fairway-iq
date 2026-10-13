# FAIRWAY IQ design system

The first increment covers the homepage only. The backend is unchanged.

## Foundation

Tokens live in `frontend/src/index.css`. Forest green (`--color-primary`) anchors the identity, warm ivory (`--color-paper`) provides the page background, and lime (`--color-accent`) accents golf visuals. Use `--color-ink`, `--color-muted`, and `--color-border` for text and boundaries. Radius and spacing tokens provide reusable foundations.

Typography uses a local system sans-serif stack, with a Georgia italic accent in the homepage headline. No external fonts or new dependencies are required.

## Reusable patterns

`frontend/src/App.css` defines containers, buttons, text links, eyebrow labels, section headings, cards, and status badges. The `Brand` component in `App.tsx` shares the logo between header and footer. Extract patterns into dedicated components when subsequent approved pages need them.

## Responsive and accessible behavior

Layouts stack below 760px, with an additional compact dashboard adjustment below 380px. The mobile menu exposes its expanded state. A skip link, visible keyboard focus, labeled round selector, semantic landmarks, and reduced-motion support are included.

## Homepage scope

Navigation stays within homepage sections. The interactive performance preview is explicitly sample data and does not imply a live analytics integration. The existing FAIRWAY IQ identity, platform description, and Frontend Online indicator remain available.

## Validation

`npm run build` passes TypeScript and Vite production compilation. Browser and device rendering still need visual review. Other pages require user approval before implementation.
