# Portfolio Dashboard Redesign — Design Spec

Date: 2026-07-26

**Supersedes:** `2026-07-26-premium-portfolio-redesign-design.md`. That spec assumed a scrolling one-page redesign; this spec replaces it with a non-scrolling, tab-based dashboard app, per updated direction from a reference screenshot (friend's portfolio).

## Overview

Rebuild the portfolio (`index.html` / `style.css` / `script.js`) as a **non-scrolling, dashboard-style single page app**: a bento-card "Home" dashboard plus a floating bottom "island" nav that switches between full tab views (Experience, Projects, Resume, Contact) without page reloads. All personal content (dates, companies, project details, skills, bio) moves out of HTML and into a `/data/*.json` folder that acts as the single source of truth — editing a JSON file is the only way to change site content going forward.

Stays a dependency-free static site with zero build tooling, deployed as-is to GitHub Pages.

## Goals

- Non-scrolling dashboard home (bento cards), reached via a floating bottom nav island — matching the reference screenshot's structure and visual style.
- Content-as-data: every fact about Anurag (experience, education, projects, skills, contact, bio) lives in versioned JSON files under `/data`, never hardcoded in HTML/JS.
- Light mode by default, user-controlled dark mode toggle (part of the island), persisted in `localStorage`.
- Fully responsive: desktop and mobile.
- Keep zero build tooling — plain HTML/CSS/JS, no framework, no bundler, no server.
- About Me is a **curated pitch**, not a data dump — final bio copy will come from a separate `aboutme.md` the user is authoring; this spec defines where that content lives structurally, not its final wording.

## Non-Goals

- No framework migration (plain HTML/CSS/JS only).
- No backend/contact-form service — mailto fallback stays.
- No rewriting of Experience/Projects/Skills copy — that content is carried over as-is into JSON.
- Not writing the About Me copy itself — placeholder/current copy goes into `profile.json` until the user supplies `aboutme.md`, at which point only that JSON file needs updating.

## Information Architecture

No top header. The bottom island is the only navigation, always visible, on both desktop and mobile:

**Home · Experience · Projects · Resume · Contact** — plus a theme toggle (sun/moon) as the last island item.

- **Home** is a dashboard of cards (see layout below). It contains the full About Me content (bio, philosophy, how-I-work, education, quick links) directly — About is **not** a separate tab, and Skills is **not** a separate tab. Both live as cards on Home.
- **Experience**, **Projects**, **Resume**, **Contact** are full tab views, switched via client-side routing (see Architecture).

## Architecture

**Single-page app, hash-routed, client-side rendered from JSON** (approved approach):

- One shell: `index.html` (island nav + empty tab-panel containers) + `app.css` + `app.js`.
- `app.js` fetches all six `/data/*.json` files in parallel on load, then renders each tab's DOM from templates using that data.
- Tabs are `<section>` panels toggled by `location.hash` (`#home`, `#experience`, `#projects`, `#resume`, `#contact`); island links are plain `<a href="#experience">` anchors — back/forward and direct deep-links work.
- Switching tabs crossfades/slides the panel (opacity + translateY, CSS transition) — instant swap when `prefers-reduced-motion: reduce`.
- No build step; GitHub Pages serves the static files directly.

## Data Layer (`/data/*.json`)

- **`profile.json`** — name, title/tagline, location, email, phone, GitHub URL, LinkedIn URL, resume URL, hero lead paragraph, bio paragraph(s), "Engineering Philosophy" blurb, "How I Work" blurb, hero stat facts (years experience, cloud focus, publication).
- **`education.json`** — array of `{school, degree, dates, location, coursework: []}`.
- **`experience.json`** — array of `{role, company, location, startDate, endDate, bullets: [], tags: [], featured: bool}`, newest first. The `featured` entry (defaults to index 0) drives the Home "Career Glimpse" card.
- **`projects.json`** — array of `{title, badge, image, description, bullets: [], tags: [], links: [{label, url}], size: "large"|"medium"|"small", featured: bool}`. `size` drives bento-tile span on the Projects tab; the `featured` entry drives the Home "Architecture Spec" card.
- **`skills.json`** — array of `{category, tiers: [{label, items: []}]}` — full nested tier data preserved here for future use, even though Home only renders a condensed flat list (see below).
- **`contact.json`** — email, phone, location, socials — reused by the Home "Get in Touch" card and the full Contact tab.

## Visual Design System

The reference screenshot is the literal visual target for **both** light and dark mode (not just a layout reference):

- **Background:** soft near-white (light) with a faint dotted/grain texture; matching deep near-navy (dark).
- **Cards:** glass surface, ~20–24px radius, soft diffused shadow, thin hairline border — no saturated gradient wash behind them.
- **Accent:** indigo/violet (kept close to current `#6d28d9`), used for the active-nav pill, small-caps eyebrow labels (`BIO SPECS`, `CAREER GLIMPSE`, `ARCHITECTURE SPEC`, `CORE STACK`, `GET IN TOUCH`), link text, and card icon accents. Existing teal/sky used sparingly as secondary decorative accents (card glows, tags), not a full-page wash.
- **Typography:** Inter throughout (no serif addition — the reference uses bold sans, not editorial serif). Hero headline in heaviest weight (800/900), tagline in medium-weight accent color, section eyebrow labels uppercase/letter-spaced/colored, body text in regular/medium weights.
- **Icons:** simple line icons (1.5px stroke) for island nav items (home, briefcase, folder, mail, sun/moon) and card corner glyphs, matching the reference's icon style.
- **Island nav:** pill-shaped, floating, centered at the bottom of the viewport, fixed position, glass background with soft shadow; active tab shown as a filled/tinted pill with a small dot indicator under its label (as in the reference).

### Theme toggle

- Sun/moon icon, last item in the island.
- Defaults to **light** for first-time visitors regardless of OS `prefers-color-scheme`.
- Persists choice in `localStorage` (key `theme`).
- ~200ms CSS transition cross-fade on toggle.

## Home Dashboard Layout

A bento-style card grid (2–3 columns desktop, stacks to 1 column on mobile):

1. **Hero card** (large, spans ~2/3 width): eyebrow badge, bold headline (role/title), colored tagline, short lead paragraph, primary CTAs.
2. **Bio card** (right column): name, email, phone, location — condensed contact block.
3. **About Me card** (full-width or 2-column block, sits below hero row): bio paragraph(s), quick-link row (GitHub / LinkedIn / Email / Resume), then three mini sub-cards: **Engineering Philosophy**, **How I Work**, **Education** (school, degree, dates, coursework). This is where "impress the viewer" copy lives — content sourced from `profile.json` + `education.json`, final wording to come from the user's `aboutme.md`.
4. **Career Glimpse card:** current/featured role + company + date badge + 2-line summary + "Open Career Timeline →" link to the Experience tab.
5. **Architecture Spec card:** featured project name + 1–2 line summary + "Read Spec Sheets ↗" link to the Projects tab.
6. **Core Stack card:** condensed flat list of top-tier skill chips across categories (curated highlights, e.g. 8–10 chips), **not** the full nested tier breakdown — the full detail remains in `skills.json` for the data layer even though Home doesn't render all of it (avoids cluttering the dashboard).
7. **Get In Touch card:** short invite line + "Open Message Form →" link to the Contact tab.

## Tab Views

- **Experience:** full timeline, all entries from `experience.json`, scroll-driven progress rail (`IntersectionObserver`, fills via `transform: scaleY()` as user scrolls past each item), cards restyled to the new glass system. Scrolls internally within the tab if content exceeds viewport height.
- **Projects:** bento grid from `projects.json` — flagship project spans a large 2-column tile, next spans medium, remaining sit as smaller tiles, using each entry's `size` field. Mouse-tracked tilt-on-hover + image zoom on hover (transform-only, rAF-throttled).
- **Resume:** embeds `https://anuragbojja.github.io/Resume/` in an `<iframe>` within the tab, with an "Open in new tab" fallback button above it.
- **Contact:** quick-action buttons (Email / LinkedIn / GitHub) + location line, from `contact.json`; mailto fallback behavior unchanged from current site.

## Motion & Interaction System

- **Tab switching:** crossfade/slide between panels via CSS transition on `transform`/`opacity`; instant swap under `prefers-reduced-motion: reduce`.
- **Card tilt-on-hover:** mouse-tracked 3D tilt (hero/bio card, project cards), `transform`-only, `requestAnimationFrame`-throttled — disabled under reduced motion.
- **Scroll-driven timeline progress:** Experience tab rail fill via `IntersectionObserver` + `transform: scaleY()`.
- **Reveal-on-render:** cards fade/slide in when a tab is opened (reusing the existing `IntersectionObserver` reveal pattern from `script.js`), not a full-page scroll reveal since there's no page scroll anymore.
- **Guardrails:** animations touch only `transform`/`opacity`; no external motion libraries; all effects respect `prefers-reduced-motion`.

## Responsive / Mobile

- Island nav: icon + label pills on desktop; on narrow screens (<480px) collapses to icon-only pills with an `aria-label` per icon for accessibility, plus a small caption shown only under the currently-active icon, staying fixed at the bottom.
- Home dashboard grid: 2–3 columns desktop → 1 column stacked on mobile, in the same reading order listed above.
- Bento project grid: collapses to a single column, largest/featured project first.
- Tab content area fills the viewport between the (removed) header and the fixed island; internal scrolling within a tab is expected and fine when content overflows — this is distinct from the old whole-page scroll that's being removed.

## Technical / File Plan

- Replace in place: `index.html`, `style.css` → `app.css`, `script.js` → `app.js`. Git history is the safety net (working tree is clean; no parallel `main.*` files needed this time, since this design is already fully approved).
- New: `/data/profile.json`, `/data/education.json`, `/data/experience.json`, `/data/projects.json`, `/data/skills.json`, `/data/contact.json`.
- Reuses existing image assets (`profile.jpeg`, `roboshop-*.png`, `food-delivery.png`, `nlp-pipeline.png`, `favicon.svg`) — no new assets required.
- `aboutme.md` (user-authored, at repo root or docs/ — exact location up to the user) is a **content source**, not a deployed file; once available, its content is transcribed into `profile.json`'s bio/philosophy/how-I-work fields.
- Local testing: serve the folder with a static file server (e.g. `python -m http.server`) and open `index.html` — required because `fetch()` of the JSON files needs `http://`, not `file://`.
- Deployment: no build step; GitHub Pages serves the static files directly from the repo root once committed.

## Open Items For Implementation

- Exact bento-grid tile proportions (Home dashboard and Projects tab) — tuned visually during implementation.
- Final curated skill-chip list for the Home "Core Stack" card — pick top ~8–10 across categories during implementation (from existing `skill_grid` content), adjustable once `skills.json` exists.
- About Me final copy — pending the user's `aboutme.md`; current About content from `index.html` is used as interim placeholder in `profile.json`/`education.json` until then.
