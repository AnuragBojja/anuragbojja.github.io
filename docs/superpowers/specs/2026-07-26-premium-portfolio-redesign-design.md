# Premium Portfolio Redesign — Design Spec

Date: 2026-07-26

## Overview

Redesign the visual look and layout of the portfolio (currently `index.html` / `style.css` / `script.js`) to feel more premium, while keeping it a dependency-free static site that deploys directly to GitHub Pages. All content (copy, project details, experience, skills) stays as-is — this is a visual/layout/interaction redesign only.

The new version is built as a **separate set of files** (`main.html`, `main.css`, `main.js`) so it can be tested locally without touching the live `index.html`. Once approved, `main.*` replaces `index.*` (or `index.html` is repointed) to go live.

## Goals

- Feel premium: editorial typography + restrained glassmorphism, not the current saturated dark-glow look.
- Light mode by default, with a dark mode toggle (user-controlled, not OS-driven).
- Keep zero build tooling — plain HTML/CSS/JS, no framework, no bundler.
- Add depth/motion (tilt, parallax, scroll-driven effects) without hurting performance or accessibility.
- Preserve all existing content, links, and information architecture (section order: Home → About → Experience → Projects → Skills → Contact).

## Non-Goals

- No framework migration (React/Next considered and explicitly rejected in favor of static HTML/CSS/JS).
- No content rewrites (copy, project descriptions, skills stay the same).
- No backend/contact-form service — mailto fallback behavior stays.

## Design System

### Color palettes

Two full palettes, swapped via a `data-theme="light"|"dark"` attribute on `<html>`.

**Light (default):**
- Background: `#fbfbfd` (near-white, not stark white)
- Ink (primary text): `#0b0f19`
- Muted text: `rgba(11,15,25,0.65)`
- Hairline border: `rgba(11,15,25,0.08)`
- Glass surface: `rgba(255,255,255,0.6)` + `backdrop-filter: blur(...)`, sitting over a faint gradient wash (not a saturated one)

**Dark (toggle):**
- Background: existing `#070a14` → `#0b1020` gradient
- Text: existing `rgba(255,255,255,0.92)` / muted `rgba(255,255,255,0.72)`
- Glass surface: existing `rgba(255,255,255,0.06)` + border `rgba(255,255,255,0.14)`

**Accent (shared, both modes):**
- Gradient trio kept from current site: violet `#6d28d9`, teal `#14b8a6`, sky `#38bdf8`
- Used sparingly: glass-card glow edges, button gradients, timeline progress line, hover highlights, links — not as a full-page background wash like the current site.

### Typography

- Body/UI text: Inter (already in use), weights 300–700.
- Display font: one serif added for hero name and section titles only (Fraunces or Newsreader — final pick made during implementation based on how it renders). Inter is used everywhere else. This sans/serif pairing is the main lever pushing the look from "clean SaaS" toward "editorial premium."

### Shape & spacing

- Keep the existing spacing scale and radius tokens (`--radius`, `--radius2`, `--s8`…`--s72`) as a base; adjust values only where the new layout needs it (e.g., bento grid tiles).

### Theme toggle

- Sun/moon icon button in the header (next to nav / resume link).
- Defaults to **light** for first-time visitors, regardless of OS `prefers-color-scheme`.
- Persists user choice in `localStorage` (e.g., key `theme`).
- Smooth ~200ms cross-fade transition on toggle, via CSS `transition` on color/background/border properties (not an instant snap).

## Layout Changes By Section

### Header / Nav
- Restyle only: sticky glass header, refined for light mode (currently only styled for dark). Add the theme-toggle button.

### Hero — reworked
- Left column: serif display name + tagline, more negative space, editorial feel.
- Right column: glass profile card retained, refined glass treatment, subtle mouse-tracked tilt (~4–6° max perspective shift). Stat cards get a soft floating-shadow look.
- Background: current saturated orbs replaced with a calmer gradient-mesh + faint grain texture.

### About — restyled only
- Same two-column grid and content structure. Reskin with new color system, serif section title, glass cards, hairline borders. No structural change.

### Experience — reworked
- Timeline gets a scroll-driven progress line: the connecting rail visually fills in as the user scrolls past each role (using `IntersectionObserver` / scroll position, not a heavy scroll-jacking library).
- Cards restyled with glass treatment consistent with the rest of the site.

### Projects — reworked into a bento grid
- Flagship project (10-Layer IaC Architecture) spans a large 2-column tile.
- Kubernetes project takes a medium tile.
- Remaining two projects (Multi-Cloud, NLP) sit as smaller tiles below.
- Cards: glass surface, mouse-tracked tilt, subtle image zoom on hover.

### Skills — restyled only
- Same 4-card tier-grid structure. Reskin with glass cards, hairline borders, updated tier-label colors matching new accent usage.

### Contact — restyled only
- Same structure. Reskin as a clean, editorial "let's talk" block with serif heading and a glass action card.

### Footer
- Restyle only, consistent with new palette.

## Motion & Interaction System

Combines "subtle polish" and "noticeable depth" per approved direction, with performance as a hard constraint:

- **Scroll reveals:** keep existing `IntersectionObserver`-based fade/slide-up reveal pattern already in `script.js`.
- **Card tilt-on-hover:** mouse-tracked 3D perspective tilt on hero profile card and project cards, implemented via `transform` only (translate/rotate), updated with `requestAnimationFrame`, throttled to pointer movement — never triggers layout/reflow.
- **Parallax:** hero background gradient-mesh shifts subtly on scroll, driven by `transform: translate3d(...)` tied to scroll position (rAF-throttled), not `background-position` (which is layout-expensive).
- **Scroll-driven timeline progress:** rail fill controlled by `IntersectionObserver` thresholds per timeline item, animated via `transform: scaleY()`.
- **Theme toggle transition:** CSS `transition` on custom properties/colors, ~200ms.
- **Accessibility/performance guardrails:**
  - All motion respects `prefers-reduced-motion: reduce` — tilt/parallax/scroll-progress effects are disabled (falls back to the static/subtle-only look) when set.
  - Animations only ever touch `transform` and `opacity` (GPU-accelerated, no layout thrash).
  - Pointer-move handlers are rAF-throttled, not fired raw on every `mousemove` event.
  - No new external libraries (no Framer Motion, no GSAP) — hand-rolled with vanilla JS to keep the zero-dependency, zero-build nature of the site intact.

## Technical / File Plan

- New files: `main.html`, `main.css`, `main.js` — built alongside the existing `index.html`, `style.css`, `script.js`, which remain untouched and live until the redesign is approved.
- Reuses existing image assets (`profile.jpeg`, `roboshop-*.png`, `food-delivery.png`, `nlp-pipeline.png`, `favicon.svg`) — no new assets required.
- Local testing: serve the folder with any static file server (e.g. `python -m http.server` or VS Code Live Server) and open `main.html` — needed because `fetch`/module-relative behavior and font loading are more reliable over `http://` than `file://`.
- Migration to go live: once approved, replace `index.html`/`style.css`/`script.js` contents with `main.*` (or repoint), then commit. No separate build/deploy step required — GitHub Pages serves the static files directly.

## Open Items For Implementation

- Final serif font choice (Fraunces vs. Newsreader) — decide by rendering both against the hero and picking on look, not upfront.
- Exact bento-grid tile proportions for the Projects section — tuned visually during implementation, not fully dimensioned in this spec.
