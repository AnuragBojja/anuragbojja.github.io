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
- About Me is a **curated pitch**, not a data dump — final bio copy comes from `docs/superpowers/specs/portfolio.md` (user-authored content source); this spec defines where that content lives structurally.

## Non-Goals

- No framework migration (plain HTML/CSS/JS only).
- No backend/contact-form service — mailto fallback stays.
- Not writing any content copy — all copy (About, Experience, Education, Projects) is transcribed verbatim (structured into JSON) from the user's `docs/superpowers/specs/portfolio.md`, which supersedes the equivalent copy currently in `index.html`.

## Information Architecture

No top header. The bottom island is the only navigation, always visible, on both desktop and mobile:

**Home · Experience · Projects · Resume · Contact** — plus a theme toggle (sun/moon) as the last island item.

- **Home** is a dashboard of cards (see layout below). It contains the full About Me content (bio, focus areas, education, quick links) directly — About is **not** a separate tab; it lives as a card on Home. **Skills has no dedicated tab or card at all** — skill/tool knowledge is conveyed entirely through the `tags` already attached to each Experience and Project entry, rendered as tag-rows on those two tabs.
- **Experience**, **Projects**, **Resume**, **Contact** are full tab views, switched via client-side routing (see Architecture).

## Architecture

**Single-page app, hash-routed, client-side rendered from JSON** (approved approach):

- One shell: `index.html` (island nav + empty tab-panel containers) + `app.css` + `app.js`.
- `app.js` fetches all six `/data/*.json` files in parallel on load, then renders each tab's DOM from templates using that data.
- Tabs are `<section>` panels toggled by `location.hash` (`#home`, `#experience`, `#projects`, `#resume`, `#contact`); island links are plain `<a href="#experience">` anchors — back/forward and direct deep-links work.
- Switching tabs crossfades/slides the panel (opacity + translateY, CSS transition) — instant swap when `prefers-reduced-motion: reduce`.
- No build step; GitHub Pages serves the static files directly.

## Data Layer (`/data/*.json`)

- **`profile.json`** — name, title/tagline, location, email, phone, GitHub URL, LinkedIn URL, resume URL, "currently seeking" line, hero lead paragraph, bio paragraph(s), "What I'm Focused On" bullet list, hero stat facts (years experience, cloud focus, publication).
- **`education.json`** — array of `{school, degree, dates, location, coursework: []}`.
- **`experience.json`** — array of `{role, company, location, startDate, endDate, bullets: [], tags: [], featured: bool}`, newest first. The `featured` entry (defaults to index 0) drives the Home "Career Glimpse" card. `tags` carries the skills/tools used in that role — again, the only place skills info lives for this entry.
- **`projects.json`** — array of `{title, badge, image, description, bullets: [], tags: [], links: [{label, url}], size: "large"|"medium"|"small", featured: bool}`. `size` drives bento-tile span on the Projects tab; the `featured` entry drives the Home "Architecture Spec" card. `tags` is also the sole carrier of skills/tools info for this entry — there is no separate skills data file.
- **`contact.json`** — email, phone, location, socials — reused by the Home "Get in Touch" card and the full Contact tab.

## Visual Design System

The reference screenshot is the literal visual target for **both** light and dark mode (not just a layout reference):

- **Background:** soft near-white (light) with a faint dotted/grain texture; matching deep near-navy (dark).
- **Cards:** glass surface, ~20–24px radius, soft diffused shadow, thin hairline border — no saturated gradient wash behind them.
- **Accent:** indigo/violet (kept close to current `#6d28d9`), used for the active-nav pill, small-caps eyebrow labels (`BIO SPECS`, `CAREER GLIMPSE`, `ARCHITECTURE SPEC`, `GET IN TOUCH`), link text, and card icon accents. Existing teal/sky used sparingly as secondary decorative accents (card glows, tags), not a full-page wash.
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
3. **About Me card** (full-width or 2-column block, sits below hero row): bio paragraph(s), "Currently seeking" line, quick-link row (GitHub / LinkedIn / Email / Resume), then mini sub-cards: **What I'm Focused On**, **Education Glimpse** (school, degree, dates, coursework). This is where "impress the viewer" copy lives — content sourced verbatim from `portfolio.md` into `profile.json` + `education.json`.
4. **Career Glimpse card:** current/featured role + company + date badge + 2-line summary + "Open Career Timeline →" link to the Experience tab.
5. **Architecture Spec card:** featured project name + 1–2 line summary + "Read Spec Sheets ↗" link to the Projects tab.
6. **Get In Touch card:** short invite line + "Open Message Form →" link to the Contact tab.

No Skills/Core Stack card on Home — skills are only ever shown via tag-rows on the Experience and Projects tabs, never aggregated into their own section.

## Tab Views

- **Experience:** full timeline, all entries from `experience.json`, scroll-driven progress rail (`IntersectionObserver`, fills via `transform: scaleY()` as user scrolls past each item), cards restyled to the new glass system. Scrolls internally within the tab if content exceeds viewport height.
- **Projects:** bento grid from `projects.json` — **3 entries only** (10-Layer IaC Architecture: large; Kubernetes Orchestration & Helm: medium; Multi-Cloud IaaS/PaaS: small), using each entry's `size` field. The NLP/Springer publication is **not** a project tile — it's referenced only via the About Me card and Education sub-card on Home (both already mention it in `portfolio.md`), each linking out to the Springer publication URL. Mouse-tracked tilt-on-hover + image zoom on hover (transform-only, rAF-throttled).
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
- New: `/data/profile.json`, `/data/education.json`, `/data/experience.json`, `/data/projects.json`, `/data/contact.json`.
- New: `/assets/` directory — all raster images (`profile.jpeg`, `roboshop-terraform.png`, `roboshop-ansible.png`, `roboshop-shell.png`, `roboshop-k8s.png`, `food-delivery.png`, `nlp-pipeline.png`) move here from the repo root. `favicon.svg` stays at the repo root (standard favicon convention; also not a png/jpg). Every `image` path in `projects.json` and the profile photo reference in `profile.json` point at `./assets/...`.
- `docs/superpowers/specs/portfolio.md` (user-authored) is the **content source** for all copy, not a deployed file — its content is transcribed into `profile.json`, `education.json`, `experience.json`, and `projects.json`.
- Local testing: serve the folder with a static file server (e.g. `python -m http.server`) and open `index.html` — required because `fetch()` of the JSON files needs `http://`, not `file://`.
- Deployment: no build step; GitHub Pages serves the static files directly from the repo root once committed.

## Open Items For Implementation

- Exact bento-grid tile proportions (Home dashboard and Projects tab) — tuned visually during implementation.
- About Me final copy is now resolved — sourced from `portfolio.md` (supersedes the current `index.html` About content, e.g. new title "DevOps · Cloud · SRE Engineer" replaces "DevSecOps & Cloud Engineer", new phone number, new "currently seeking" line).
- `portfolio.md`'s "Skills Snapshot" (Cloud & Infrastructure, Security, Containers, CI/CD, Languages, Databases) has no standalone section anymore. During implementation, fold each of those skill tags into the `tags` array of whichever `experience.json`/`projects.json` entry they're actually associated with (e.g. Kubernetes/Helm tags → the K8s project and the DevOps Engineer role; the newer languages like JavaScript/Node.js → wherever they're actually used), rather than dropping any of them.
