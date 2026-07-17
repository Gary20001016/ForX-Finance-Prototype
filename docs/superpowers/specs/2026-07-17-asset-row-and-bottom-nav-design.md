# Asset Row Simplification and Fixed Bottom Navigation

## Context

The funding-account asset rows currently display the token symbol, English name, reference price, 24-hour change, allocation share, token balance, and fiat estimate at the same time. This produces eight competing text fragments in a single row. The bottom navigation is absolutely positioned inside `.app-screen`, which is also the scrolling element; scrolling the screen therefore moves the navigation through the viewport.

## Approved Design

### Collapsed asset rows

Each collapsed asset row contains only:

- token mark and token symbol;
- token balance;
- approximate fiat value;
- disclosure chevron.

The English name, reference price, 24-hour change, and exact allocation share do not appear in the collapsed row. The allocation bar remains as the section-level visual summary.

### Expanded asset details

Clicking a row reveals the secondary information in a two-column detail panel:

- reference price;
- 24-hour change;
- asset share;
- available balance;
- most recent change;
- supported networks.

The token's English name may appear once in the expanded panel header because it is identifying metadata rather than ornamental copy.

### Bottom navigation

The asset home reserves a 72px bottom-navigation row that never participates in content scrolling. The navigation is a sibling of the scrolling viewport, not an absolutely positioned descendant of it. Content receives normal bottom padding rather than reserving space for an overlay.

### Fixed top application chrome

The system-status row and the funding/contract account-navigation row form a 100px `.home-header`. This header is a sibling of `.home-scroll`, not part of its scrollable content. The asset home therefore uses three grid rows:

1. a 100px fixed `.home-header` containing the status and account controls;
2. a `minmax(0, 1fr)` `.home-scroll` viewport containing the account hero, actions, assets, and activity;
3. a 72px fixed bottom-navigation row.

The structural shell is preferred over `position:sticky` or an overlay because it reserves real layout space and prevents both top and bottom controls from covering account content.

## Behavior and Accessibility

- Asset rows remain buttons with `aria-expanded` and retain their current disclosure behavior.
- The bottom navigation remains visible and bottom-aligned at every content scroll position.
- The status row and account-navigation row remain visible and keep the same viewport coordinates at every content scroll position.
- The last activity row can scroll fully above the navigation and is never hidden underneath it.
- Mobile widths of 320px and 390px must not introduce horizontal overflow.

## Verification

- A regression test confirms collapsed rows omit English name, price, change, and percentage while keeping symbol, token balance, and fiat estimate.
- A disclosure test confirms secondary asset data remains available after expansion.
- A regression test scrolls the dedicated home content viewport and confirms the bottom navigation's bounding box does not move and stays aligned to the phone bottom.
- The same regression test confirms `.home-header`, `.status-bar`, and `.account-nav` do not move while `.home-scroll` changes position.
- Existing asset-center and transfer prototype suites continue to pass.
