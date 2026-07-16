---
version: alpha
name: ForX Quiet Capital
description: A restrained dark capital terminal for professional crypto asset operations.
colors:
  canvas: "#050706"
  surface: "#0D110F"
  surface-raised: "#111613"
  text: "#F3F7F4"
  muted: "#717A74"
  line: "rgba(224, 255, 236, 0.105)"
  primary: "#63F6A2"
  warning: "#FFC45D"
  error: "#FF747D"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 38px
    fontWeight: 570
    lineHeight: 1.1
    letterSpacing: -0.04em
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 17px
    fontWeight: 650
    lineHeight: 1.25
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 11px
    fontWeight: 550
    lineHeight: 1.4
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  phone: 40px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 20px
  xl: 28px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    height: 48px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 48px
  phone:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text}"
    rounded: "{rounded.phone}"
  metadata:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  divider:
    backgroundColor: "{colors.line}"
    height: 1px
  notice-warning:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: 12px
---

# ForX Quiet Capital

## Overview

The asset center should feel like a quiet institutional capital terminal adapted to a native mobile screen. It is not a consumer wallet full of floating cards, nor a dense desktop order terminal compressed into a phone. Large values, deliberate empty space, exact alignment, and restrained state feedback give the screen authority.

The fluorescent green {colors.primary} is the product's scarce signal. It appears on the active account, the primary deposit action, the value curve, positive movement, and completed states. Its scarcity is the source of its strength.

## Colors

- {colors.canvas} is the phone canvas and should dominate every screen.
- {colors.surface} and {colors.surface-raised} separate controls through tonal contrast rather than shadows.
- {colors.line} is a hairline divider, never a decorative frame around every block.
- {colors.primary} carries the single most important action and active/positive status.
- {colors.warning} indicates confirmation delays or caution that still permits recovery.
- {colors.error} indicates blocking validation and terminal failure.

## Typography

Use the platform sans-serif stack. Numbers are the visual anchor: keep tabular alignment where balances compare and avoid gratuitous uppercase labels. Chinese is the primary interface language. English remains only for product names, token symbols, wallet names, network names, and necessary units.

## Layout

Design for a 390 × 844 phone with 20–21px horizontal gutters and an 8px rhythm. The status area is followed directly by the account-tabs row; there is no page-title or brand-lockup row. Network selection belongs inside deposit and withdrawal, never on the asset home.

## Elevation & Depth

Use tonal layers, thin borders, a single restrained green radial glow behind account-value data, and subtle backdrop blur on bottom sheets. Avoid heavy card shadows and glass panels stacked inside one another.

## Shapes

Rounded corners communicate hierarchy: 12px for controls, 16px for major panels, and full pills only for filters or compact state tags. Flat list rows use dividers instead of individual containers.

## Components

- Account tabs sit in the top navigation row with a 22px green active indicator.
- Primary deposit is the only filled green action on the funding home.
- Charts use a 2px green line, a very light area fill, and event markers with text labels.
- Status steppers use explicit labels and icons; color alone never communicates progress.
- Sheets preserve context, trap focus, close with Escape, and return focus to the trigger.
- Asset and record rows align amounts to the trailing edge and use small muted metadata below.

## Do's and Don'ts

- Do let the total value and state copy carry the screen.
- Do distinguish detected, confirmed, crediting, and credited deposit stages.
- Do separate net external flow, trading returns, and internal transfer flow.
- Do keep notification and fund-record shortcuts in the same row as account tabs.
- Don't add a page title, service-status badge, ForX lockup, or decorative brand subtitle above the account tabs.
- Don't present internal transfers as return or external fund flow.
- Don't use ornamental English or unexplained abbreviations.
- Don't imply any prototype wallet, signature, transaction, or blockchain state is real.

## Motion

Feedback transitions take 120ms and content transitions take 220ms with `cubic-bezier(0.2, 0, 0, 1)`. Nothing bounces or overshoots. Under `prefers-reduced-motion`, animation duration becomes zero.
