# Design System: Neo-Premium Minimalist

This document outlines the design principles and specifications for the measurement web UI, following an Apple-inspired "Neo-Premium Minimalist" aesthetic.

## 1. Aesthetic Overview

The site follows Apple’s signature **"Neo-Premium Minimalist"** aesthetic.

- **Key Characteristics**: massive white space, high-fidelity 3D product renders, and "scroll-triggered" storytelling.
- **Spatial UI**: The interface is designed to feel "spatial"—mirroring the product itself—using depth, glassmorphism, and smooth transitions.

## 2. Typography (The "SF" System)

The typography system uses Apple’s proprietary **San Francisco (SF Pro)** family. The hierarchy is strictly defined for readability and impact.

### Font Specifications

| Element            | Font Family    | Weight         | Size (Desktop) | Color                |
| :----------------- | :------------- | :------------- | :------------- | :------------------- |
| **Main Headlines** | SF Pro Display | 600 (Semibold) | 80px - 120px   | #1d1d1f (Deep Black) |
| **Sub-headlines**  | SF Pro Display | 600 (Semibold) | 48px - 56px    | #1d1d1f (Deep Black) |
| **Section Intro**  | SF Pro Display | 600 (Semibold) | 28px - 32px    | #86868b (Gray)       |
| **Body Copy**      | SF Pro Text    | 400 (Regular)  | 19px - 21px    | #1d1d1f (Deep Black) |
| **Caption/Small**  | SF Pro Text    | 400 (Regular)  | 14px - 17px    | #86868b (Gray)       |
| **CTAs / Links**   | SF Pro Text    | 400 (Regular)  | 19px - 21px    | #0066cc (Apple Blue) |

- **Line Height**: Body text uses `1.47` to `1.5` for high legibility.
- **Letter Spacing**: Headlines use negative tracking (`-0.022em`) to feel tighter and more premium.

## 3. Color Palette

The palette is monochromatic, allowing vibrant content (product renders) to pop.

- **Primary Background**: `#ffffff` (White)
- **Secondary Background**: `#f5f5f7` (Light Gray for section breaks)
- **Immersive Background**: `#000000` (Pure Black for "Theater" and "Dark Mode" sections)
- **Primary Text**: `#1d1d1f` (Deep Black/Gray)
- **Secondary Text**: `#86868b` (Muted Gray)
- **Accent (Links)**: `#0066cc` (Apple Blue)

## 4. Layout & Spacing

The layout uses a fluid grid system with significant vertical "breathing room."

- **Section Vertical Padding**: Typically `120px` to `160px` between major narrative blocks.
- **Container Width**:
  - Max-width of `980px` for standard text content.
  - `1440px` or `100vw` for hero imagery.
- **Gutter/Margin**:
  - **Mobile**: `20px` side margin.
  - **Desktop**: Fluid margins that scale with the viewport.
- **Text Inset**: Text blocks are often constrained to a narrower width (approx. `600px - 800px`) within a larger container to prevent long line lengths.

## 5. Visual Nuances & UI Elements

- **Glassmorphism**: Navigation bars and interface overlays use `backdrop-filter: blur(20px)` with a slightly translucent white or black background (`rgba(255, 255, 255, 0.8)`).
- **Corner Radii**:
  - **Large Cards/Images**: `28px` to `32px`.
  - **Small Buttons/Interface elements**: `12px` to `16px`.
- **Shadows**: Minimal on the page itself. Product renders use soft, multi-layered "contact shadows" to give weight.
- **Motion**: Frequent use of **"Scrollytelling."** As users scroll, components rotate, explode, or reassemble.

## 6. Iconography & Interactive Components

- **Icons**: San Francisco Symbols (SF Symbols). Weights are matched to the surrounding text weight (thin/light).
- **Buttons**:
  - **Primary**: Solid Blue or Black pill-shaped buttons with white text.
  - **Ghost**: Text-only with a trailing `>` chevron.
- **Navigation**: A sticky "Local Nav" bar (`48px` height) that stays at the top of the viewport once scrolled past the hero, providing a quick "Buy" CTA.

## 7. Responsive Strategy

- **Breakpoints**:
  - **Small (Mobile)**: `< 734px`
  - **Medium (Tablet)**: `734px - 1068px`
  - **Large (Desktop)**: `> 1068px`
- **Scaling**:
  - Font sizes scale down significantly on mobile (e.g., `80px` headline → `40px` or `48px`).
  - All multi-column layouts stack vertically on mobile.
