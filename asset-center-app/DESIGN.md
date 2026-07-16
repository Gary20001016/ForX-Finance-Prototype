---
version: alpha
name: ForX Quiet Capital
description: A restrained dark capital terminal for professional crypto asset operations.
colors:
  canvas: "#050706"
  panel: "#0D100F"
  surface: "#121614"
  surface-raised: "#171C19"
  text: "#F2F6F3"
  muted: "#858E89"
  muted-strong: "#AEB7B2"
  line: "rgba(255, 255, 255, 0.10)"
  line-strong: "rgba(255, 255, 255, 0.17)"
  primary: "#8DFAA9"
  primary-strong: "#53D782"
  primary-ink: "#08210F"
  warning: "#F8CA6C"
  error: "#FF7A7A"
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
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    height: 48px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 48px
  control:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 44px
  icon-muted:
    textColor: "{colors.muted-strong}"
  status-success:
    textColor: "{colors.primary-strong}"
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
  divider-strong:
    backgroundColor: "{colors.line-strong}"
    height: 1px
  notice-warning:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: 12px
---

# ForX Quiet Capital

## Overview

The asset center uses a quiet exterior and a professional interior. Account homes remain value-led and calm; operational screens become dense with meaningful balances, fees, limits, timestamps, confirmations, addresses, and audit states. It is not a consumer wallet full of floating cards, nor a dense desktop order terminal compressed into a phone.

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

Design for a 390 × 844 phone with 18–20px horizontal gutters, a 4px base grid, and an 8px row rhythm. Every actionable control provides at least a 44px touch target unless it is grouped inside a larger semantic row. The status area is followed directly by the account-tabs row; there is no page-title or brand-lockup row. Network selection belongs inside deposit and withdrawal, never on the asset home.

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
- Icons come from one 1.75px outline SVG family. Token and network marks use consistent containers; no emoji or improvised symbol acts as a control.
- Transaction screens expose orientation, primary value, supporting metadata, state, action hierarchy, and auditability before they are considered complete.

## Do's and Don'ts

- Do let the total value and state copy carry the screen.
- Do distinguish detected, confirmed, crediting, and credited deposit stages.
- Do separate net external flow, trading returns, and internal transfer flow.
- Do keep notification and fund-record shortcuts in the same row as account tabs.
- Don't add a page title, service-status badge, ForX lockup, or decorative brand subtitle above the account tabs.
- Don't present internal transfers as return or external fund flow.
- Don't use ornamental English or unexplained abbreviations.
- Don't imply any prototype wallet, signature, transaction, or blockchain state is real.
- Don't use empty space to compensate for missing operational content.
- Don't wrap every metric in a separate rounded card; use tonal sections, aligned columns, and dividers.

## Motion

Feedback transitions take 120ms and content transitions take 220ms with `cubic-bezier(0.2, 0, 0, 1)`. Nothing bounces or overshoots. Under `prefers-reduced-motion`, animation duration becomes zero.
