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
  phone: 34px
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
  balance-strip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 12px
  audit-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted-strong}"
    rounded: "{rounded.md}"
    padding: 13px
  status-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.full}"
  demo-console:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted-strong}"
    rounded: "{rounded.lg}"
    padding: 20px
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

Use the platform sans-serif stack. Numbers are the visual anchor: keep tabular alignment where balances compare and avoid gratuitous uppercase labels. Chinese is the primary interface language. English remains only for product names, token symbols, wallet names, network names, and necessary units. Required mobile copy never falls below 11px; operational labels and values use 11–12px whenever the user must compare or verify them.

## Layout

Design for a 390 × 844 phone with 18–20px horizontal gutters, a 4px base grid, and an 8px row rhythm. Primary controls provide 44–48px touch targets; compact 32–36px icon controls appear only inside navigation or a larger semantic row. The status area is followed directly by the account-tabs row; there is no page-title or brand-lockup row. Network selection belongs inside deposit and withdrawal, never on the asset home. Operational fact groups use at most two columns on mobile; complete information may extend the vertical scroll instead of shrinking type.

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
- Collapsed funding asset rows show only token identity, token balance, approximate fiat value, and disclosure; price, 24-hour change, allocation share, and the English token name belong in the expanded detail.
- The asset home uses a fixed three-row shell: `.home-header` contains the status and account controls, `.home-scroll` owns vertical content scrolling, and the bottom navigation is their non-scrolling sibling.
- Every secondary product screen uses a fixed two-row shell: `.subpage-fixed-header` contains the status and page-title controls, while `.subpage-scroll` is the only element that owns vertical content scrolling.
- Icons come from one 1.75px outline SVG family. Token and network marks use consistent containers; no emoji or improvised symbol acts as a control.
- Transaction screens expose orientation, primary value, supporting metadata, state, action hierarchy, and auditability before they are considered complete.
- Funding uses a three-column balance strip for available, frozen, and incoming value; contract uses the same pattern for available margin, ratio, and transfer headroom.
- Deposit and withdrawal network panels expose health, minimums, confirmations, estimates, contract or address family, and fee responsibility before submission.
- Product information uses an 11px minimum reading size on the 390px mobile canvas; micro system glyphs may be smaller, but no operational label, status, value, or helper copy may fall below that floor.
- Address-class values use an 11px monospaced full-address block with `overflow-wrap:anywhere`; token contracts, deposit addresses, wallet senders, withdrawal targets, address-book entries, and record addresses are never abbreviated.
- Address rows are vertical: the semantic label appears first and the complete selectable value wraps below it.
- Audit timelines include a text label, state icon, timestamp or progress value, and terminal result. A colored dot alone is never sufficient.
- Records reconcile deposits, withdrawals, network fees, and net inflow. Failed records remain visible but do not contribute to effective flow totals.
- Account-value analysis exposes axes, selectable points, event markers, period statistics, and separate value/flow-adjusted-return modes.
- The desktop-only demo console is a sibling of the phone, never a child of the product UI. It exposes only contextual prototype state controls; no real user action may depend exclusively on it.
- Desktop galleries freeze the real mobile renderers, disable interactions, and pair every screen with entry, action, response, next-state, and implementation notes.

## Do's and Don'ts

- Do let the total value and state copy carry the screen.
- Do distinguish detected, confirmed, crediting, and credited deposit stages.
- Do separate net external flow, trading returns, and internal transfer flow.
- Do keep notification and fund-record shortcuts in the same row as account tabs.
- Do keep simulation, failure injection, and manual state advancement in the external demo console.
- Do keep the last asset-home activity row fully scrollable above the fixed bottom navigation.
- Don't add a page title, service-status badge, ForX lockup, or decorative brand subtitle above the account tabs.
- Don't compress four operational facts into one mobile row or reduce required text to make a fixed-height screen fit.
- Don't use ellipsis, middle truncation, or shortened sample data for any address-class value.
- Don't present internal transfers as return or external fund flow.
- Don't use ornamental English or unexplained abbreviations.
- Don't imply any prototype wallet, signature, transaction, or blockchain state is real.
- Don't place “模拟” or “演示处理” buttons inside the phone UI.
- Don't use empty space to compensate for missing operational content.
- Don't place status, account navigation, or bottom navigation inside the element that owns vertical scrolling.
- Don't move tabs, form labels, section headings, or other content-level controls into the fixed secondary-screen header.
- Don't wrap every metric in a separate rounded card; use tonal sections, aligned columns, and dividers.

## Motion

Feedback transitions take 120ms and content transitions take 220ms with `cubic-bezier(0.2, 0, 0, 1)`. Nothing bounces or overshoots. Under `prefers-reduced-motion`, animation duration becomes zero.
