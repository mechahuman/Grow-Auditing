# Claude Code Prompt — GreenTrace Design System Upgrade

## Context & Goal

You are helping upgrade the visual design of **GreenTrace** — a Vite + React + TailwindCSS v3 web application that analyzes the carbon footprint of machine learning notebooks.

The app already exists at `frontend/src/`. **Do not touch any business logic, API calls, state management, or data processing.** Only upgrade the visual layer.

The design inspiration comes from a premium dark-mode finance dashboard (Quantra AI / Bloomberg-style). The key design language to replicate is:

- **Layered radial gradient backgrounds** — deep color blooms, not flat colors
- **Glassmorphism cards** — frosted-glass panels with subtle border glow
- **Purple glow accents** — box-shadows and text gradients that feel electric
- **Staggered micro-animations** — cards fade up on mount, buttons lift on hover
- **Data-dense but breathable** — tight typography with generous negative space

---

## GreenTrace Color Palette (DO NOT CHANGE THESE COLORS)

The app owns these exact brand colors. Use them — do not substitute:

```
Background base:    #030303   (near-black)
Surface:            #0a0a0a
Surface highlight:  #141414
Accent primary:     #a855f7   (purple-500)
Accent soft:        #c084fc   (purple-400)
Accent dark:        #4c1d95   (purple-900)
Green signal:       #22c55e   (green-500) — used only for eco/carbon metrics
White text:         #ffffff
Secondary text:     rgba(255,255,255,0.65)
Muted text:         rgba(255,255,255,0.35)
```

---

## Typography (ALREADY IMPORTED — do not re-import)

The app already imports these from Google Fonts:

| Role | Font | Weights |
|---|---|---|
| Display / Hero headings | `Syne` | 700, 800 |
| UI headings & body | `Space Grotesk` | 300–700 |
| Body / form text | `Inter` | 300–600 |
| Code / mono values | `JetBrains Mono` | 400, 500 |

**Typography rules to apply:**
- Hero `h1`: `Syne`, weight 800, `letter-spacing: -0.03em`, size `3.5rem–5rem`
- Section `h2`: `Space Grotesk`, weight 700, `letter-spacing: -0.02em`
- Body prose: `Inter`, weight 400, `line-height: 1.7`, `font-size: 0.95rem`
- Metric numbers: `JetBrains Mono`, weight 500, `font-variant-numeric: tabular-nums`
- Apply `-webkit-font-smoothing: antialiased` globally (already set)

---

## What to Build — Step by Step

### STEP 1 — Upgrade `index.css` Global Tokens

Add these CSS custom properties inside `:root` (keep all existing Tailwind directives):

```css
:root {
  /* Semantic surface tokens */
  --bg-base:        #030303;
  --bg-surface:     #0a0a0a;
  --bg-elevated:    #141414;

  /* Accent tokens */
  --accent:         #a855f7;
  --accent-soft:    #c084fc;
  --accent-dark:    #4c1d95;
  --accent-green:   #22c55e;

  /* Border tokens */
  --border-subtle:  rgba(168, 85, 247, 0.15);
  --border-accent:  rgba(168, 85, 247, 0.40);

  /* Text tokens */
  --text-primary:   #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-muted:     rgba(255, 255, 255, 0.35);

  /* Glow tokens */
  --glow-purple:    rgba(168, 85, 247, 0.35);
  --glow-green:     rgba(34, 197, 94, 0.30);
}
```

---

### STEP 2 — Background Gradient System

**Replace** the current flat `background-color: #030303` body rule with this layered radial gradient. Keep `background-attachment: fixed`:

```css
body {
  background:
    radial-gradient(ellipse 70% 50% at 15% 0%,   rgba(76, 29, 149, 0.40) 0%, transparent 65%),
    radial-gradient(ellipse 50% 40% at 85% 100%, rgba(168, 85, 247, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse 35% 35% at 50% 50%,  rgba(34, 197, 94, 0.05) 0%, transparent 70%),
    #030303;
  background-attachment: fixed;
}
```

**The philosophy behind these layers:**
1. **Top-left bloom** — deep violet/indigo (`#4c1d95`) casts the primary ambient color
2. **Bottom-right bloom** — soft purple (`#a855f7`) adds depth and dimension
3. **Center micro-bloom** — a barely-visible green pulse ties in the eco brand identity
4. **Base coat** — pure `#030303` fills everything else

---

### STEP 3 — Glassmorphism Card Utility Classes

Add these reusable classes to `index.css` under `@layer components`:

```css
/* Primary glass card */
.card-glass {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.75) 0%, rgba(10, 10, 10, 0.60) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-subtle);
  border-radius: 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 8px 40px rgba(0, 0, 0, 0.5);
}

/* Metric / stat card with purple tint */
.card-metric {
  background: linear-gradient(145deg, rgba(168, 85, 247, 0.10) 0%, rgba(10, 10, 10, 0.85) 100%);
  border: 1px solid var(--border-accent);
  border-radius: 1rem;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.card-metric:hover {
  border-color: rgba(168, 85, 247, 0.60);
  background: linear-gradient(145deg, rgba(168, 85, 247, 0.16) 0%, rgba(10, 10, 10, 0.85) 100%);
}

/* Highlight card — purple-to-green (brand gradient) */
.card-highlight {
  background: linear-gradient(135deg, #4c1d95 0%, #a855f7 55%, #22c55e 100%);
  border-radius: 1.25rem;
}
```

---

### STEP 4 — Text Gradient Utilities

```css
/* Primary heading gradient: purple → green (brand signature) */
.text-gradient-brand {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Soft purple heading gradient */
.text-gradient-soft {
  background: linear-gradient(90deg, #c084fc 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Green accent gradient (for carbon/eco numbers) */
.text-gradient-eco {
  background: linear-gradient(90deg, #22c55e 0%, #86efac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

### STEP 5 — Glow Effects

```css
/* Button glow — purple */
.btn-glow {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.45), 0 4px 16px rgba(168, 85, 247, 0.25);
}
.btn-glow:hover {
  box-shadow: 0 0 32px rgba(168, 85, 247, 0.65), 0 8px 24px rgba(168, 85, 247, 0.35);
  transform: translateY(-1px);
}

/* Button glow — green (eco actions) */
.btn-glow-green {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.40), 0 4px 16px rgba(34, 197, 94, 0.20);
}
.btn-glow-green:hover {
  box-shadow: 0 0 32px rgba(34, 197, 94, 0.60), 0 8px 24px rgba(34, 197, 94, 0.30);
  transform: translateY(-1px);
}

/* Ambient orb — place as a fixed/absolute pseudo-element behind hero content */
.orb-purple {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}
.orb-green {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
}
```

---

### STEP 6 — Progress / Data Visualization Gradients

For any progress bars, score bars, or chart fills:

```css
/* Standard data bar — purple to green (carbon score direction) */
.gradient-bar-fill {
  background: linear-gradient(90deg, #4c1d95 0%, #a855f7 50%, #22c55e 100%);
  border-radius: 999px;
}

/* Area chart fill */
.gradient-chart-area {
  background: linear-gradient(180deg,
    rgba(168, 85, 247, 0.45) 0%,
    rgba(34, 197, 94, 0.20) 50%,
    transparent 100%
  );
}
```

---

### STEP 7 — Micro-Animations

Add to `index.css` (outside `@layer` blocks):

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Stagger children automatically */
.animate-stagger > *:nth-child(1) { animation-delay: 0.05s; }
.animate-stagger > *:nth-child(2) { animation-delay: 0.10s; }
.animate-stagger > *:nth-child(3) { animation-delay: 0.15s; }
.animate-stagger > *:nth-child(4) { animation-delay: 0.20s; }
.animate-stagger > *:nth-child(5) { animation-delay: 0.25s; }

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(168, 85, 247, 0.30); }
  50%       { box-shadow: 0 0 36px rgba(168, 85, 247, 0.70); }
}
.animate-pulse-glow {
  animation: pulseGlow 2.2s ease-in-out infinite;
}

/* Shimmer for loading skeletons */
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.02) 25%,
    rgba(168, 85, 247, 0.07) 50%,
    rgba(255,255,255,0.02) 75%
  );
  background-size: 1200px 100%;
  animation: shimmer 1.6s infinite;
  border-radius: 0.5rem;
}
```

---

### STEP 8 — Input Field Styling

```css
.input-glass {
  background: rgba(10, 10, 10, 0.80);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.input-glass::placeholder {
  color: var(--text-muted);
}
.input-glass:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.18);
  background: rgba(20, 20, 20, 0.90);
}
```

---

### STEP 9 — Custom Scrollbar

```css
::-webkit-scrollbar       { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(168, 85, 247, 0.35);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 85, 247, 0.60);
}
```

---

### STEP 10 — Apply Classes to Existing Components

After adding all the CSS above, go through each existing component and apply the new classes. **Rules:**

1. **`Landing.jsx`** — Add orb divs (`.orb-purple` top-left, `.orb-green` bottom-right), wrap the hero headline in `.text-gradient-brand`, add `.animate-fade-up .animate-stagger` to the section
2. **`UploadZone.jsx`** — Wrap the upload area in `.card-glass`, add `.input-glass` to any text inputs, add `.btn-glow` to the primary action button, use `.text-gradient-soft` for the section heading
3. **`Dashboard.jsx`** — Wrap metric tiles in `.card-metric .animate-stagger`, use `.text-gradient-eco` for carbon numbers displayed with `JetBrains Mono`, apply `.gradient-bar-fill` to any score bars
4. **`AboutUs.jsx` / `Research.jsx`** — Apply `.card-glass` to content panels, `.text-gradient-soft` to section headings, `.animate-fade-up` to sections on scroll

**Do NOT:**
- Remove any existing Tailwind utility classes that control layout (`flex`, `grid`, `p-`, `m-`, etc.)
- Change any `onClick` handlers or state variables
- Alter any API call parameters or response parsing

---

## Summary of the Design Philosophy

The design language you are replicating has one core principle: **depth through light.** Every surface should feel like it is emitting or refracting light, not just sitting flat on a page. Achieve this by:

1. **Never using a single flat color for backgrounds** — always use 3+ layered radial gradients
2. **Borders as light sources** — subtle purple-tinted borders that glow on hover
3. **Text that vibrates** — gradient text on all headings larger than `h3`
4. **Shadows that feel volumetric** — combine `box-shadow` with `backdrop-filter: blur()` on cards
5. **Motion that breathes** — fade-up on mount, lift on hover, pulse on loading states

The GreenTrace brand adds one twist over the inspiration source: **the green signal.** Wherever data represents a carbon/eco metric (scores, efficiency numbers, improvement deltas), accent it with the `--accent-green` token and `text-gradient-eco` — this creates a brand-specific visual language that pure purple-only dashboards don't have.
