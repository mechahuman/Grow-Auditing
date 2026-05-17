# GROW Inc. — UI Design Guide for Claude Code

> **⚠️ IMPORTANT INSTRUCTION FOR CLAUDE CODE**
> This document is the single source of truth for the complete UI redesign of the GROW Audit Tool.
> Read this document in full before making any changes. **If you have any questions at any stage, stop and ask before proceeding.** Do not make assumptions—always clarify ambiguities with the user first.

---

## 0. Asset Inventory

All reference assets live in `ui_inspirations/details/`:

| File | Role |
|---|---|
| `logo.png` | Primary logo — use as `<img>` in the navbar AND as the page `favicon` |
| `logo2.png` | Alternate wordmark logo (text-only variant) — use in sidebar / compact spots |
| `inspiration.png` | Layout & gradient reference — a dark-mode finance dashboard (Quantra AI style) |
| `color_palette.png` | Canonical color swatches extracted directly from the GROW logo |

**Favicon Setup:**
```html
<!-- In every page's <head> -->
<link rel="icon" type="image/png" href="/ui_inspirations/details/logo.png" />
```
Or copy `logo.png` to `public/favicon.png` and reference it as `/favicon.png`.

---

## 1. Brand Colors — The Complete Palette

Extracted exactly from `color_palette.png` (derived from the GROW Inc. logo):

### 1.1 Primary Palette

| Token Name | Hex | Visual | Usage |
|---|---|---|---|
| `--color-navy` | `#002680` | Deep navy blue | Page backgrounds, darkest surfaces |
| `--color-cobalt` | `#0b3d91` | Royal blue | Secondary backgrounds, sidebar base |
| `--color-violet` | `#3a0ca3` | Deep violet/indigo | Accent backgrounds, active states |
| `--color-purple` | `#862ffa` | Vivid purple | Primary interactive accents, buttons |
| `--color-grape` | `#9237ff` | Medium purple | Hover states, gradient midpoints |
| `--color-lavender` | `#9b5de5` | Soft lavender | Tertiary accents, tags, badges |
| `--color-pink` | `#f15bb5` | Hot pink / magenta | CTA highlights, alerts, energy accents |
| `--color-black` | `#000000` | Pure black | Text on light, overlays |
| `--color-white` | `#ffffff` | Pure white | Text on dark, surface highlights |

### 1.2 CSS Variables (place in `globals.css` or `index.css`)

```css
:root {
  /* === GROW Brand Palette === */
  --color-navy:     #002680;
  --color-cobalt:   #0b3d91;
  --color-violet:   #3a0ca3;
  --color-purple:   #862ffa;
  --color-grape:    #9237ff;
  --color-lavender: #9b5de5;
  --color-pink:     #f15bb5;
  --color-black:    #000000;
  --color-white:    #ffffff;

  /* === Semantic Tokens (Dark Mode Default) === */
  --bg-base:        #09061a;          /* deeper than navy — near-black purple */
  --bg-surface:     #12103a;          /* card/panel background */
  --bg-elevated:    #1a1850;          /* elevated elements */
  --border-subtle:  rgba(134, 47, 250, 0.20);
  --border-accent:  rgba(134, 47, 250, 0.50);

  --text-primary:   #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-muted:     rgba(255, 255, 255, 0.35);

  --accent-primary: #862ffa;          /* purple — primary CTA */
  --accent-hover:   #9237ff;          /* grape on hover */
  --accent-pink:    #f15bb5;          /* pink — secondary CTA / energy */
  --accent-glow:    rgba(134, 47, 250, 0.35);
  --pink-glow:      rgba(241, 91, 181, 0.35);
}
```

---

## 2. Gradients — Reference: `inspiration.png`

The inspiration image shows a **dark, data-rich dashboard** with glowing purple-to-pink gradients on charts and key cards. Replicate this energy throughout.

### 2.1 Background Gradients

```css
/* === Page background — deep radial purple bloom === */
.bg-page {
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(58, 12, 163, 0.45) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 100%, rgba(134, 47, 250, 0.25) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(241, 91, 181, 0.08) 0%, transparent 70%),
    #09061a;
}

/* === Sidebar gradient === */
.bg-sidebar {
  background: linear-gradient(180deg, #12103a 0%, #09061a 100%);
  border-right: 1px solid var(--border-subtle);
}
```

### 2.2 Card & Panel Gradients

```css
/* === Glassmorphism card (primary) === */
.card-glass {
  background: linear-gradient(135deg, rgba(26, 24, 80, 0.7) 0%, rgba(18, 16, 58, 0.5) 100%);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}

/* === Highlight card — purple-to-pink (like the CTA card in inspiration) === */
.card-highlight {
  background: linear-gradient(135deg, #3a0ca3 0%, #862ffa 50%, #f15bb5 100%);
  border-radius: 16px;
}

/* === Metric / stat card === */
.card-metric {
  background: linear-gradient(145deg, rgba(134, 47, 250, 0.15) 0%, rgba(18, 16, 58, 0.8) 100%);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
}
```

### 2.3 Text Gradients (for headings)

```css
/* === Primary gradient heading === */
.text-gradient-primary {
  background: linear-gradient(90deg, #862ffa 0%, #f15bb5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* === Violet-to-lavender heading === */
.text-gradient-soft {
  background: linear-gradient(90deg, #9b5de5 0%, #862ffa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 2.4 Chart / Visualization Gradients

When rendering any score bar, progress bar, or data visualization:

```css
/* Fill gradient for bars/progress */
.gradient-bar-fill {
  background: linear-gradient(90deg, #3a0ca3 0%, #862ffa 50%, #f15bb5 100%);
}

/* Area chart fill (inspired by the portfolio chart in inspiration.png) */
.gradient-chart-area {
  background: linear-gradient(180deg, rgba(134, 47, 250, 0.5) 0%, rgba(241, 91, 181, 0.2) 50%, transparent 100%);
}
```

### 2.5 Glow Effects

```css
/* Purple glow button shadow */
.btn-glow {
  box-shadow: 0 0 20px rgba(134, 47, 250, 0.5), 0 4px 15px rgba(134, 47, 250, 0.3);
}

/* Pink glow accent */
.accent-glow-pink {
  box-shadow: 0 0 24px rgba(241, 91, 181, 0.45);
}

/* Subtle card inner glow */
.card-inner-glow {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

---

## 3. Typography

```css
/* Import in <head> or at top of global CSS */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
}

/* Scale */
h1 { font-size: 2rem;   font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
h3 { font-size: 1.25rem; font-weight: 600; }
h4 { font-size: 1rem;   font-weight: 600; }
```

---

## 4. Component Specifications

### 4.1 Navigation / Sidebar

Modeled after the left sidebar in `inspiration.png`:

```
┌─────────────────────────────┐
│  [logo.png]  GROW Inc.      │  ← Logo image + wordmark
│  ─────────────────────────  │
│  ● Dashboard  (active)      │  ← Pill-highlighted active item (purple bg)
│    Lead Entry               │
│    Saved Leads              │
│    Review                   │
│  ─────────────────────────  │
│  [avatar]  User Name        │  ← Bottom user info
│            user@email.com   │
└─────────────────────────────┘
```

- Width: `240px` (desktop), collapsible on mobile
- Background: `bg-sidebar` gradient
- Active nav item: `background: rgba(134, 47, 250, 0.25); border-left: 3px solid #862ffa; color: #fff;`
- Inactive nav item: `color: var(--text-secondary);` — hover adds `rgba(134, 47, 250, 0.12)` background

### 4.2 Buttons

```css
/* Primary button */
.btn-primary {
  background: linear-gradient(135deg, #862ffa 0%, #9237ff 100%);
  color: #fff;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(134, 47, 250, 0.35);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(134, 47, 250, 0.5);
  background: linear-gradient(135deg, #9237ff 0%, #862ffa 100%);
}

/* Secondary (outlined) button */
.btn-secondary {
  background: transparent;
  color: #862ffa;
  border: 1px solid rgba(134, 47, 250, 0.5);
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background: rgba(134, 47, 250, 0.12);
  border-color: #862ffa;
}

/* CTA / energy button (pink) */
.btn-cta {
  background: linear-gradient(135deg, #f15bb5 0%, #862ffa 100%);
  color: #fff;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 6px 20px rgba(241, 91, 181, 0.4);
  transition: all 0.2s ease;
}
.btn-cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 30px rgba(241, 91, 181, 0.55);
}
```

### 4.3 Input Fields

```css
.input-field {
  background: rgba(18, 16, 58, 0.8);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 12px 16px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  width: 100%;
}
.input-field::placeholder { color: var(--text-muted); }
.input-field:focus {
  outline: none;
  border-color: #862ffa;
  box-shadow: 0 0 0 3px rgba(134, 47, 250, 0.2);
  background: rgba(26, 24, 80, 0.9);
}
```

### 4.4 Score / Badge Pills

```css
/* High score — green-ish */
.badge-high {
  background: rgba(134, 47, 250, 0.2);
  border: 1px solid rgba(134, 47, 250, 0.5);
  color: #c084fc;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Medium score */
.badge-medium {
  background: rgba(241, 91, 181, 0.15);
  border: 1px solid rgba(241, 91, 181, 0.4);
  color: #f9a8d4;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Low score */
.badge-low {
  background: rgba(11, 61, 145, 0.3);
  border: 1px solid rgba(11, 61, 145, 0.6);
  color: #93c5fd;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
```

---

## 5. Page-by-Page Implementation

### 5.1 Login Page

**Goal:** Confident, premium first impression. Frosted glass card on a deep purple gradient background with glowing orbs.

- Background: Use `.bg-page` radial gradient
- Add 2 large blurred orbs (CSS pseudo-elements): one purple (`#3a0ca3`, `opacity: 0.4`, `blur: 100px`) top-left, one pink (`#f15bb5`, `opacity: 0.25`, `blur: 80px`) bottom-right
- Center a single glass card (`card-glass`) ~420px wide with: logo image, app title with `.text-gradient-primary`, email/password inputs, primary login button
- Add subtle fade-in animation on load

### 5.2 Lead Entry Page (Enrich)

**Goal:** Focused, minimal. One URL field, one big action.

- Full-height centered layout on the `bg-page` background
- Large heading: "Start an Audit" using `.text-gradient-primary`
- URL input field with an icon prefix (link icon), full width, max `600px`
- Giant "Run Audit →" button using `.btn-cta` (pink-to-purple gradient)
- Hint text below in `var(--text-muted)` color

### 5.3 Progress / Loading Page

**Goal:** Keep the user engaged during wait time.

- Centered layout with a step-tracker strip: `Fetching → Analyzing → Scoring → Complete`
- Each active step glows with `--accent-primary`
- An animated pulsing bar using `gradient-bar-fill` (purple-to-pink)
- Status message text below in `var(--text-secondary)`

### 5.4 Saved Leads Dashboard

**Goal:** Data-rich, inspired heavily by `inspiration.png` dashboard layout.

- **Layout:** Sidebar (`bg-sidebar`) + main content area (`bg-page`)
- **Top bar:** Breadcrumb + search bar (glass input, no borders) + notification icon
- **Stats row:** 3–4 `card-metric` tiles showing total leads, avg score, high-priority count, etc.
- **Table:**
  - Header: `background: rgba(134, 47, 250, 0.15); color: var(--text-secondary);`
  - Rows: alternate between `rgba(18, 16, 58, 0.6)` and `rgba(26, 24, 80, 0.4)`
  - Score column uses `badge-high / badge-medium / badge-low`
  - Row hover: `background: rgba(134, 47, 250, 0.08);` with smooth transition
- **Floating search:** glass-style input at top of table, with purple focus ring

### 5.5 Output / Review Page

**Goal:** The payoff screen — premium, data-dense, rewarding feel exactly like the inspiration gradient treatment.

- **Layout:** 2-column: `280px` fixed sidebar (profile card) + flexible main content
- **Sidebar (profile card):**
  - Uses `.card-highlight` (purple-to-pink gradient) for the header band
  - Shows company name, logo/avatar, URL, sub-range, all contact details (email, Twitter, Instagram) with copy-icon buttons
  - Score displayed large with `.text-gradient-primary`
- **Main content:**
  - Background orbs matching `inspiration.png` — large radial purple bloom top-right
  - Audit sections rendered as `card-glass` panels
  - Section headings use `.text-gradient-soft`
  - Markdown prose: `color: rgba(255,255,255,0.85);` for body, headers styled with gradient
- **Score breakdown bar:** horizontal `gradient-bar-fill` bar per category

---

## 6. Micro-Animations

Add these throughout for the premium, "alive" feel seen in `inspiration.png`:

```css
/* Fade in upward (for cards and page content) */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeInUp 0.4s ease both; }

/* Stagger children */
.animate-stagger > *:nth-child(1) { animation-delay: 0.05s; }
.animate-stagger > *:nth-child(2) { animation-delay: 0.10s; }
.animate-stagger > *:nth-child(3) { animation-delay: 0.15s; }
.animate-stagger > *:nth-child(4) { animation-delay: 0.20s; }

/* Pulsing glow for loading states */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(134, 47, 250, 0.3); }
  50%       { box-shadow: 0 0 30px rgba(134, 47, 250, 0.7); }
}
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

/* Shimmer for skeleton loaders */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(134,47,250,0.08) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

---

## 7. Logo Usage Rules

### Primary Logo (`logo.png`)
- **Navbar top-left:** display at `height: 36px; width: auto;`
- **Login page:** centered, `height: 64px; width: auto;` above the form card
- **Favicon:** `<link rel="icon" href="/favicon.png" />` (copy `logo.png` → `public/favicon.png`)

### Alternate Wordmark (`logo2.png`)
- Use in compact sidebar footer or email/print contexts only
- Do not use as favicon

### Never:
- Stretch or distort either logo
- Place logo on a background that clashes with the brand colors
- Apply filters or recolor the logo

---

## 8. Scrollbar Styling

```css
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(134, 47, 250, 0.4);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover { background: rgba(134, 47, 250, 0.7); }
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Behaviour |
|---|---|---|
| Mobile | < 768px | Sidebar hidden (hamburger menu), single column layout |
| Tablet | 768–1024px | Sidebar collapsible icon-only mode |
| Desktop | > 1024px | Full sidebar visible, multi-column layouts active |

---

## 10. Implementation Checklist

Work through this in order. **Stop and ask the user if any requirement is unclear before proceeding.**

- [ ] **Step 1 — Global CSS:** Set all CSS variables, import Inter font, apply `bg-page` to `body`
- [ ] **Step 2 — Favicon:** Copy `logo.png` to `public/favicon.png`, add `<link>` in layout
- [ ] **Step 3 — Reusable Components:** Build `Card`, `Button`, `Input`, `Badge`, `Sidebar`, `Navbar`
- [ ] **Step 4 — Login Page:** Glass card, gradient background, animated orbs
- [ ] **Step 5 — Lead Entry Page:** Centered layout, big URL input, CTA button
- [ ] **Step 6 — Progress Page:** Step tracker, animated gradient progress bar
- [ ] **Step 7 — Saved Leads Dashboard:** Sidebar layout, metric cards, styled table
- [ ] **Step 8 — Review / Output Page:** Two-column layout, profile card, audit panels
- [ ] **Step 9 — Polish:** Add micro-animations, custom scrollbar, responsive testing
- [ ] **Step 10 — Review with user** before finalizing

---

## 11. Strict Rules for Claude Code

1. **Always ask before assuming.** If something is ambiguous (e.g., exact wording, which component to replace), ask the user.
2. **Never remove existing business logic.** Only change visual styling and layout.
3. **Use the exact hex values** from Section 1 — do not substitute with Tailwind color names that approximate them.
4. **Dark mode is the only mode.** Do not implement light mode unless explicitly asked.
5. **No placeholder images.** Use the actual `logo.png` from `ui_inspirations/details/`.
6. **Preserve all existing props, state, and API calls** during component rewrites.
7. **Commit after each page** is complete so changes can be reviewed incrementally.
