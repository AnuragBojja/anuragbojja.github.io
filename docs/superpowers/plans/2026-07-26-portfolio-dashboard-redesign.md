# Portfolio Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current scrolling one-page portfolio (`index.html`/`style.css`/`script.js`) with a non-scrolling dashboard app: a bento-card Home view plus a floating bottom "island" nav that switches between Experience/Projects/Resume/Contact tab views, with all content sourced from `/data/*.json`.

**Architecture:** Single-page app, zero build tooling. One `index.html` shell + native ES modules under `/js/*.mjs` (browsers load them via `<script type="module">`, no bundler) + one `app.css`. `js/main.mjs` fetches all `/data/*.json` on load, renders each tab from small pure render functions, and a hash router (`#home`/`#experience`/`#projects`/`#resume`/`#contact`) toggles which `<section>` panel is visible. Pure logic (router, theme, helpers, data aggregation, render-to-string functions) lives in its own `.mjs` file and is unit-tested with Node's built-in `assert` (`node js/__tests__/x.test.mjs` — no npm install, no test framework dependency, nothing shipped to the browser that isn't already used at runtime). DOM-wiring and visual/motion work (tilt, scroll-rail, responsive layout) has no automated test harness available in this repo, so those tasks get an explicit manual verification checklist instead — call this out, don't fake an automated test for it.

**Tech Stack:** Plain HTML/CSS/JS (native ES modules), Inter font (existing Google Fonts link), no framework, no bundler, no npm. Node.js v20 (already installed) used only to run standalone unit-test scripts against the `.mjs` logic modules — never shipped to the site. Python's `http.server` used for local static-file preview (required because `fetch()` of local JSON needs `http://`, not `file://`).

## Global Constraints

- Zero build tooling: no bundler, no framework, no npm install/package.json. (spec: Non-Goals)
- Light mode is the default for first-time visitors regardless of OS `prefers-color-scheme`; theme choice persists in `localStorage` under key `theme`. (spec: Theme toggle)
- No top header — the bottom island is the only navigation on desktop and mobile. (spec: Information Architecture)
- Tabs: exactly `Home · Experience · Projects · Resume · Contact` plus a theme toggle, in that order. (spec: Information Architecture)
- No standalone Skills tab or card anywhere — skill/tool info lives only in the `tags` array on `experience.json`/`projects.json` entries, rendered as tag-rows. (spec: Information Architecture, Home Dashboard Layout)
- Projects tab has exactly 3 entries (10-Layer IaC: large, Kubernetes: medium, Multi-Cloud: small). The NLP/Springer publication is never a project tile — only referenced from the Home About Me card / Education. (spec: Tab Views)
- All animation touches only `transform`/`opacity`, is `requestAnimationFrame`-throttled where pointer-driven, and is disabled/instant under `prefers-reduced-motion: reduce`. (spec: Motion & Interaction System)
- All content (bio, experience, education, projects, contact) is transcribed from `docs/superpowers/specs/portfolio.md`, not invented or left as the old `index.html` copy. (spec: Non-Goals)
- Images live under `/assets/`; `favicon.svg` stays at repo root. (spec: Technical/File Plan)
- Resume tab embeds `https://anuragbojja.github.io/Resume/` in an `<iframe>` with an "open in new tab" fallback. (spec: Tab Views)

---

### Task 1: Move images into `/assets`

**Files:**
- Create: `assets/` (directory)
- Modify (move): `profile.jpeg` → `assets/profile.jpeg`, `roboshop-terraform.png` → `assets/roboshop-terraform.png`, `roboshop-ansible.png` → `assets/roboshop-ansible.png`, `roboshop-shell.png` → `assets/roboshop-shell.png`, `roboshop-k8s.png` → `assets/roboshop-k8s.png`, `food-delivery.png` → `assets/food-delivery.png`, `nlp-pipeline.png` → `assets/nlp-pipeline.png`
- Leave in place: `favicon.svg` (repo root)

**Interfaces:**
- Produces: every later task references images at `./assets/<name>` (used in `data/profile.json`'s `avatar` field and `data/projects.json`'s `image` fields in Tasks 2–3).

- [ ] **Step 1: Create the directory and move the files with git mv (preserves history)**

```bash
mkdir assets
git mv profile.jpeg assets/profile.jpeg
git mv roboshop-terraform.png assets/roboshop-terraform.png
git mv roboshop-ansible.png assets/roboshop-ansible.png
git mv roboshop-shell.png assets/roboshop-shell.png
git mv roboshop-k8s.png assets/roboshop-k8s.png
git mv food-delivery.png assets/food-delivery.png
git mv nlp-pipeline.png assets/nlp-pipeline.png
```

- [ ] **Step 2: Verify no file references the old root-level paths anymore**

Run: `grep -rn "\"\./roboshop-\|\"\./profile.jpeg\|\"\./food-delivery.png\|\"\./nlp-pipeline.png" --include="*.html" --include="*.json" --include="*.mjs" .`
Expected: no matches yet (the old `index.html` still has `./profile.jpeg` etc. — that's fine, `index.html` itself gets replaced in Task 6; this check just confirms the images physically moved and nothing *new* references the old paths).

Run: `ls assets/`
Expected: `food-delivery.png  nlp-pipeline.png  profile.jpeg  roboshop-ansible.png  roboshop-k8s.png  roboshop-shell.png  roboshop-terraform.png`

- [ ] **Step 3: Commit**

```bash
git add -A assets
git commit -m "Move image assets into assets/ directory"
```

---

### Task 2: Author identity data — `profile.json`, `education.json`, `contact.json`

**Files:**
- Create: `data/profile.json`
- Create: `data/education.json`
- Create: `data/contact.json`

**Interfaces:**
- Produces: the exact JSON shapes below are what every render function in Tasks 8–14 destructures. Field names here are final — later tasks must match them exactly (`profile.bio` is an array of paragraphs, `profile.focusAreas` is an array of strings, `profile.stats` is an array of `{label, value}`, `education[].coursework` is an array of strings).

- [ ] **Step 1: Create `data/profile.json`**

```json
{
  "name": "Anurag Bojja",
  "title": "DevOps · Cloud · SRE Engineer",
  "tagline": "Automated end-to-end. Secure by default. Repeatable everywhere.",
  "location": "Los Angeles, CA",
  "locationNote": "Open to remote and relocation anywhere in the US",
  "email": "anuragbojja23@gmail.com",
  "phone": "+1 414-275-9169",
  "github": "https://github.com/AnuragBojja",
  "linkedin": "https://www.linkedin.com/in/anurag-bojja-81a405192/",
  "resumeUrl": "https://anuragbojja.github.io/Resume/",
  "currentlySeeking": "DevOps Engineer · Cloud Engineer · Site Reliability Engineer roles",
  "avatar": "./assets/profile.jpeg",
  "heroLead": "I build cloud infrastructure the way it should be built — automated end-to-end, secure by default, and repeatable across environments. My work spans production-grade AWS infrastructure with Terraform, container orchestration with Docker and Kubernetes, and multi-cloud deployment strategies. I believe secure infrastructure isn't a feature added later — it's the foundation everything else stands on.",
  "bio": [
    "I'm a DevOps and Cloud Engineer with over two years of hands-on experience building, automating, and securing production cloud infrastructure across AWS and Azure. My work isn't about learning tools in isolation — it's about building complete systems from scratch and understanding every layer deeply.",
    "I've architected a 10-layer Terraform infrastructure that provisions an entire AWS production environment from empty account to fully deployed platform with a single command, containerized and orchestrated a 10-service polyglot microservices platform on Kubernetes with real production controls like RBAC, IRSA, and ALB Ingress, and deployed applications across multiple cloud providers to reduce single-vendor risk. Every project I take on, I rebuild myself — because there's no other way to actually understand infrastructure.",
    "Alongside my engineering work, I'm also a published NLP researcher — my sentiment analysis pipeline was peer-reviewed and published in Springer at ICDSAI 2023, giving me formal experience taking a problem from data collection through model deployment on AWS."
  ],
  "focusAreas": [
    "Building zero-touch, self-healing cloud infrastructure",
    "Container orchestration and Kubernetes production patterns",
    "Security-first automation — least-privilege, secrets management, encryption in transit",
    "CI/CD pipeline design that scales with team growth",
    "Multi-cloud resilience and disaster recovery posture"
  ],
  "publication": {
    "title": "Review Analysis Using Web Scraping in Python",
    "venue": "Springer ICDSAI 2023",
    "url": "https://link.springer.com/chapter/10.1007/978-3-031-51167-7_77"
  },
  "stats": [
    { "label": "Years Experience", "value": "2+" },
    { "label": "AWS + Azure", "value": "Multi-Cloud" },
    { "label": "Springer ICDSAI 2023", "value": "Publication" }
  ]
}
```

- [ ] **Step 2: Create `data/education.json`**

```json
[
  {
    "school": "University of Wisconsin–Milwaukee",
    "degree": "Master of Science, Computer Science",
    "dates": "Aug 2023 – May 2025",
    "location": "Milwaukee, WI",
    "description": "Pursued advanced coursework focused on cloud systems, cybersecurity, and data-intensive computing. My graduate program helped me formalize the systems-level thinking that shows up in my infrastructure work — understanding distributed systems, database internals, and security fundamentals from the theoretical side while I was building the same systems hands-on outside class.",
    "coursework": ["Cloud Computing", "Cybersecurity", "Database Systems", "Machine Learning", "Natural Language Processing", "Web Application Development"]
  },
  {
    "school": "Gandhi Institute of Technology and Management (GITAM)",
    "degree": "Bachelor of Technology, Computer Science",
    "dates": "2019 – 2023",
    "location": "Visakhapatnam, India",
    "description": "Completed undergraduate degree in Computer Science with a focus on programming fundamentals, data structures, and software engineering practices. Highlights include a published research paper (Springer ICDSAI 2023) on NLP-based sentiment analysis — a project that went from raw data collection through model training to full deployment on AWS.",
    "coursework": [],
    "publication": {
      "title": "Review Analysis Using Web Scraping in Python",
      "venue": "Springer ICDSAI 2023",
      "url": "https://link.springer.com/chapter/10.1007/978-3-031-51167-7_77"
    }
  }
]
```

- [ ] **Step 3: Create `data/contact.json`**

```json
{
  "email": "anuragbojja23@gmail.com",
  "phone": "+1 414-275-9169",
  "location": "Los Angeles, CA (Open to Remote & Relocation)",
  "socials": [
    { "label": "Email", "url": "mailto:anuragbojja23@gmail.com" },
    { "label": "LinkedIn", "url": "https://www.linkedin.com/in/anurag-bojja-81a405192/" },
    { "label": "GitHub", "url": "https://github.com/AnuragBojja" }
  ]
}
```

- [ ] **Step 4: Validate all three files are well-formed JSON**

Run: `node -e "['profile','education','contact'].forEach(f=>{JSON.parse(require('fs').readFileSync('data/'+f+'.json','utf8'));console.log(f,'OK')})"`
Expected:
```
profile OK
education OK
contact OK
```

- [ ] **Step 5: Commit**

```bash
git add data/profile.json data/education.json data/contact.json
git commit -m "Add profile, education, and contact data files"
```

---

### Task 3: Author career data — `experience.json`, `projects.json`

**Files:**
- Create: `data/experience.json`
- Create: `data/projects.json`

**Interfaces:**
- Produces: `experience.json` is an array of `{role, company, location, startDate, endDate, summary, bullets: string[], tags: string[], featured: boolean}`, newest-first, exactly one entry with `featured: true`. `projects.json` is an array of `{title, badge, image, size, featured, description, bullets: string[], tags: string[], links: {label, url}[]}`, exactly 3 entries, exactly one with `featured: true`, `size` values are `"large" | "medium" | "small"`.

This task resolves the spec's open item about folding `portfolio.md`'s aggregate "Skills Snapshot" into per-entry tags: rather than guessing which snapshot skill belongs to which role/project, each `tags` array below is taken directly from `portfolio.md`'s own per-entry **Technologies:** line (Section 2, per role) or **Stack:** line (Section 4, per project) — those are the authoritative, already-scoped skill lists, so no interpretation is needed.

- [ ] **Step 1: Create `data/experience.json`**

```json
[
  {
    "role": "Software Engineer Intern",
    "company": "Eco Servants",
    "location": "California, USA",
    "startDate": "Nov 2025",
    "endDate": "Present",
    "summary": "Contributing across a multi-language backend platform that supports environmental data collection, CSR reporting, and public-facing engagement dashboards.",
    "bullets": [
      "Backend API Development — build and maintain backend APIs across Python, Java, and PHP services, implementing endpoints, request/response handling, and data flows connecting field-collected environmental datasets to internal dashboards and the broader CSR platform.",
      "Cross-Environment Debugging — diagnose and resolve application defects across development and production environments through structured log analysis and execution tracing, reducing recurring failure patterns and improving service stability.",
      "CI/CD Workflow Maintenance — contribute to CI/CD workflows that automate builds and deployments across multiple services, enabling faster, more consistent release cycles.",
      "Code Review Discipline with AI Tooling — use AI-assisted tools like GitHub Copilot within a strict code-review workflow; every AI-suggested change is reviewed, tested, and owned before it ships."
    ],
    "tags": ["Python", "Java", "PHP", "CI/CD", "Git", "Linux", "Log Analysis", "GitHub Copilot"],
    "featured": true
  },
  {
    "role": "DevOps Engineer",
    "company": "Vesonix TechLabs",
    "location": "Hyderabad, India",
    "startDate": "Jun 2022",
    "endDate": "Aug 2023",
    "summary": "Worked on the DevOps side of a team building internal cloud applications, focusing on containerization, Kubernetes deployments, CI/CD, and AWS infrastructure.",
    "bullets": [
      "Docker Image Engineering — built and maintained Docker images for internal microservices using multi-stage builds and minimal base images, reducing image sizes and streamlining deployments.",
      "Kubernetes Workload Management — managed Kubernetes workloads in development and staging clusters, configuring Deployments, Services, and ConfigMaps, monitoring pod health, and resolving container-level failures during release cycles.",
      "CI/CD Pipeline Maintenance — maintained CI/CD pipelines in GitHub Actions, shortening feedback loops and making releases more predictable.",
      "AWS Infrastructure Configuration — configured cloud infrastructure for non-production environments on AWS, including IAM policies, security groups, and network segmentation."
    ],
    "tags": ["Docker", "Kubernetes", "GitHub Actions", "AWS", "EC2", "IAM", "Security Groups", "Linux", "Bash", "Git"],
    "featured": false
  },
  {
    "role": "Software Developer",
    "company": "Adqura Pvt. Ltd.",
    "location": "Hyderabad, India",
    "startDate": "Mar 2022",
    "endDate": "May 2022",
    "summary": "Worked as a Software Developer on backend API services, contributing to core application workflows.",
    "bullets": [
      "Backend API Development — developed backend API endpoints in Python, implementing request validation, business logic, and database integration.",
      "Automated Testing — built and maintained automated test suites covering unit and integration scenarios, improving code coverage and catching regressions earlier.",
      "Defect Resolution — resolved application defects across development and testing environments through structured log analysis and execution tracing."
    ],
    "tags": ["Python", "Backend APIs", "Unit Testing", "Integration Testing", "Log Analysis", "Git"],
    "featured": false
  }
]
```

- [ ] **Step 2: Create `data/projects.json`**

```json
[
  {
    "title": "Production Microservices Infrastructure — 10-Layer IaC Architecture",
    "badge": "Infrastructure as Code",
    "image": "./assets/roboshop-terraform.png",
    "size": "large",
    "featured": true,
    "description": "A fully automated, production-grade AWS environment for a 10-service polyglot microservices platform, built from the ground up across 10 independently state-managed Terraform layers. Every component — from the underlying VPC to the CDN distribution at the edge — is defined as code, with configuration management layered on top through Ansible roles.",
    "bullets": [
      "Designed the entire AWS network foundation with production-level isolation: VPC, public/private/database subnets across multiple AZs, IGW, NAT Gateway, and per-tier route tables.",
      "Provisioned 14 service-specific Security Groups, each with ingress/egress rules isolated into their own Terraform layer to enforce least-privilege networking and eliminate circular dependencies.",
      "Deployed an OpenVPN server inside the VPC as a secure jump point, keeping SSH and internal services off the public internet.",
      "Authored reusable Terraform modules (VPC, Security Group, Service Configuration) enabling a single parameterized module invocation for all 6 application services.",
      "Implemented public ALB hardening with wildcard ACM TLS 1.3 and a CloudFront distribution for global performance and edge encryption.",
      "Used Ansible roles with Jinja2 templates and AWS SSM Parameter Store lookups so secrets are resolved at runtime and never written to playbooks or version control.",
      "Decoupled cross-layer state through SSM Parameter Store instead of Terraform remote state, allowing independent layer updates without tight coupling."
    ],
    "tags": ["Terraform", "Ansible", "AWS", "VPC", "IGW", "NAT", "Security Groups", "EC2", "ALB", "ASG", "CloudFront", "ACM", "OpenVPN", "Route53", "SSM", "Jinja2"],
    "links": [
      { "label": "Terraform Repo", "url": "https://github.com/AnuragBojja/Terraform-RoboShop-Main" },
      { "label": "Ansible Repo", "url": "https://github.com/AnuragBojja/ansible-roboshop-roles" }
    ]
  },
  {
    "title": "Containerized Microservices Platform — Kubernetes Orchestration & Helm Packaging",
    "badge": "Containers & Orchestration",
    "image": "./assets/roboshop-k8s.png",
    "size": "medium",
    "featured": false,
    "description": "Containerized and orchestrated the same 10-service polyglot microservices platform on Kubernetes — building everything from optimized Docker images through full production-grade manifests to reusable Helm charts, the container-native evolution of the same workload deployed via Terraform + Ansible.",
    "bullets": [
      "Built optimized Docker images for all 10 services using multi-stage builds on Alpine base images, enforcing non-root execution — including resolving 6 sequential build errors for the Python/uWSGI Payment service on Alpine's musl libc.",
      "Authored full Kubernetes manifests: Deployments, ClusterIP + headless Services, StatefulSets with volumeClaimTemplates, EBS-backed StorageClass with WaitForFirstConsumer binding, ConfigMaps, HPA, and liveness/readiness probes.",
      "Configured the AWS Load Balancer Controller for native Ingress resources, exposing the platform through a single ALB with host- and path-based routing.",
      "Implemented Kubernetes RBAC (ServiceAccounts, Roles, ClusterRoles, bindings) and mapped AWS IAM identities into the cluster via aws-auth for real multi-user access control.",
      "Implemented IRSA against the cluster's OIDC provider so pods obtain temporary AWS credentials via STS instead of static keys in manifests or images.",
      "Packaged the platform as reusable Helm charts with values-driven templates and two chart archetypes (Deployment and StatefulSet), enabling repeatable installs with a single helm install command."
    ],
    "tags": ["Docker", "Kubernetes", "Helm", "kubectl", "Alpine Linux", "ConfigMaps", "StatefulSets", "HPA", "PV/PVC", "StorageClass", "RBAC", "IRSA/OIDC", "AWS ALB Ingress"],
    "links": [
      { "label": "Docker Files", "url": "https://github.com/AnuragBojja/docker-files" },
      { "label": "Docker Compress", "url": "https://github.com/AnuragBojja/docker-compress" },
      { "label": "kubectl Practice", "url": "https://github.com/AnuragBojja/kubectl" },
      { "label": "eksctl Cluster Setup", "url": "https://github.com/AnuragBojja/eksctl" },
      { "label": "Kube Deployments", "url": "https://github.com/AnuragBojja/kube-roboshop" },
      { "label": "Kube Stateful+HPA", "url": "https://github.com/AnuragBojja/kube-roboshop-vol" },
      { "label": "Helm Charts", "url": "https://github.com/AnuragBojja/k8s-HELM-roboshop" },
      { "label": "Ingress", "url": "https://github.com/AnuragBojja/k8-ingress" },
      { "label": "RBAC", "url": "https://github.com/AnuragBojja/k8-rbac" }
    ]
  },
  {
    "title": "Multi-Cloud Deployment Strategy — IaaS vs PaaS Architecture",
    "badge": "Multi-Cloud",
    "image": "./assets/food-delivery.png",
    "size": "small",
    "featured": false,
    "description": "Deployed a full-stack Django application across AWS (IaaS) and Azure (PaaS) simultaneously, connected to a shared MySQL backend — a deliberate multi-cloud decision to reduce single-provider dependency and improve disaster recovery posture against regional outages and vendor lock-in.",
    "bullets": [
      "AWS IaaS: hand-configured EC2 with Nginx reverse proxy, Gunicorn WSGI, systemd lifecycle management, and TLS via Certbot/Let's Encrypt with automatic renewal.",
      "Azure PaaS: deployed the same application to Azure Web App, letting the platform handle runtime management, scaling, and TLS termination.",
      "Tied both deployments to GitHub Actions workflows that automatically build, test, and deploy on push to main.",
      "Hardened both environments so neither exposes internal services to the public internet — internal-only MySQL access, IAM least-privilege, and edge TLS termination on both sides."
    ],
    "tags": ["Django", "AWS EC2", "Azure Web App", "MySQL", "Nginx", "Gunicorn", "GitHub Actions", "TLS/SSL", "IAM"],
    "links": [
      { "label": "Blog Post", "url": "https://uwm-cloudblog.net/general/deployment-of-a-food-delivery-system-using-iaas-and-paas/" }
    ]
  }
]
```

- [ ] **Step 3: Validate JSON and the featured/size invariants**

Run:
```bash
node -e "
const exp = require('./data/experience.json');
const proj = require('./data/projects.json');
console.assert(exp.filter(e=>e.featured).length === 1, 'experience: exactly one featured');
console.assert(proj.length === 3, 'projects: exactly 3 entries');
console.assert(proj.filter(p=>p.featured).length === 1, 'projects: exactly one featured');
console.assert(JSON.stringify(proj.map(p=>p.size)) === JSON.stringify(['large','medium','small']), 'projects: size order large,medium,small');
console.log('All invariants OK');
"
```
Expected: `All invariants OK` (no assertion output means all `console.assert` calls passed).

- [ ] **Step 4: Commit**

```bash
git add data/experience.json data/projects.json
git commit -m "Add experience and projects data files"
```

---

### Task 4: Pure JS utilities — router, theme, render helpers

**Files:**
- Create: `js/router.mjs`
- Create: `js/theme.mjs`
- Create: `js/helpers.mjs`
- Test: `js/__tests__/router.test.mjs`
- Test: `js/__tests__/theme.test.mjs`
- Test: `js/__tests__/helpers.test.mjs`

**Interfaces:**
- Produces: `parseHash(hash: string): string` (router.mjs, default export `parseHash`, also exports `TABS = ['home','experience','projects','resume','contact']`). `getInitialTheme(storage: {getItem}): 'light'|'dark'` and `toggleTheme(current: 'light'|'dark'): 'light'|'dark'` (theme.mjs). `escapeHtml(str: string): string`, `formatDateRange(start: string, end: string): string`, `tagsHtml(tags: string[]): string` (helpers.mjs).
- Consumes: nothing (pure, no dependencies on other project files).

- [ ] **Step 1: Write the failing tests**

`js/__tests__/router.test.mjs`:
```javascript
import assert from 'node:assert';
import { parseHash, TABS } from '../router.mjs';

assert.strictEqual(parseHash('#experience'), 'experience');
assert.strictEqual(parseHash('#projects'), 'projects');
assert.strictEqual(parseHash(''), 'home');
assert.strictEqual(parseHash('#'), 'home');
assert.strictEqual(parseHash('#not-a-real-tab'), 'home');
assert.deepStrictEqual(TABS, ['home', 'experience', 'projects', 'resume', 'contact']);

console.log('router.test.mjs: all assertions passed');
```

`js/__tests__/theme.test.mjs`:
```javascript
import assert from 'node:assert';
import { getInitialTheme, toggleTheme } from '../theme.mjs';

const emptyStorage = { getItem: () => null };
const darkStorage = { getItem: (k) => (k === 'theme' ? 'dark' : null) };
const lightStorage = { getItem: (k) => (k === 'theme' ? 'light' : null) };

assert.strictEqual(getInitialTheme(emptyStorage), 'light', 'defaults to light with no stored preference');
assert.strictEqual(getInitialTheme(darkStorage), 'dark', 'honors stored dark preference');
assert.strictEqual(getInitialTheme(lightStorage), 'light', 'honors stored light preference');
assert.strictEqual(toggleTheme('light'), 'dark');
assert.strictEqual(toggleTheme('dark'), 'light');

console.log('theme.test.mjs: all assertions passed');
```

`js/__tests__/helpers.test.mjs`:
```javascript
import assert from 'node:assert';
import { escapeHtml, formatDateRange, tagsHtml } from '../helpers.mjs';

assert.strictEqual(escapeHtml('<script>&"\''), '&lt;script&gt;&amp;&quot;&#39;');
assert.strictEqual(formatDateRange('Nov 2025', 'Present'), 'Nov 2025 – Present');
assert.strictEqual(formatDateRange('Mar 2022', 'May 2022'), 'Mar 2022 – May 2022');
assert.strictEqual(
  tagsHtml(['Python', 'AWS']),
  '<div class="tag-row"><span class="tag">Python</span><span class="tag">AWS</span></div>'
);
assert.strictEqual(tagsHtml([]), '<div class="tag-row"></div>');

console.log('helpers.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run tests to verify they fail (modules don't exist yet)**

Run: `node js/__tests__/router.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/router.mjs'`

(Same expected failure for `theme.test.mjs` and `helpers.test.mjs`.)

- [ ] **Step 3: Implement `js/router.mjs`**

```javascript
export const TABS = ['home', 'experience', 'projects', 'resume', 'contact'];

export function parseHash(hash) {
  const name = (hash || '').replace(/^#/, '');
  return TABS.includes(name) ? name : 'home';
}
```

- [ ] **Step 4: Implement `js/theme.mjs`**

```javascript
const STORAGE_KEY = 'theme';

export function getInitialTheme(storage) {
  const stored = storage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function toggleTheme(current) {
  return current === 'light' ? 'dark' : 'light';
}

export function persistTheme(storage, theme) {
  storage.setItem(STORAGE_KEY, theme);
}
```

- [ ] **Step 5: Implement `js/helpers.mjs`**

```javascript
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

export function formatDateRange(start, end) {
  return `${start} – ${end}`;
}

export function tagsHtml(tags) {
  const items = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return `<div class="tag-row">${items}</div>`;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node js/__tests__/router.test.mjs && node js/__tests__/theme.test.mjs && node js/__tests__/helpers.test.mjs`
Expected:
```
router.test.mjs: all assertions passed
theme.test.mjs: all assertions passed
helpers.test.mjs: all assertions passed
```

- [ ] **Step 7: Commit**

```bash
git add js/router.mjs js/theme.mjs js/helpers.mjs js/__tests__/router.test.mjs js/__tests__/theme.test.mjs js/__tests__/helpers.test.mjs
git commit -m "Add pure router, theme, and render-helper utilities with tests"
```

---

### Task 5: Data loader — `js/data-loader.mjs`

**Files:**
- Create: `js/data-loader.mjs`
- Test: `js/__tests__/data-loader.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks directly (standalone), but the field names it returns must match Tasks 2–3's JSON shapes exactly.
- Produces: `fetchAllData(basePath = './data', fetchFn = fetch): Promise<{profile, education, experience, projects, contact}>` — used by `js/main.mjs` in Task 7.

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/data-loader.test.mjs
import assert from 'node:assert';
import { fetchAllData } from '../data-loader.mjs';

const fakeData = {
  './data/profile.json': { name: 'Test Person' },
  './data/education.json': [{ school: 'Test U' }],
  './data/experience.json': [{ role: 'Test Role' }],
  './data/projects.json': [{ title: 'Test Project' }],
  './data/contact.json': { email: 'test@example.com' }
};

async function fakeFetch(url) {
  if (!(url in fakeData)) throw new Error(`unexpected fetch: ${url}`);
  return { ok: true, json: async () => fakeData[url] };
}

const result = await fetchAllData('./data', fakeFetch);

assert.deepStrictEqual(result.profile, { name: 'Test Person' });
assert.deepStrictEqual(result.education, [{ school: 'Test U' }]);
assert.deepStrictEqual(result.experience, [{ role: 'Test Role' }]);
assert.deepStrictEqual(result.projects, [{ title: 'Test Project' }]);
assert.deepStrictEqual(result.contact, { email: 'test@example.com' });

// error propagation
async function failingFetch() {
  return { ok: false, status: 404 };
}
let threw = false;
try {
  await fetchAllData('./data', failingFetch);
} catch (e) {
  threw = true;
}
assert.strictEqual(threw, true, 'fetchAllData should throw when any fetch is not ok');

console.log('data-loader.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/data-loader.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/data-loader.mjs'`

- [ ] **Step 3: Implement `js/data-loader.mjs`**

```javascript
const FILES = {
  profile: 'profile.json',
  education: 'education.json',
  experience: 'experience.json',
  projects: 'projects.json',
  contact: 'contact.json'
};

export async function fetchAllData(basePath = './data', fetchFn = fetch) {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, filename]) => {
      const res = await fetchFn(`${basePath}/${filename}`);
      if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
      return [key, await res.json()];
    })
  );
  return Object.fromEntries(entries);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/data-loader.test.mjs`
Expected: `data-loader.test.mjs: all assertions passed`

- [ ] **Step 5: Commit**

```bash
git add js/data-loader.mjs js/__tests__/data-loader.test.mjs
git commit -m "Add data loader with injectable fetch, tested with a fake fetch"
```

---

### Task 6: HTML shell + CSS design tokens

**Files:**
- Create: `index.html` (overwrites existing scrolling-page markup)
- Create: `app.css` (replaces `style.css`)

**Interfaces:**
- Produces: five empty `<section>` panels with `id="home"`, `id="experience"`, `id="projects"`, `id="resume"`, `id="contact"` and `class="tab-panel"`; a `<nav class="island">` with 5 tab links + a theme-toggle `<button id="theme-toggle">`; CSS custom properties `--bg`, `--surface`, `--ink`, `--muted`, `--border`, `--accent`, `--accent-2`, `--accent-3`, `--radius`, `--shadow` defined under `:root[data-theme="light"]` and `:root[data-theme="dark"]`, consumed by every CSS task after this one.
- Consumes: none from JS yet (this task is markup + tokens only; wiring happens in Task 7).

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Anurag Bojja — DevOps, Cloud & SRE Engineer. Production AWS infrastructure automation, IaC with Terraform & Ansible, Kubernetes orchestration, and NLP research publication (Springer ICDSAI 2023)."
    />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./app.css" />
    <title>Anurag Bojja | DevOps · Cloud · SRE Engineer</title>
    <script>
      // Applied before first paint to avoid a flash of the wrong theme.
      (function () {
        var stored = localStorage.getItem('theme');
        document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light');
      })();
    </script>
  </head>

  <body>
    <main id="app">
      <section id="home" class="tab-panel" aria-labelledby="home-heading"></section>
      <section id="experience" class="tab-panel" hidden aria-labelledby="experience-heading"></section>
      <section id="projects" class="tab-panel" hidden aria-labelledby="projects-heading"></section>
      <section id="resume" class="tab-panel" hidden aria-labelledby="resume-heading"></section>
      <section id="contact" class="tab-panel" hidden aria-labelledby="contact-heading"></section>
    </main>

    <nav class="island" aria-label="Primary navigation">
      <a href="#home" class="island-item" data-tab="home" aria-label="Home">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11.5 12 4l9 7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="island-label">Home</span>
      </a>
      <a href="#experience" class="island-item" data-tab="experience" aria-label="Experience">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round"/></svg>
        <span class="island-label">Experience</span>
      </a>
      <a href="#projects" class="island-item" data-tab="projects" aria-label="Projects">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" stroke-linejoin="round"/></svg>
        <span class="island-label">Projects</span>
      </a>
      <a href="#resume" class="island-item" data-tab="resume" aria-label="Resume">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke-linejoin="round"/><path d="M9 12h6M9 16h6" stroke-linecap="round"/></svg>
        <span class="island-label">Resume</span>
      </a>
      <a href="#contact" class="island-item" data-tab="contact" aria-label="Contact">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="island-label">Contact</span>
      </a>
      <button id="theme-toggle" class="island-item island-toggle" aria-label="Toggle dark mode">
        <svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke-linecap="round"/></svg>
        <svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" stroke-linejoin="round"/></svg>
      </button>
    </nav>

    <script type="module" src="./js/main.mjs"></script>
  </body>
</html>
```

- [ ] **Step 2: Write `app.css` design tokens + base reset**

```css
:root[data-theme="light"] {
  --bg: #f6f6fb;
  --bg-grain-opacity: 0.05;
  --surface: rgba(255, 255, 255, 0.72);
  --ink: #12131a;
  --muted: rgba(18, 19, 26, 0.62);
  --border: rgba(18, 19, 26, 0.08);
  --accent: #6d28d9;
  --accent-2: #14b8a6;
  --accent-3: #38bdf8;
  --shadow: 0 10px 30px rgba(18, 19, 26, 0.08);
}

:root[data-theme="dark"] {
  --bg: #0b0d16;
  --bg-grain-opacity: 0.08;
  --surface: rgba(255, 255, 255, 0.06);
  --ink: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.66);
  --border: rgba(255, 255, 255, 0.12);
  --accent: #8b5cf6;
  --accent-2: #14b8a6;
  --accent-3: #38bdf8;
  --shadow: 0 18px 46px rgba(0, 0, 0, 0.35);
}

:root {
  --radius: 22px;
  --radius-sm: 14px;
  --container: 1180px;
  --island-h: 76px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  transition: background-color 200ms ease, color 200ms ease;
}

a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
button { font: inherit; cursor: pointer; }

#app {
  min-height: 100vh;
  padding: 32px 24px calc(var(--island-h) + 32px);
  max-width: var(--container);
  margin: 0 auto;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
  padding: 24px;
  transition: background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}

.eyebrow {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}

.tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  font-size: 12.5px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(109, 40, 217, 0.08);
  border: 1px solid rgba(109, 40, 217, 0.18);
  color: var(--ink);
}

.tab-panel[hidden] { display: none; }
```

- [ ] **Step 3: Manually verify the shell loads with no console errors**

Run: `python -m http.server 8000` (from the repo root), then open `http://localhost:8000/index.html` in a browser.
Expected:
- Page loads with the soft off-white background (light theme), no top header.
- Bottom island nav bar is visible with 5 icon+label items and a sun/moon toggle button, but clicking does nothing yet (no JS wired up until Task 7) — that's expected at this point.
- Browser devtools console shows a 404 for `./js/main.mjs` (expected — it doesn't exist until Task 7) and no other errors.
- View source: exactly 5 `<section class="tab-panel">` elements exist, only `#home` lacks the `hidden` attribute.

- [ ] **Step 4: Commit**

```bash
git add index.html app.css
git commit -m "Add dashboard app HTML shell and CSS design tokens"
```

---

### Task 7: Bootstrap — routing, theme toggle, data loading wiring

**Files:**
- Create: `js/main.mjs`
- Modify: `app.css` (island nav visual styling + tab-panel transition)

**Interfaces:**
- Consumes: `TABS`, `parseHash` (Task 4 router.mjs), `getInitialTheme`, `toggleTheme`, `persistTheme` (Task 4 theme.mjs), `fetchAllData` (Task 5 data-loader.mjs).
- Produces: on `DOMContentLoaded`, `main.mjs` calls `fetchAllData()`, stores the result in a module-level `let siteData`, calls `showTab(parseHash(location.hash))` once, and registers a `window.addEventListener('hashchange', ...)` — later render tasks (8–14) hook into `showTab` by registering a render function per tab via the exported `registerTabRenderer(tabName, renderFn)` function, so this task doesn't need to know about card content yet.

- [ ] **Step 1: Write `js/main.mjs`**

```javascript
import { TABS, parseHash } from './router.mjs';
import { getInitialTheme, toggleTheme, persistTheme } from './theme.mjs';
import { fetchAllData } from './data-loader.mjs';

let siteData = null;
const renderers = {};

export function registerTabRenderer(tabName, renderFn) {
  renderers[tabName] = renderFn;
}

function showTab(tabName) {
  for (const t of TABS) {
    const panel = document.getElementById(t);
    if (!panel) continue;
    const isActive = t === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle('is-active', isActive);
    if (isActive && renderers[t] && siteData) {
      panel.innerHTML = renderers[t](siteData);
    }
  }
  for (const link of document.querySelectorAll('.island-item[data-tab]')) {
    link.classList.toggle('is-active', link.dataset.tab === tabName);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
  let theme = getInitialTheme(window.localStorage);
  applyTheme(theme);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    theme = toggleTheme(theme);
    applyTheme(theme);
    persistTheme(window.localStorage, theme);
  });
}

async function init() {
  initTheme();
  window.addEventListener('hashchange', () => showTab(parseHash(location.hash)));
  siteData = await fetchAllData();
  showTab(parseHash(location.hash));
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
```

- [ ] **Step 2: Add island nav + tab transition CSS to `app.css`**

```css
.island {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
  z-index: 100;
}

.island-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  transition: background-color 150ms ease, color 150ms ease;
}

.island-item .icon { width: 18px; height: 18px; }
.island-item.is-active {
  background: rgba(109, 40, 217, 0.12);
  color: var(--accent);
}
.island-item.is-active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--accent);
}

.island-toggle { padding: 10px; }
.icon-moon { display: none; }
:root[data-theme="dark"] .icon-sun { display: none; }
:root[data-theme="dark"] .icon-moon { display: block; }

.tab-panel {
  animation: tab-in 220ms ease;
}
@keyframes tab-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .tab-panel { animation: none; }
}

@media (max-width: 480px) {
  .island-label { display: none; }
  .island-item.is-active .island-label {
    display: block;
    position: absolute;
    top: -22px;
    font-size: 10px;
    white-space: nowrap;
  }
  .island-item { position: relative; padding: 10px; }
}
```

- [ ] **Step 3: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html`.
Expected:
- No console errors.
- Clicking each island item highlights it (violet pill background + small dot under the label) and shows/hides the corresponding empty `<section>` (still empty content until Tasks 8–14, but `hidden` toggling is visible via devtools Elements panel).
- URL bar hash updates to `#experience`, `#projects`, etc. as you click; using browser back/forward navigates between the previously visited tabs.
- Reloading on `http://localhost:8000/index.html#projects` opens directly on the Projects panel.
- Clicking the sun/moon button crossfades the page and every visible card to dark background/colors over ~200ms (not an instant snap); reloading the page keeps the chosen theme (no flash of the other theme).
- At a viewport narrower than 480px (use devtools device toolbar), island labels disappear except a small caption above the active icon.

- [ ] **Step 4: Commit**

```bash
git add js/main.mjs app.css
git commit -m "Wire hash-based tab routing and theme toggle in main.mjs"
```

---

### Task 8: Home — Hero card and Bio card renderers

**Files:**
- Create: `js/render-home.mjs`
- Test: `js/__tests__/render-home.test.mjs`
- Modify: `app.css` (hero/bio card layout)

**Interfaces:**
- Consumes: `escapeHtml`, `tagsHtml` (Task 4 helpers.mjs); `profile` shape from Task 2.
- Produces: `renderHeroCard(profile): string`, `renderBioCard(profile): string` — both exported from `render-home.mjs`, consumed by Task 10's `renderHomeDashboard` assembly.

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/render-home.test.mjs
import assert from 'node:assert';
import { renderHeroCard, renderBioCard } from '../render-home.mjs';

const profile = {
  name: 'Anurag Bojja',
  title: 'DevOps · Cloud · SRE Engineer',
  tagline: 'Automated end-to-end.',
  heroLead: 'I build cloud infrastructure the way it should be built.',
  email: 'anuragbojja23@gmail.com',
  phone: '+1 414-275-9169',
  location: 'Los Angeles, CA',
  avatar: './assets/profile.jpeg'
};

const hero = renderHeroCard(profile);
assert.ok(hero.includes('Anurag Bojja'));
assert.ok(hero.includes('DevOps · Cloud · SRE Engineer'));
assert.ok(hero.includes('I build cloud infrastructure'));

const bio = renderBioCard(profile);
assert.ok(bio.includes('anuragbojja23@gmail.com'));
assert.ok(bio.includes('+1 414-275-9169'));
assert.ok(bio.includes('Los Angeles, CA'));
assert.ok(bio.includes('./assets/profile.jpeg'));

console.log('render-home.test.mjs (hero/bio): all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-home.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/render-home.mjs'`

- [ ] **Step 3: Implement hero/bio renderers in `js/render-home.mjs`**

```javascript
import { escapeHtml } from './helpers.mjs';

export function renderHeroCard(profile) {
  return `
    <div class="card hero-card">
      <span class="eyebrow">${escapeHtml(profile.title)}</span>
      <h1 class="hero-name">${escapeHtml(profile.name)}</h1>
      <p class="hero-tagline">${escapeHtml(profile.tagline)}</p>
      <p class="hero-lead">${escapeHtml(profile.heroLead)}</p>
    </div>
  `;
}

export function renderBioCard(profile) {
  return `
    <div class="card bio-card">
      <div class="bio-top">
        <img class="bio-avatar" src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />
        <div>
          <div class="bio-name">${escapeHtml(profile.name)}</div>
          <div class="bio-location">${escapeHtml(profile.location)}</div>
        </div>
      </div>
      <div class="bio-contact">
        <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>
        <span>${escapeHtml(profile.phone)}</span>
      </div>
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-home.test.mjs`
Expected: `render-home.test.mjs (hero/bio): all assertions passed`

- [ ] **Step 5: Add hero/bio CSS to `app.css`**

```css
.hero-card { grid-column: span 2; }
.hero-name { font-size: clamp(32px, 4vw, 52px); font-weight: 900; margin: 4px 0; letter-spacing: -0.02em; }
.hero-tagline { color: var(--accent); font-weight: 600; margin: 0 0 12px; }
.hero-lead { color: var(--muted); max-width: 60ch; line-height: 1.6; margin: 0; }

.bio-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.bio-avatar { width: 56px; height: 56px; border-radius: 999px; object-fit: cover; }
.bio-name { font-weight: 800; }
.bio-location { font-size: 13px; color: var(--muted); }
.bio-contact { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; color: var(--muted); }
```

- [ ] **Step 6: Commit**

```bash
git add js/render-home.mjs js/__tests__/render-home.test.mjs app.css
git commit -m "Add Home hero and bio card renderers with tests"
```

---

### Task 9: Home — About Me card renderer

**Files:**
- Modify: `js/render-home.mjs` (add `renderAboutMeCard`)
- Modify: `js/__tests__/render-home.test.mjs` (add assertions)
- Modify: `app.css` (about-me card layout)

**Interfaces:**
- Consumes: `escapeHtml` (Task 4); `profile` (bio, focusAreas, currentlySeeking, github, linkedin, resumeUrl, email) and `education` array shapes from Task 2.
- Produces: `renderAboutMeCard(profile, education): string`, consumed by Task 10's dashboard assembly.

- [ ] **Step 1: Add the failing test to `js/__tests__/render-home.test.mjs`**

```javascript
import { renderAboutMeCard } from '../render-home.mjs';

const education = [
  { school: 'University of Wisconsin–Milwaukee', degree: 'Master of Science, Computer Science', dates: 'Aug 2023 – May 2025', coursework: ['Cloud Computing', 'Cybersecurity'] }
];
const profileForAbout = {
  bio: ['First paragraph.', 'Second paragraph.'],
  currentlySeeking: 'DevOps Engineer · Cloud Engineer · Site Reliability Engineer roles',
  focusAreas: ['Building zero-touch, self-healing cloud infrastructure'],
  github: 'https://github.com/AnuragBojja',
  linkedin: 'https://www.linkedin.com/in/anurag-bojja-81a405192/',
  resumeUrl: 'https://anuragbojja.github.io/Resume/',
  email: 'anuragbojja23@gmail.com'
};

const about = renderAboutMeCard(profileForAbout, education);
assert.ok(about.includes('First paragraph.'));
assert.ok(about.includes('Second paragraph.'));
assert.ok(about.includes('DevOps Engineer · Cloud Engineer · Site Reliability Engineer roles'));
assert.ok(about.includes('Building zero-touch, self-healing cloud infrastructure'));
assert.ok(about.includes('University of Wisconsin–Milwaukee'));
assert.ok(about.includes('Cloud Computing'));
assert.ok(about.includes('https://github.com/AnuragBojja'));
assert.ok(about.includes('https://anuragbojja.github.io/Resume/'));

console.log('render-home.test.mjs (about): all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-home.test.mjs`
Expected: `TypeError: renderAboutMeCard is not a function`

- [ ] **Step 3: Implement `renderAboutMeCard` in `js/render-home.mjs`**

```javascript
export function renderAboutMeCard(profile, education) {
  const bioHtml = profile.bio.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const focusHtml = profile.focusAreas.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  const eduHtml = education
    .map(
      (e) => `
      <div class="edu-item">
        <div class="edu-school">${escapeHtml(e.school)}</div>
        <div class="edu-degree">${escapeHtml(e.degree)} · ${escapeHtml(e.dates)}</div>
        <div class="edu-coursework">${e.coursework.map(escapeHtml).join(' · ')}</div>
      </div>`
    )
    .join('');

  return `
    <div class="card about-card">
      <span class="eyebrow">About Me</span>
      ${bioHtml}
      <p class="seeking"><strong>Currently seeking:</strong> ${escapeHtml(profile.currentlySeeking)}</p>
      <div class="quick-links">
        <a href="${escapeHtml(profile.github)}" target="_blank" rel="noopener">GitHub</a>
        <a href="${escapeHtml(profile.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
        <a href="mailto:${escapeHtml(profile.email)}">Email</a>
        <a href="${escapeHtml(profile.resumeUrl)}" target="_blank" rel="noopener">Resume</a>
      </div>
      <div class="about-subcards">
        <div class="mini">
          <div class="mini-title">What I'm Focused On</div>
          <ul class="mini-list">${focusHtml}</ul>
        </div>
        <div class="mini">
          <div class="mini-title">Education Glimpse</div>
          ${eduHtml}
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-home.test.mjs`
Expected:
```
render-home.test.mjs (hero/bio): all assertions passed
render-home.test.mjs (about): all assertions passed
```

- [ ] **Step 5: Add About Me card CSS to `app.css`**

```css
.about-card { grid-column: 1 / -1; }
.about-card p { color: var(--muted); line-height: 1.65; }
.seeking { color: var(--ink); }
.quick-links { display: flex; gap: 14px; flex-wrap: wrap; margin: 12px 0 16px; font-weight: 600; color: var(--accent); }
.about-subcards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.mini { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; }
.mini-title { font-weight: 800; font-size: 13px; margin-bottom: 8px; }
.mini-list { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13.5px; line-height: 1.6; }
.edu-item + .edu-item { margin-top: 10px; }
.edu-school { font-weight: 700; font-size: 13.5px; }
.edu-degree { font-size: 12.5px; color: var(--muted); }
.edu-coursework { font-size: 12px; color: var(--muted); margin-top: 4px; }

@media (max-width: 700px) {
  .about-subcards { grid-template-columns: 1fr; }
}
```

- [ ] **Step 6: Commit**

```bash
git add js/render-home.mjs js/__tests__/render-home.test.mjs app.css
git commit -m "Add Home About Me card renderer with tests"
```

---

### Task 10: Home — Career Glimpse, Architecture Spec, Get In Touch cards + dashboard assembly

**Files:**
- Modify: `js/render-home.mjs` (add `renderCareerGlimpseCard`, `renderArchitectureSpecCard`, `renderGetInTouchCard`, `renderHomeDashboard`)
- Modify: `js/__tests__/render-home.test.mjs` (add assertions)
- Modify: `js/main.mjs` (register the `home` tab renderer)
- Modify: `app.css` (dashboard grid + remaining card styles)

**Interfaces:**
- Consumes: `renderHeroCard`, `renderBioCard`, `renderAboutMeCard` (this file, Tasks 8–9); `escapeHtml` (Task 4); `experience`, `projects`, `contact`, `education` shapes (Tasks 2–3); `registerTabRenderer` (Task 7 main.mjs).
- Produces: `renderHomeDashboard(data: {profile, education, experience, projects, contact}): string` — the function registered for the `home` tab, consumed only by `main.mjs`.

- [ ] **Step 1: Add the failing test**

```javascript
import { renderCareerGlimpseCard, renderArchitectureSpecCard, renderGetInTouchCard, renderHomeDashboard } from '../render-home.mjs';

const experience = [
  { role: 'Software Engineer Intern', company: 'Eco Servants', startDate: 'Nov 2025', endDate: 'Present', summary: 'Backend platform work.', featured: true },
  { role: 'DevOps Engineer', company: 'Vesonix TechLabs', startDate: 'Jun 2022', endDate: 'Aug 2023', summary: 'Containerization work.', featured: false }
];
const projects = [
  { title: '10-Layer IaC Architecture', description: 'Fully automated AWS environment.', featured: true },
  { title: 'Kubernetes Platform', description: 'Container orchestration.', featured: false }
];
const contact = { email: 'anuragbojja23@gmail.com' };

const glimpse = renderCareerGlimpseCard(experience);
assert.ok(glimpse.includes('Eco Servants'));
assert.ok(glimpse.includes('Software Engineer Intern'));
assert.ok(!glimpse.includes('Vesonix TechLabs'), 'only the featured role should appear');

const spec = renderArchitectureSpecCard(projects);
assert.ok(spec.includes('10-Layer IaC Architecture'));
assert.ok(!spec.includes('Kubernetes Platform'), 'only the featured project should appear');

const touch = renderGetInTouchCard(contact);
assert.ok(touch.includes('anuragbojja23@gmail.com') || touch.includes('#contact'));

const fullProfile = { ...profile, ...profileForAbout };
const dashboard = renderHomeDashboard({ profile: fullProfile, education, experience, projects, contact });
assert.ok(dashboard.includes('hero-card'));
assert.ok(dashboard.includes('bio-card'));
assert.ok(dashboard.includes('about-card'));
assert.ok(dashboard.includes('Eco Servants'));
assert.ok(dashboard.includes('10-Layer IaC Architecture'));

console.log('render-home.test.mjs (dashboard): all assertions passed');
```

(This reuses `profile` from Task 8's fixture and `profileForAbout`/`education` from Task 9's fixture, already declared earlier in the same growing test file. `fullProfile` merges them so `renderHomeDashboard`'s internal calls to `renderHeroCard`/`renderBioCard` — which need `title`/`tagline`/`heroLead`/`phone`/`location`/`avatar` — and `renderAboutMeCard` — which needs `bio`/`currentlySeeking`/`focusAreas`/`github`/`linkedin`/`resumeUrl` — both get every field they require. Declare `experience`, `projects`, `contact`, and `fullProfile` alongside the existing fixtures rather than redeclaring `profile`/`profileForAbout`/`education`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-home.test.mjs`
Expected: `TypeError: renderCareerGlimpseCard is not a function`

- [ ] **Step 3: Implement the remaining renderers and assembly in `js/render-home.mjs`**

```javascript
export function renderCareerGlimpseCard(experience) {
  const role = experience.find((e) => e.featured) || experience[0];
  return `
    <div class="card">
      <span class="eyebrow">Career Glimpse</span>
      <h3>${escapeHtml(role.role)}</h3>
      <p class="card-meta">${escapeHtml(role.company)} · ${escapeHtml(role.startDate)} – ${escapeHtml(role.endDate)}</p>
      <p class="card-desc">${escapeHtml(role.summary)}</p>
      <a class="card-link" href="#experience">Open Career Timeline →</a>
    </div>
  `;
}

export function renderArchitectureSpecCard(projects) {
  const project = projects.find((p) => p.featured) || projects[0];
  return `
    <div class="card">
      <span class="eyebrow">Architecture Spec</span>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="card-desc">${escapeHtml(project.description)}</p>
      <a class="card-link" href="#projects">Read Spec Sheets ↗</a>
    </div>
  `;
}

export function renderGetInTouchCard(contact) {
  return `
    <div class="card">
      <span class="eyebrow">Get In Touch</span>
      <p class="card-desc">Have a role or system design project in mind? Let's discuss details.</p>
      <a class="card-link" href="#contact">Open Message Form →</a>
    </div>
  `;
}

export function renderHomeDashboard({ profile, education, experience, projects, contact }) {
  return `
    <div class="home-grid">
      ${renderHeroCard(profile)}
      ${renderBioCard(profile)}
      ${renderAboutMeCard(profile, education)}
      ${renderCareerGlimpseCard(experience)}
      ${renderArchitectureSpecCard(projects)}
      ${renderGetInTouchCard(contact)}
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-home.test.mjs`
Expected: all four groups of assertions print `passed`, no errors.

- [ ] **Step 5: Register the home renderer in `js/main.mjs`**

Add near the top of `js/main.mjs`:
```javascript
import { renderHomeDashboard } from './render-home.mjs';
```

Add inside `init()`, before the final `showTab(...)` call:
```javascript
registerTabRenderer('home', renderHomeDashboard);
```

- [ ] **Step 6: Add dashboard grid CSS to `app.css`**

```css
.home-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.home-grid .hero-card { grid-column: span 2; }
.card-meta { font-size: 12.5px; color: var(--muted); font-weight: 700; }
.card-desc { color: var(--muted); line-height: 1.55; font-size: 14px; }
.card-link { display: inline-block; margin-top: 10px; color: var(--accent); font-weight: 700; font-size: 13.5px; }

@media (max-width: 1040px) {
  .home-grid { grid-template-columns: 1fr 1fr; }
  .home-grid .hero-card { grid-column: 1 / -1; }
  .home-grid .about-card { grid-column: 1 / -1; }
}
@media (max-width: 700px) {
  .home-grid { grid-template-columns: 1fr; }
  .home-grid .hero-card, .home-grid .about-card { grid-column: 1; }
}
```

- [ ] **Step 7: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html`.
Expected: Home tab shows the hero card, bio card, About Me card (with bio paragraphs, quick links, focus list, education), Career Glimpse card (Eco Servants), Architecture Spec card (10-Layer IaC Architecture), and Get In Touch card, laid out in a responsive grid that collapses to 1 column under ~700px width (test with devtools device toolbar).

- [ ] **Step 8: Commit**

```bash
git add js/render-home.mjs js/__tests__/render-home.test.mjs js/main.mjs app.css
git commit -m "Add remaining Home cards and assemble the full dashboard"
```

---

### Task 11: Experience tab

**Files:**
- Create: `js/render-experience.mjs`
- Test: `js/__tests__/render-experience.test.mjs`
- Create: `js/timeline-progress.mjs`
- Modify: `js/main.mjs` (register renderer + init timeline progress on tab show)
- Modify: `app.css` (timeline styles)

**Interfaces:**
- Consumes: `escapeHtml`, `formatDateRange`, `tagsHtml` (Task 4); `experience` array shape (Task 3).
- Produces: `renderExperienceTimeline(experience): string` (registered for the `experience` tab); `initTimelineProgress(container: Element): void` (DOM-only, no automated test — called after the panel is rendered).

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/render-experience.test.mjs
import assert from 'node:assert';
import { renderExperienceTimeline } from '../render-experience.mjs';

const experience = [
  { role: 'Software Engineer Intern', company: 'Eco Servants', location: 'California, USA', startDate: 'Nov 2025', endDate: 'Present', summary: 's1', bullets: ['b1', 'b2'], tags: ['Python', 'PHP'], featured: true },
  { role: 'DevOps Engineer', company: 'Vesonix TechLabs', location: 'Hyderabad, India', startDate: 'Jun 2022', endDate: 'Aug 2023', summary: 's2', bullets: ['b3'], tags: ['Docker'], featured: false }
];

const html = renderExperienceTimeline(experience);
assert.ok(html.indexOf('Eco Servants') < html.indexOf('Vesonix TechLabs'), 'newest role renders first');
assert.ok(html.includes('Nov 2025 – Present'));
assert.ok(html.includes('b1'));
assert.ok(html.includes('<span class="tag">Python</span>'));

console.log('render-experience.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-experience.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/render-experience.mjs'`

- [ ] **Step 3: Implement `js/render-experience.mjs`**

```javascript
import { escapeHtml, formatDateRange, tagsHtml } from './helpers.mjs';

export function renderExperienceTimeline(experience) {
  const items = experience
    .map(
      (e) => `
      <article class="timeline-item" data-timeline-item>
        <div class="timeline-marker"></div>
        <div class="card timeline-card">
          <div class="timeline-top">
            <div>
              <h3>${escapeHtml(e.role)}</h3>
              <p class="card-meta">${escapeHtml(e.company)} · ${escapeHtml(e.location)}</p>
            </div>
            <span class="timeline-date">${formatDateRange(e.startDate, e.endDate)}</span>
          </div>
          <ul class="bullets">${e.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ${tagsHtml(e.tags)}
        </div>
      </article>`
    )
    .join('');

  return `
    <h2 id="experience-heading" class="section-title">Work Experience</h2>
    <div class="timeline">
      <div class="timeline-rail"><div class="timeline-rail-fill" data-timeline-rail></div></div>
      ${items}
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-experience.test.mjs`
Expected: `render-experience.test.mjs: all assertions passed`

- [ ] **Step 5: Implement `js/timeline-progress.mjs` (DOM-only, no automated test)**

```javascript
export function initTimelineProgress(container) {
  const items = container.querySelectorAll('[data-timeline-item]');
  const rail = container.querySelector('[data-timeline-rail]');
  if (!items.length || !rail) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver(
    (entries) => {
      let lastVisibleIndex = -1;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(items).indexOf(entry.target);
          lastVisibleIndex = Math.max(lastVisibleIndex, idx);
        }
      });
      if (lastVisibleIndex >= 0) {
        const progress = (lastVisibleIndex + 1) / items.length;
        rail.style.transition = reduceMotion ? 'none' : 'transform 240ms ease';
        rail.style.transform = `scaleY(${progress})`;
      }
    },
    { threshold: 0.4 }
  );

  items.forEach((item) => observer.observe(item));
}
```

- [ ] **Step 6: Register the renderer and progress init in `js/main.mjs`**

Add imports:
```javascript
import { renderExperienceTimeline } from './render-experience.mjs';
import { initTimelineProgress } from './timeline-progress.mjs';
```

Replace the `registerTabRenderer('home', ...)` line's surrounding block with both registrations, and extend `showTab` to run the timeline-progress hook right after rendering the experience panel:

```javascript
registerTabRenderer('home', renderHomeDashboard);
registerTabRenderer('experience', renderExperienceTimeline);
```

In `showTab`, after the `panel.innerHTML = renderers[t](siteData)` line (still inside the `if (isActive && renderers[t] && siteData)` block), add:
```javascript
if (t === 'experience') initTimelineProgress(panel);
```

- [ ] **Step 7: Add timeline CSS to `app.css`**

```css
.section-title { font-size: 28px; font-weight: 800; margin: 0 0 20px; }
.timeline { position: relative; display: grid; gap: 16px; padding-left: 24px; }
.timeline-rail { position: absolute; left: 3px; top: 4px; bottom: 4px; width: 4px; background: var(--border); border-radius: 4px; }
.timeline-rail-fill { width: 100%; height: 100%; background: var(--accent); border-radius: 4px; transform-origin: top; transform: scaleY(0); }
.timeline-item { position: relative; }
.timeline-marker { position: absolute; left: -26px; top: 22px; width: 10px; height: 10px; border-radius: 999px; background: var(--accent); }
.timeline-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.timeline-date { font-size: 12.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.bullets { margin: 0 0 14px; padding-left: 18px; color: var(--muted); line-height: 1.6; }

@media (prefers-reduced-motion: reduce) {
  .timeline-rail-fill { transition: none !important; }
}
```

- [ ] **Step 8: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html#experience`.
Expected: all 3 roles render newest-first with dates, bullets, and tags; scrolling the panel fills the left rail progressively; with devtools "Emulate CSS prefers-reduced-motion: reduce" enabled, the rail jumps instantly instead of animating.

- [ ] **Step 9: Commit**

```bash
git add js/render-experience.mjs js/__tests__/render-experience.test.mjs js/timeline-progress.mjs js/main.mjs app.css
git commit -m "Add Experience tab with scroll-driven timeline progress rail"
```

---

### Task 12: Projects tab + hero/bio tilt-on-hover

**Files:**
- Create: `js/render-projects.mjs`
- Test: `js/__tests__/render-projects.test.mjs`
- Create: `js/tilt.mjs`
- Modify: `js/render-home.mjs` (add `data-tilt` to the hero and bio cards — the spec requires tilt on hero/bio, not just project cards)
- Modify: `js/__tests__/render-home.test.mjs` (assert the attribute is present)
- Modify: `js/main.mjs` (register renderer + init tilt on both the Home and Projects tabs)
- Modify: `app.css` (bento grid + tilt/zoom styles)

**Interfaces:**
- Consumes: `escapeHtml`, `tagsHtml` (Task 4); `projects` array shape (Task 3, exactly 3 entries with `size` field); `renderHeroCard`/`renderBioCard` output (Task 8, modified in this task).
- Produces: `renderProjectsBento(projects): string` (registered for `projects` tab); `initTilt(container: Element): void` (DOM-only, no automated test), applied to both the `home` and `projects` panels.

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/render-projects.test.mjs
import assert from 'node:assert';
import { renderProjectsBento } from '../render-projects.mjs';

const projects = [
  { title: '10-Layer IaC Architecture', badge: 'IaC', image: './assets/roboshop-terraform.png', size: 'large', description: 'd1', bullets: ['b1'], tags: ['Terraform'], links: [{ label: 'Repo', url: 'https://example.com/1' }] },
  { title: 'Kubernetes Platform', badge: 'Containers', image: './assets/roboshop-k8s.png', size: 'medium', description: 'd2', bullets: ['b2'], tags: ['Kubernetes'], links: [{ label: 'Repo', url: 'https://example.com/2' }] },
  { title: 'Multi-Cloud Strategy', badge: 'Multi-Cloud', image: './assets/food-delivery.png', size: 'small', description: 'd3', bullets: ['b3'], tags: ['Django'], links: [{ label: 'Blog', url: 'https://example.com/3' }] }
];

const html = renderProjectsBento(projects);
assert.strictEqual((html.match(/class="card project /g) || []).length, 3, 'exactly 3 project tiles');
assert.ok(html.includes('project size-large'));
assert.ok(html.includes('project size-medium'));
assert.ok(html.includes('project size-small'));
assert.ok(html.includes('https://example.com/1'));

console.log('render-projects.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-projects.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/render-projects.mjs'`

- [ ] **Step 3: Implement `js/render-projects.mjs`**

```javascript
import { escapeHtml, tagsHtml } from './helpers.mjs';

export function renderProjectsBento(projects) {
  const tiles = projects
    .map((p) => {
      const links = p.links
        .map((l) => `<a class="card-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`)
        .join('');
      return `
      <article class="card project size-${p.size}" data-tilt>
        <div class="project-img">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy" />
        </div>
        <div class="project-body">
          <span class="eyebrow">${escapeHtml(p.badge)}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="card-desc">${escapeHtml(p.description)}</p>
          <ul class="bullets">${p.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ${tagsHtml(p.tags)}
          <div class="project-actions">${links}</div>
        </div>
      </article>`;
    })
    .join('');

  return `
    <h2 id="projects-heading" class="section-title">Featured Projects</h2>
    <div class="project-bento">${tiles}</div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-projects.test.mjs`
Expected: `render-projects.test.mjs: all assertions passed`

- [ ] **Step 4b: Add the failing test for hero/bio tilt attributes, then wire them in**

Add to `js/__tests__/render-home.test.mjs` (near the existing hero/bio assertions from Task 8):
```javascript
assert.ok(hero.includes('data-tilt'), 'hero card should be tiltable');
assert.ok(bio.includes('data-tilt'), 'bio card should be tiltable');
```

Run: `node js/__tests__/render-home.test.mjs`
Expected: `AssertionError: hero card should be tiltable` (the attribute doesn't exist yet).

In `js/render-home.mjs`, add `data-tilt` to the two card wrapper `<div>` elements from Task 8:
```javascript
export function renderHeroCard(profile) {
  return `
    <div class="card hero-card" data-tilt>
      <span class="eyebrow">${escapeHtml(profile.title)}</span>
      <h1 class="hero-name">${escapeHtml(profile.name)}</h1>
      <p class="hero-tagline">${escapeHtml(profile.tagline)}</p>
      <p class="hero-lead">${escapeHtml(profile.heroLead)}</p>
    </div>
  `;
}

export function renderBioCard(profile) {
  return `
    <div class="card bio-card" data-tilt>
      <div class="bio-top">
        <img class="bio-avatar" src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />
        <div>
          <div class="bio-name">${escapeHtml(profile.name)}</div>
          <div class="bio-location">${escapeHtml(profile.location)}</div>
        </div>
      </div>
      <div class="bio-contact">
        <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>
        <span>${escapeHtml(profile.phone)}</span>
      </div>
    </div>
  `;
}
```

Run: `node js/__tests__/render-home.test.mjs`
Expected: every assertion group (hero/bio, about, dashboard) prints `passed`, including the two new tilt assertions.

- [ ] **Step 5: Implement `js/tilt.mjs` (DOM-only, no automated test)**

```javascript
export function initTilt(container) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const cards = container.querySelectorAll('[data-tilt]');
  cards.forEach((card) => {
    let frame = null;
    card.addEventListener('mousemove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
        frame = null;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
    });
  });
}
```

- [ ] **Step 6: Register the renderer and tilt init in `js/main.mjs`**

Add import:
```javascript
import { renderProjectsBento } from './render-projects.mjs';
import { initTilt } from './tilt.mjs';
```

Add registration next to the others:
```javascript
registerTabRenderer('projects', renderProjectsBento);
```

In `showTab`, extend the same conditional block used for the experience tab. Tilt applies to both `home` (hero/bio cards) and `projects` (project tiles):
```javascript
if (t === 'experience') initTimelineProgress(panel);
if (t === 'home' || t === 'projects') initTilt(panel);
```

- [ ] **Step 7: Add bento grid + tilt/zoom CSS to `app.css`**

```css
.project-bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.project.size-large { grid-column: span 2; grid-row: span 2; }
.project.size-medium { grid-column: span 1; grid-row: span 2; }
.project.size-small { grid-column: span 1; }

.project { overflow: hidden; transition: transform 120ms ease; will-change: transform; }
.project-img { overflow: hidden; border-radius: var(--radius-sm); margin-bottom: 14px; }
.project-img img { width: 100%; height: 180px; object-fit: cover; transition: transform 300ms ease; }
.project:hover .project-img img { transform: scale(1.05); }
.project-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }

@media (max-width: 1040px) {
  .project-bento { grid-template-columns: repeat(2, 1fr); }
  .project.size-large { grid-column: 1 / -1; }
}
@media (max-width: 700px) {
  .project-bento { grid-template-columns: 1fr; }
  .project.size-large, .project.size-medium { grid-column: 1; grid-row: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .project, .project-img img { transition: none !important; }
}
```

- [ ] **Step 8: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html#projects`.
Expected: 3 tiles render — large (10-Layer IaC), medium (Kubernetes), small (Multi-Cloud) — in that visual arrangement on desktop width; moving the mouse over a tile tilts it slightly and the project image zooms in slightly; with "prefers-reduced-motion: reduce" emulated in devtools, tilt does not engage and image zoom transition is removed. At mobile width, tiles stack to a single column.

Then open `http://localhost:8000/index.html#home` and confirm the hero card and bio card also tilt slightly on mouse-move, matching the project tiles' behavior, and are similarly inert under emulated reduced motion.

- [ ] **Step 9: Commit**

```bash
git add js/render-projects.mjs js/__tests__/render-projects.test.mjs js/tilt.mjs js/render-home.mjs js/__tests__/render-home.test.mjs js/main.mjs app.css
git commit -m "Add Projects tab bento grid and extend tilt-on-hover to Home hero/bio cards"
```

---

### Task 13: Resume tab

**Files:**
- Create: `js/render-resume.mjs`
- Test: `js/__tests__/render-resume.test.mjs`
- Modify: `js/main.mjs` (register renderer)
- Modify: `app.css` (resume iframe styling)

**Interfaces:**
- Consumes: `escapeHtml` (Task 4); `profile.resumeUrl` (Task 2).
- Produces: `renderResumeTab(profile): string`, registered for the `resume` tab.

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/render-resume.test.mjs
import assert from 'node:assert';
import { renderResumeTab } from '../render-resume.mjs';

const html = renderResumeTab({ resumeUrl: 'https://anuragbojja.github.io/Resume/' });
assert.ok(html.includes('<iframe'));
assert.ok(html.includes('src="https://anuragbojja.github.io/Resume/"'));
assert.ok(html.includes('href="https://anuragbojja.github.io/Resume/"'));
assert.ok(html.includes('target="_blank"'));

console.log('render-resume.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-resume.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/render-resume.mjs'`

- [ ] **Step 3: Implement `js/render-resume.mjs`**

```javascript
import { escapeHtml } from './helpers.mjs';

export function renderResumeTab(profile) {
  const url = escapeHtml(profile.resumeUrl);
  return `
    <div class="resume-header">
      <h2 id="resume-heading" class="section-title">Resume</h2>
      <a class="btn-primary" href="${url}" target="_blank" rel="noopener">Open in new tab</a>
    </div>
    <div class="card resume-frame-wrap">
      <iframe class="resume-frame" src="${url}" title="Anurag Bojja Resume"></iframe>
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-resume.test.mjs`
Expected: `render-resume.test.mjs: all assertions passed`

- [ ] **Step 5: Register the renderer in `js/main.mjs`**

Add import:
```javascript
import { renderResumeTab } from './render-resume.mjs';
```

Add registration:
```javascript
registerTabRenderer('resume', renderResumeTab);
```

- [ ] **Step 6: Add resume CSS to `app.css`**

```css
.resume-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.btn-primary { background: var(--accent); color: #fff; padding: 10px 16px; border-radius: 999px; font-weight: 700; font-size: 13.5px; }
.resume-frame-wrap { padding: 0; overflow: hidden; height: 80vh; }
.resume-frame { width: 100%; height: 100%; border: 0; }
```

- [ ] **Step 7: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html#resume`.
Expected: an "Open in new tab" button links to `https://anuragbojja.github.io/Resume/` and opens it in a new tab; below it, an iframe attempts to load the same URL inline (note: if the hosted resume page sets `X-Frame-Options`/CSP headers blocking framing, the iframe will show blank — the fallback button is exactly the mitigation for that, confirm the button still works even if the iframe is blank).

- [ ] **Step 8: Commit**

```bash
git add js/render-resume.mjs js/__tests__/render-resume.test.mjs js/main.mjs app.css
git commit -m "Add Resume tab with iframe embed and new-tab fallback"
```

---

### Task 14: Contact tab

**Files:**
- Create: `js/render-contact.mjs`
- Test: `js/__tests__/render-contact.test.mjs`
- Modify: `js/main.mjs` (register renderer)
- Modify: `app.css` (contact tab styling)

**Interfaces:**
- Consumes: `escapeHtml` (Task 4); `contact` shape (Task 2: `email`, `phone`, `location`, `socials: {label, url}[]`).
- Produces: `renderContactTab(contact): string`, registered for the `contact` tab.

- [ ] **Step 1: Write the failing test**

```javascript
// js/__tests__/render-contact.test.mjs
import assert from 'node:assert';
import { renderContactTab } from '../render-contact.mjs';

const contact = {
  email: 'anuragbojja23@gmail.com',
  phone: '+1 414-275-9169',
  location: 'Los Angeles, CA (Open to Remote & Relocation)',
  socials: [
    { label: 'Email', url: 'mailto:anuragbojja23@gmail.com' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/anurag-bojja-81a405192/' },
    { label: 'GitHub', url: 'https://github.com/AnuragBojja' }
  ]
};

const html = renderContactTab(contact);
assert.ok(html.includes('href="mailto:anuragbojja23@gmail.com"'));
assert.ok(html.includes('href="https://www.linkedin.com/in/anurag-bojja-81a405192/"'));
assert.ok(html.includes('href="https://github.com/AnuragBojja"'));
assert.ok(html.includes('Los Angeles, CA (Open to Remote &amp; Relocation)'));

console.log('render-contact.test.mjs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/__tests__/render-contact.test.mjs`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../js/render-contact.mjs'`

- [ ] **Step 3: Implement `js/render-contact.mjs`**

```javascript
import { escapeHtml } from './helpers.mjs';

export function renderContactTab(contact) {
  const links = contact.socials
    .map((s) => `<a class="btn-primary" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`)
    .join('');

  return `
    <h2 id="contact-heading" class="section-title">Get In Touch</h2>
    <div class="card contact-card">
      <h3>Quick Actions</h3>
      <p class="card-desc">Fast ways to reach me:</p>
      <div class="contact-actions">${links}</div>
      <div class="contact-info"><strong>Location:</strong> ${escapeHtml(contact.location)}</div>
    </div>
  `;
}
```

Note: `<a href="mailto:...">` targeting `_blank` is harmless (browsers just open the default mail client either way), so the Email link reuses the same markup as LinkedIn/GitHub without special-casing.

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/__tests__/render-contact.test.mjs`
Expected: `render-contact.test.mjs: all assertions passed`

- [ ] **Step 5: Register the renderer in `js/main.mjs`**

Add import:
```javascript
import { renderContactTab } from './render-contact.mjs';
```

Add registration:
```javascript
registerTabRenderer('contact', renderContactTab);
```

- [ ] **Step 6: Add contact CSS to `app.css`**

```css
.contact-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0; }
.contact-info { color: var(--muted); font-size: 14px; }
```

- [ ] **Step 7: Manual verification**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html#contact`.
Expected: Email/LinkedIn/GitHub buttons each work (Email opens the mail client via `mailto:`, LinkedIn/GitHub open in a new tab), and the location line is visible.

- [ ] **Step 8: Commit**

```bash
git add js/render-contact.mjs js/__tests__/render-contact.test.mjs js/main.mjs app.css
git commit -m "Add Contact tab with quick-action buttons"
```

---

### Task 15: Responsive, accessibility, and reduced-motion pass

**Files:**
- Modify: `app.css` (final breakpoint and accessibility pass)

**Interfaces:**
- Consumes: all CSS class names established in Tasks 6–14 (`.home-grid`, `.project-bento`, `.island`, `.about-subcards`, etc.) — no new JS interfaces.

- [ ] **Step 1: Add a consolidated reduced-motion override block to `app.css`**

(Earlier tasks already added scoped `@media (prefers-reduced-motion: reduce)` rules per component; this step adds the one still missing — the hero/bio/project tilt `transform` set inline by `js/tilt.mjs` needs a CSS escape hatch too, since `initTilt` already early-returns under reduced motion, but any lingering inline `transform` from a prior interaction should also be neutralized on re-render.)

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Add focus-visible styling for keyboard navigation (accessibility gap not yet covered)**

```css
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Manual verification checklist across breakpoints**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html`, use devtools device toolbar.

Expected at **375px width (mobile)**:
- Island nav shows icon-only pills with the active tab's label floating above it; all 5 icons plus the theme toggle fit on one row without horizontal overflow.
- Home dashboard cards stack to a single column in this order: Hero, Bio, About Me, Career Glimpse, Architecture Spec, Get In Touch.
- Projects tab tiles stack to a single column, large project first.
- No horizontal scrollbar appears on any of the 5 tabs.

Expected at **1280px width (desktop)**:
- Home dashboard shows the 3-column bento grid described in the spec.
- Projects tab shows the large/medium/small bento arrangement.
- Tab-to-tab keyboard navigation (Tab key) reaches every island item and shows a visible focus ring; pressing Enter on a focused island item switches tabs.

- [ ] **Step 4: Commit**

```bash
git add app.css
git commit -m "Add final responsive breakpoints and accessibility polish"
```

---

### Task 16: Cleanup old files and final integration pass

**Files:**
- Delete: `style.css`
- Delete: `script.js`
- Modify: `docs/superpowers/specs/2026-07-26-premium-portfolio-redesign-design.md` (no change needed — already marked superseded; verify only)

**Interfaces:** none (cleanup + verification only).

- [ ] **Step 1: Confirm nothing still references the old files**

Run: `grep -rn "style\.css\|script\.js" --include="*.html" .`
Expected: no matches (the new `index.html` from Task 6 only references `app.css` and `js/main.mjs`).

- [ ] **Step 2: Delete the superseded files**

```bash
git rm style.css script.js
```

- [ ] **Step 3: Run the full unit test suite one more time**

Run:
```bash
for f in js/__tests__/*.test.mjs; do echo "== $f =="; node "$f" || exit 1; done
```
Expected: every file prints its `all assertions passed` line, no non-zero exit.

- [ ] **Step 4: Full manual click-through (final acceptance check)**

Run: `python -m http.server 8000`, open `http://localhost:8000/index.html`.

Walk through and confirm all of the following:
- [ ] Page loads on Home in light theme by default (no OS dark-mode override).
- [ ] Clicking Experience/Projects/Resume/Contact in the island switches panels instantly without a full page reload (check devtools Network tab shows no new HTML document request).
- [ ] Experience tab: 3 roles, newest-first, tags visible, scroll-rail fills while scrolling.
- [ ] Projects tab: exactly 3 tiles (large/medium/small), tilt-on-hover and image zoom work, all GitHub links open correctly.
- [ ] Resume tab: iframe + working "Open in new tab" button.
- [ ] Contact tab: Email/LinkedIn/GitHub buttons work, location shown.
- [ ] Theme toggle switches to dark mode instantly, persists after a hard refresh, and matches the reference screenshot's dark aesthetic (near-navy background, glass cards).
- [ ] Direct navigation to `http://localhost:8000/index.html#projects` opens straight into the Projects tab.
- [ ] Browser back/forward buttons move between previously visited tabs.
- [ ] Resizing to 375px width keeps every tab usable with no horizontal scrollbar.
- [ ] No skills-specific tab or card exists anywhere; skill tags only appear inside Experience/Project cards.
- [ ] No NLP/Research project tile exists in Projects; the Springer publication is only referenced from the Home About Me / Education content.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove superseded style.css/script.js after dashboard redesign cutover"
```

---

## Post-Plan Follow-Ups (not part of this plan)

- Push the branch/commits to the `main` remote and confirm GitHub Pages redeploys correctly — do this only when the user explicitly asks to publish.
- If the hosted resume page at `https://anuragbojja.github.io/Resume/` blocks iframing (via `X-Frame-Options`), the fallback "Open in new tab" button already covers it; no plan change needed unless the user wants a different resume presentation.
