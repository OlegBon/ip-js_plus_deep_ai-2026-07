---
version: alpha
name: Convertly Hub - Core
colors:
  primary: "#111827"      # Dark Gray for text
  secondary: "#6B7280"    # Medium Gray for secondary text, borders
  accent: "#4F46E5"       # Indigo for primary actions
  background: "#FFFFFF"   # White
  surface: "#F9FAFB"      # Off-white for cards/surfaces
  error: "#EF4444"        # Red for errors
  success: "#22C55E"      # Green for success
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Convertly Hub Design System

This document outlines the design system for "Convertly Hub," a SaaS platform for file conversion. The design is guided by the principles of clarity, efficiency, and scalability, as defined in the project's technical specifications.

## Overview

The brand and style of Convertly Hub are professional, modern, and user-friendly. The look and feel should inspire confidence and efficiency. The target audience includes both individual users needing a quick conversion tool and developers looking for a reliable API. The UI should feel clean, responsive, and intuitive, prioritizing function over ornamentation.

## Colors

The color palette is minimalist and professional, built on a neutral foundation with a strong accent color for interactive elements.

- **Primary (`#111827`):** A near-black used for all primary text to ensure maximum readability.
- **Secondary (`#6B7280`):** A neutral gray for subtitles, placeholder text, and borders.
- **Accent (`#4F46E5`):** A vibrant indigo used for primary buttons, links, and focused states to guide the user's attention.
- **Background (`#FFFFFF`):** Pure white for the main application background to create a clean and spacious feel.
- **Surface (`#F9FAFB`):** A subtle off-white used for cards and other raised surfaces to create a gentle sense of depth.

## Typography

The typography uses **Inter**, a versatile and highly readable sans-serif font suitable for user interfaces. The type scale is designed to create a clear visual hierarchy.

- **Headlines:** Set in Inter Bold (700) to be impactful and clear. Used for page titles and major section headers.
- **Body:** Set in Inter Regular (400) for all descriptive text, ensuring comfortable long-form reading.
- **Labels:** Set in Inter Medium (500) for buttons and UI controls, giving them slightly more prominence than body text.

## Layout

The layout is based on a structured grid system, utilizing an 8px base unit for spacing to ensure consistency and rhythm across the interface. The maximum content width is constrained to create a comfortable reading experience on wider screens. Key areas like the dashboard follow a sidebar-and-content pattern, similar to modern SaaS applications like Vercel.

## Elevation & Depth

Depth is primarily achieved through the use of surfaces with different background colors (`background` vs. `surface`) and subtle borders. Drop shadows are used sparingly on interactive elements like modals or dropdowns to lift them off the page.

## Shapes

Shapes are clean and modern, with a slight softness. A base corner radius of `6px` (`rounded.md`) is applied to most elements, including buttons and cards, to create a consistent and friendly appearance.

## Components

- **Buttons:**
    - **Primary:** Solid indigo background with white text. Used for the main call-to-action on any given screen.
    - **Secondary:** Light gray background with dark text. Used for less critical actions.
- **Input Fields:** Simple, clean inputs with a light gray border. The border color changes to indigo on focus. Error states are indicated with a red border and helper text.
- **Cards:** Used to group related information, such as in the dashboard. They have a subtle off-white background and a light gray border with an `8px` corner radius.
- **Drag & Drop Zone:** A large, clearly delineated area with a dashed border. The border color and background change on hover and when a file is being dragged over it to provide clear visual feedback.

## Do's and Don'ts

- **Do** use the accent color for primary actions to guide the user.
- **Don't** use more than two font weights on a single screen to maintain simplicity.
- **Do** maintain consistent spacing between elements using the 8px grid.
- **Don't** overuse shadows; prefer borders and tonal contrast for creating hierarchy.
