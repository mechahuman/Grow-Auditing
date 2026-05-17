# Complete UI Redesign Documentation

This document serves as the master blueprint for overhauling the UI of the GROW Audit Tool. Feed this document to Claude Code to systematically implement a cohesive, premium, and responsive design system.

## 1. Core Design System & Palette

### 1.1 Color Palette (Derived from user-provided image)
The application will use a deeply integrated, oceanic-inspired color palette that scales smoothly from a vibrant mint to a deep navy. **Dark mode is the default.**

*   **Color 100 (Lightest / Primary Accent):** `#A4F4C9` (Light Mint Green) - Used for primary buttons, active text, glowing effects, and success states.
*   **Color 400 (Secondary Accent):** `#6EB498` (Sea Green) - Used for secondary buttons, active borders, and subtle highlights.
*   **Color 700 (Surface/Card):** `#1A5A63` (Dark Teal) - Used for elevated surfaces, cards, and input fields in dark mode.
*   **Color 900 (Background/Deep):** `#0D3B66` (Deep Navy) - Used for the main application background.

### 1.2 Theming Strategy (Tailwind CSS)
Use CSS variables in `app/globals.css` mapped to Tailwind in `tailwind.config.ts` to ensure seamless switching between Dark (Default) and Light modes.

**Dark Mode (Default):**
*   `--background`: `#0D3B66`
*   `--surface`: `#1A5A63` (with 50% opacity for glassmorphism)
*   `--border`: `#6EB498` (with 20% opacity)
*   `--text-primary`: `#FFFFFF`
*   `--text-secondary`: `#A4F4C9` (Mint) for subtitles/links, or light gray for body.
*   `--primary-glow`: `rgba(164, 244, 201, 0.4)`

**Light Mode:**
*   `--background`: `#F8FAFC`
*   `--surface`: `#FFFFFF`
*   `--border`: `#E2E8F0`
*   `--text-primary`: `#0D3B66`
*   `--text-secondary`: `#1A5A63`

### 1.3 Gradients & Effects (Referencing `output_review_screen/image copy 2.png`)
*   **Background Gradients:** Apply a subtle, large radial gradient using the Deep Navy (`#0D3B66`) and Dark Teal (`#1A5A63`) to give the background depth rather than being flat.
*   **Text Gradients:** Key headings (like "Audit Complete" or "Dashboard") should use `bg-gradient-to-r from-[#A4F4C9] to-[#6EB498] bg-clip-text text-transparent`.
*   **Glassmorphism:** Cards and sidebars should utilize `backdrop-blur-md` and semi-transparent surface colors (e.g., `bg-[#1A5A63]/50`) over the gradient backgrounds.

### 1.4 Typography & Spacing
*   **Font:** Use `Inter` for clean, modern readability, or `Outfit` for a slightly more geometric, tech-forward look.
*   **Borders:** Use `rounded-xl` or `rounded-2xl` for large cards, and `rounded-lg` for buttons and inputs. Sharp edges should be avoided.

---

## 2. Screen-by-Screen Implementation Guide

### 2.1 Login Screen (`app/login/page.tsx`)
*   **Layout:** Split-screen or large central glass card.
*   **Background:** Deep Navy with a slow-moving, subtle glowing orb of Dark Teal (`#1A5A63`) in the background.
*   **Form:** A frosted glass card (`bg-[#1A5A63]/40 backdrop-blur-xl border border-[#6EB498]/30`).
*   **Inputs:** Semi-transparent dark inputs with Mint Green (`#A4F4C9`) outline on focus.

### 2.2 Lead Entering Screen (`app/(authenticated)/enrich/page.tsx`)
*   **Layout:** Centered, focused view.
*   **UI:** A large, prominent URL input field centered on the screen. 
*   **Button:** A highly visible "Start Audit" button utilizing the Light Mint Green (`#A4F4C9`) background with Dark Navy (`#0D3B66`) text. Add a hover effect that scales the button up slightly and adds a drop shadow (`shadow-[#A4F4C9]/50`).

### 2.3 Loading / Progress Screen (`app/(authenticated)/enrich/progress/page.tsx`)
*   **Layout:** Centered status.
*   **UI:** Replace standard spinners with a smooth, pulsing progress bar or a step-tracker (e.g., "1. Fetching Data -> 2. Analyzing -> 3. Finalizing").
*   **Colors:** The progress bar fill should use the Mint-to-Sea-Green gradient.

### 2.4 Saved Leads Dashboard (`app/(authenticated)/leads/page.tsx`)
*   **Layout:** Full-width container with a top navigation or sidebar.
*   **Table UI:** 
    *   Header row in solid Dark Teal (`#1A5A63`).
    *   Alternating row colors (Deep Navy and slightly lighter Navy).
    *   **Badges:** Statuses or Scores should be pill-shaped (`rounded-full`). High scores get Mint Green text/border, low scores get warning colors.
*   **Search/Filter:** Floating search bar at the top with a glass effect.

### 2.5 Output / Review Screen (`app/(authenticated)/leads/[id]/review/page.tsx`)
*   **Layout:** Multi-column layout (e.g., 25% sidebar for profile info, 75% main area for audit).
*   **Sidebar (Profile & Contact Details):** 
    *   Should look like a cohesive ID card.
    *   Include the new "Contact Details" (Email, Twitter, Instagram) prominently with quick-copy icons.
*   **Main Content (Audit & Scoring):**
    *   Use Markdown rendering styled with `@tailwindcss/typography`.
    *   Prose should be light gray (`text-gray-200`) in dark mode for readability against the Dark Teal/Navy cards.
    *   Headers inside the audit should use the Mint gradient.
*   **Gradients:** The background of this specific screen should heavily utilize the radial gradient references found in `output_review_screen/image copy 2.png` to make the final result feel premium and rewarding.

---

## 3. Implementation Steps for the Coding Agent

1.  **Phase 1: Setup Global CSS & Tailwind Config**
    *   Extract the hex codes into CSS variables in `globals.css` for both `.dark` (default) and `:root` (light).
    *   Update `tailwind.config.ts` to map colors to `var(--...)`.
    *   Install necessary dependencies (e.g., `lucide-react` for icons, `clsx` and `tailwind-merge` for class utility).
2.  **Phase 2: Build Base Components**
    *   Create reusable `Card`, `Button`, `Input`, and `Badge` components applying the glassmorphism and mint-green hover states.
3.  **Phase 3: Apply to Pages**
    *   Go through the 6 pages sequentially, replacing standard divs with the new UI components.
    *   Ensure the `Output / Review Screen` perfectly mimics the requested gradient feel from the inspiration folder.
