---
version: alpha
name: Convertly Hub - Minimalist
colors:
  text-primary: "#171717"
  text-secondary: "#666666"
  accent: "#0070F3"
  background: "#FAFAFA"
  surface: "#FFFFFF"
  border: "#EBEBEB"
  error: "#FF1744"
  success: "#297A3A" # From Vercel's 'Terminal Green'
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.04em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-mono:
    fontFamily: "Fira Code, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 6px
  full: 9999px
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Convertly Hub Design System (Minimalist)

This document outlines a refined, minimalist design system for "Convertly Hub," inspired by the developer-centric aesthetics of Vercel and the clean simplicity of Pirsch Analytics.

## Overview

The design language is precise, functional, and devoid of ornamentation. It evokes the feeling of a well-crafted developer tool: fast, clean, and respectful of the user's focus. The aesthetic is built on a disciplined monochrome palette, sharp typography, and generous whitespace, creating an experience that is both professional and effortlessly modern.

## Colors

The palette is strictly monochromatic, ensuring that typography and layout are the primary drivers of hierarchy. A single accent color is used with restraint for critical actions.

- **Text Primary (`#171717`):** An obsidian, near-black for all headings and primary content. It's strong without the harshness of pure black.
- **Text Secondary (`#666666`):** A stone gray for body copy, helper text, and de-emphasized UI labels.
- **Accent (`#0070F3`):** A vibrant blue, used exclusively for primary calls-to-action or critical focused states.
- **Background (`#FAFAFA`):** A paper-white canvas that feels clean and less sterile than pure white.
- **Surface (`#FFFFFF`):** Pure white for elevated surfaces like cards and input fields, creating a subtle lift from the background.
- **Border (`#EBEBEB`):** A faint, hairline gray for all borders, providing structure without visual noise.

## Typography

Typography is the core of the design system, using a dual-font strategy to separate narrative content from technical data.

- **UI & Headlines (Inter):** Headlines are set in Inter Medium (500) with tight letter-spacing to feel architectural and confident. Body copy uses Inter Regular (400) for excellent readability.
- **Technical & Data (Fira Code):** A clean monospace font is used for API keys, code snippets, and data-dense tables in the dashboard. This creates a clear visual distinction for developer-focused information.

## Layout

The layout is built on a 4px grid and emphasizes generous whitespace. Sections are separated by large vertical gaps (96px) to let content breathe. The main content area has a maximum width of 1280px, creating a focused and comfortable reading environment. Density is compact and efficient.

## Elevation & Depth

There are no drop shadows. Depth and hierarchy are conveyed through two methods only:
1.  **Tonal Layers:** Using the `background` and `surface` colors to create distinct layers.
2.  **Hairline Borders:** Using the `1px` `#EBEBEB` border to define the edges of cards, buttons, and inputs.

## Shapes

The shape language is defined by architectural sharpness. A crisp `6px` corner radius is used for all buttons, cards, and containers. This maintains a modern, engineered feel without being cold. Pill shapes (`9999px`) are reserved for small, specific UI elements like tags or status indicators.

## Components

Component styles are minimal and contrast-driven.

- **Primary Button:** A solid black button with white text. Reserved for the single most important action on a page (e.g., "Convert", "Save").
- **Ghost Button:** A transparent button with a hairline border and gray text. Used for secondary or tertiary actions, providing an interactive option that doesn't compete for attention.
- **Input Fields:** A pure white background with a simple hairline border. The border turns to the blue accent color on focus.
- **Cards:** A white surface with a hairline border and a `6px` radius. They contain grouped content and rely on internal padding and typographic hierarchy, not decoration.
- **API Key Display:** Uses the monospace font inside a bordered container with a "Copy" button, clearly distinguishing it as technical data.

## Do's and Don'ts

- **Do** use the monochrome color palette for 99% of the UI.
- **Don't** ever use drop shadows for elevation. Use borders or tonal shifts.
- **Do** use the blue accent color only for the single primary CTA or a critical focused state.
- **Don't** use more than one accent color. The system's strength is its restraint.
- **Do** use `Inter` for all user-facing prose and `Fira Code` for any technical data or code.
- **Don't** use a corner radius larger than `6px` for primary containers like cards and buttons.
