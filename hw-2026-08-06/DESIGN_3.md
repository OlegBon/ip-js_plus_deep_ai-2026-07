---
version: alpha
name: Convertly Hub Base
description: SaaS File Converter & API Platform
colors:
  primary: "#09090B"
  secondary: "#71717A"
  accent: "#4F46E5"
  background: "#FFFFFF"
  error: "#EF4444"
typography:
  headline:
    fontFamily: Inter, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: Inter, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: 400
spacing:
  base: 8px
  sm: 16px
  md: 24px
  lg: 32px
rounded:
  sm: 4px
  md: 8px
  lg: 12px
components:
  dropzone-neutral:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
---

# DESIGN.md

## Overview

Convertly Hub is a SaaS platform designed for fast file conversion, accessible via a B2C web interface and a B2B public API[cite: 5]. The design system is strictly built upon Shadcn UI and Tailwind CSS, ensuring a modern, lightweight, and consistent aesthetic[cite: 5]. The visual language is minimalistic, heavily relying on negative space (whitespace) and clear typography to guide the user without unnecessary visual noise[cite: 5].

## Colors

The core color palette is monochromatic (black and white) to maintain a strict, professional appearance[cite: 5]. A single accent color—a deep blue or purple—is used exclusively to highlight active states, primary actions, and interactive elements[cite: 5].

## Typography

Typography is designed to be strict and clear[cite: 5]. It must remain highly readable across varied contexts, from the main B2C conversion interface to the dense, technical B2B API documentation intended for developers[cite: 5].

## Layout

The layout strategy prioritizes minimalism and the generous use of negative space[cite: 5].

- On the main page, the layout centers entirely around the Drag & Drop conversion widgets[cite: 5].
- In the dashboard, the layout shifts to a structured format featuring a sidebar, strict settings cards, and data tables for transaction history, similar to platforms like Vercel or Stripe[cite: 5].

## Elevation & Depth

Elevation is kept minimal. Instead of heavy shadows, the UI relies on clean borders and subtle background shifts to define interactive areas and cards, aligning with the structured Shadcn UI component logic[cite: 5].

## Shapes

Shapes follow a modern, architectural logic. Interactive elements, inputs, and standard dashboard cards utilize subtle rounded corners to maintain a professional yet approachable feel[cite: 5].

## Components

- **Drag & Drop Zone:** The central UI element for file conversion[cite: 5]. It requires strict visual feedback across multiple states: neutral, hover/drag over (featuring a changed dashed border color), loading (with an animated progress bar), and success[cite: 5].
- **Dashboard Toggles:** Used extensively in the settings panel to manage user privacy states, such as the "Save converted files" toggle[cite: 5].
- **API Documentation Blocks:** Code snippets and syntax highlighting must use a dark theme to resemble a professional developer tool[cite: 5].

## Do's and Don'ts

- Do provide immediate visual feedback (e.g., highlighting the drop zone in red) when a file exceeds the allowed size limit during client-side validation[cite: 5].
- Do design the API documentation to look like a professional product for developers[cite: 5].
- Don't use additional CSS libraries or custom classes outside of the Tailwind CSS framework[cite: 5].
- Don't trust client-side file extensions; the visual UI must align with the backend's strict MIME-type validation rules[cite: 5].
