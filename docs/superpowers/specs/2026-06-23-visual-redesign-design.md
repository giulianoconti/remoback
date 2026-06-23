# Visual redesign: mobile-first, fixes oversized-image layout bug

## Goal

Full visual redesign of the "remove background" app. Fix the real bug where uploading a high-resolution image breaks the layout (image displayed at natural size inside a fixed 530px-wide container, causing the page to become a giant vertical scroll). Make the app mobile-first and genuinely responsive, with a modern light aesthetic, while keeping all existing functionality (multi-upload, shared color-range removal, zip download) unchanged.

## Current problems being fixed

- App container is hardcoded `max-width: 530px` (`src/index.css` `.max-w-530`), doesn't adapt to viewport.
- `ImageCard`'s display canvas is sized off `widthCanvasImg` (currently fixed at 530, only changes via a window-resize effect) — but the *card wrapper* has no max-height, so a tall image (e.g. a 1080px-tall upload) still pushes the whole page down because nothing caps the rendered canvas height independent of width.
- Visual design is dated: Arial, hard-edged dark purple gradient header, flat black color-range panel, no responsive grid — images stack one per row regardless of screen width.
- `images.map` grid (`flex flex-wrap justify-center` in `src/App.jsx`) never actually wraps into multiple columns because the outer shell itself is capped at 530px wide.

## Visual direction (chosen: "Light & Limpio")

- Background: light gray-blue (`#f4f6fb`), white cards with soft shadow (`box-shadow: 0 1px 4px rgba(0,0,0,.08)`).
- Primary accent: indigo/violet gradient (`#6366f1` → `#8b5cf6`) for header and primary button.
- Secondary/neutral buttons: light gray (`#e5e7eb` bg, dark gray text).
- Typography: system sans-serif stack (`-apple-system, "Inter", "Segoe UI", Roboto, sans-serif`) replacing `Arial, Helvetica, sans-serif`.
- Border radius: 8-12px consistently on cards/buttons (replacing today's sharp corners and the 5px `.border-radius-5` utility).
- Color-range panel: white card (not the current flat black `bg-rgb-50-50-50` panel), still containing the two RGB swatch previews + 6 range inputs, just restyled to match the light theme.

## Layout (mobile-first, responsive)

- Remove the fixed `max-width: 530px` app shell. Replace with a fluid container: `width: 100%`, `max-width: 960px` on large screens, centered, with side padding (`16px` on mobile, more on desktop).
- **Empty state** (no images uploaded yet): large centered drop zone with icon + "Drag & Drop" text + Browse button, similar to today but restyled to the new light/gradient look. Takes up the main visual focus.
- **Non-empty state** (1+ images uploaded): drop zone shrinks to a small "+ Agregar más" button/pill positioned above the image grid (still a drop target and still triggers the browse file input), freeing vertical space for the grid.
- **Image grid**: CSS Grid, `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, `gap: 12px`. On a narrow mobile viewport this naturally collapses to a single column (since 260px ≈ most phone widths minus padding); on tablet/desktop it fills available width with 2-3+ columns. This directly replaces the broken `flex flex-wrap` + fixed-width-shell combination.
- **Image card**: fixed-height thumbnail area (`height: 220px`, `width: 100%`), the canvas inside scaled via CSS (`max-width: 100%; max-height: 100%; object-fit: contain` equivalent achieved by computing canvas draw dimensions to fit within 220px height AND the card's content width, whichever is more constraining — see Implementation Notes). This caps vertical space per card regardless of the uploaded image's actual resolution, fixing the core layout bug. Filename below the thumbnail, truncated with `text-overflow: ellipsis` if long. A small checkmark/badge in a corner once `processed` is true.
- Color-range panel and action buttons render below the grid, same relative order as today, just restyled.
- Footer ("Made by: Giuliano Conti") restyled with muted gray text, no background block, sits below everything.

## Components touched

- `src/index.css` — full rewrite of utility classes to the new design tokens (colors, spacing, radius, font). Existing class *names* can mostly stay (`.btn`, `.bg-transparent-img`, etc.) since `App.jsx`/`ImageCard.jsx` reference them by name — only their declarations change. New classes added as needed for the grid and collapsed-dropzone states.
- `src/App.jsx` — JSX restructuring for: fluid container, collapsed/expanded drop zone state (new piece of UI state, e.g. derived from `images.length === 0`), grid container class swap (from flex to the new CSS grid class), button row restyle (class names only, mostly).
- `src/components/ImageCard.jsx` — thumbnail sizing logic changes: instead of computing `useWidth`/`useHeight` purely from `widthCanvasImg` (a global responsive-but-still-single-target width), compute display dimensions that fit within a fixed card height (220px) while preserving aspect ratio, capped by the card's own content width too (for very wide/panoramic images). The full-resolution `fullCanvasRef` (added in the multi-image-upload work) is untouched — this only changes how `displayCanvasRef` is sized for preview.
- `src/components/Footer.jsx` — restyle only (no structural change), read current content first.
- `src/components/ChooseColorRangeItem.jsx`, `src/components/ChooseColorColorItem.jsx` — restyle only (className/CSS changes), read current implementation first to confirm no structural JSX changes needed beyond class names.

## Out of scope

- No new functionality (no per-image color override, no reorder/remove individual images, no progress indicators) — this is a pure visual/layout redesign of existing features.
- No CSS framework migration (no Tailwind/styled-components adoption) — stays with the existing hand-rolled utility-class approach in `src/index.css`, just modernized.
- No change to the multi-image upload, background-removal, or zip-download *logic* — only how things look and how the image cards size themselves.
- Sticky/fixed action bar was considered and explicitly rejected — buttons stay in normal document flow, same relative position as today.
- Color-range panel collapsing into an accordion was considered and explicitly rejected — stays always visible.
