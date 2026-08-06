---
version: alpha
name: Convertly Paper Terminal
description: SaaS File Converter - Minimalist Print Aesthetic
colors:
  canvas: "#f8f5ed"
  ink: "#171717"
  graphite: "#707070"
  hairline: "#ebebeb"
  accent: "#297a3a"
typography:
  headline:
    fontFamily: Geist Sans, sans-serif
    fontSize: 56px
    fontWeight: 450
    lineHeight: 1
    letterSpacing: -3.36px
  body:
    fontFamily: Geist Sans, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-mono:
    fontFamily: Geist Mono, monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.071em
spacing:
  base: 8px
  md: 16px
  lg: 32px
  section: 96px
rounded:
  sm: 2px
  md: 6px
  full: 9999px
components:
  card-base:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
---

# DESIGN.md

## Overview

Convertly Hub uses a "Paper Terminal" aesthetic—a disciplined, ultra-minimalist design language that blends the warmth of a printed engineering notebook[cite: 2] with the strict, developer-focused precision of a CLI terminal[cite: 3]. The visual identity is fundamentally achromatic, relying on high-contrast typography, generous layout styling, and hairline borders rather than color or shadows to establish hierarchy[cite: 2, 3]. It perfectly suits a SaaS platform built for both B2C file conversion and B2B API integrations[cite: 5].

## Colors

The system is practically 0% colorful[cite: 3].

- **Canvas (`#f8f5ed`):** A warm paper background replaces the usual harsh SaaS white, providing a tactile, editorial foundation[cite: 2].
- **Ink (`#171717`):** Used for primary text and filled actions. It is a near-black (Obsidian) that avoids the harshness of pure `#000000`[cite: 3].
- **Graphite (`#707070`):** Used for secondary text, metadata, and supporting paragraphs[cite: 2].
- **Accent:** Color is heavily rationed. A single "Terminal Green" (`#297a3a`) is permitted exclusively for success confirmations[cite: 3].

## Typography

The typography system relies on a strict binary approach[cite: 3]:

- **Geist Sans:** The primary typeface for all reading materials. Headlines are set tight (e.g., `-3.36px` letter spacing) at a 450 font-weight—confident but not shouting[cite: 3].
- **Geist Mono:** Exclusively owns the space for technical data, API keys, file extensions, and small uppercase labels (eyebrows)[cite: 3, 5]. It is always small (11-12px) and mechanically precise[cite: 3].

## Layout

The layout styling is centered and comfortable, utilizing a max-width container (e.g., 1200-1280px) with generous 96px vertical section gaps[cite: 2, 3]. Content flows in distinct horizontal bands[cite: 3]. The Drag & Drop conversion widgets are prominently centered on the page[cite: 5], surrounded by ample negative space to command focus.

## Elevation & Depth

There is zero shadow elevation in this system[cite: 2, 3]. No drop shadows, inner glows, or blurs[cite: 2, 3].
Depth and separation are achieved entirely through 1px hairline borders (`#ebebeb` or `#171717`) on the cream surface—mimicking the logic of ink lines on paper[cite: 2, 3].

## Shapes

The shape language is sharp and functional. Standardizing on a **6px border radius** for cards, buttons, and input fields gives the interface a rigid, engineered aesthetic[cite: 3]. Full pill shapes (9999px radius) are reserved strictly for small metadata tags and compact header actions[cite: 3].

## Components

- **Drag & Drop Zone:** Rendered as a flat area on the cream canvas with a 1px dashed ink border[cite: 5]. When a user hovers or drags a file, the border reacts by becoming solid or slightly thicker, without relying on colored background fills[cite: 5].
- **API Documentation Panels:** CLI output and code snippets are embedded directly as UI elements[cite: 3]. They use Geist Mono text on the light canvas, resembling a printed terminal screenshot[cite: 3, 5].
- **Dashboard Data Tables:** Transaction history and API key management tables use 1px horizontal hairline dividers with no vertical borders, keeping data presentation airy and uncluttered[cite: 5].

## Do's and Don'ts

- Do define feature cards and file conversion zones with 1px hairline borders and a 6px radius[cite: 2, 3].
- Do use Geist Mono for all file formats (e.g., `DOCX`, `PDF`), API keys, and system states[cite: 3, 5].
- Don't use drop shadows, blurs, or any form of box-shadow elevation[cite: 2, 3].
- Don't introduce secondary colors for structural UI (navigation, large backgrounds)[cite: 2, 3].
- Don't use pure white (`#ffffff`) as a primary background surface; it breaks the paper canvas metaphor[cite: 2].
