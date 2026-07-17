# Fixed Subpage Headers

## Decision

Every secondary product screen uses a fixed page-level header. The fixed region contains the system-status row and the page-title row, including its back button and any page-level trailing action. Only the content below that region scrolls.

## Scope

The shared behavior applies to:

- Deposit entry and deposit progress
- Withdrawal entry, review, MFA setup, MFA verification, address book, add address, and withdrawal status
- Transfer entry, review, and status
- Funding records and record detail
- Account value analysis
- Placeholder secondary routes rendered by the shared fallback

The asset home keeps its existing fixed account header and fixed bottom navigation.

## Layout

- `.subpage` is a two-row application shell: an intrinsic-height fixed header row and a flexible content row.
- `.subpage-fixed-header` contains `.status-bar` and `.subpage-header` as non-scrolling children.
- `.subpage-scroll` is the only vertical scroller on a secondary screen.
- The layout reserves physical space for the header; content is never hidden beneath an overlay.
- Internal section headings, tabs, form labels, and content groups remain inside `.subpage-scroll` and do not become sticky.
- Secondary screens do not gain a bottom navigation bar.

## Interaction and Visual Continuity

- Scrolling must not change the viewport coordinates of the status row or title row.
- Existing back navigation, title actions, form controls, state transitions, sheets, and full-address wrapping remain unchanged.
- The fixed header keeps the existing dark canvas, divider, dimensions, and typography.
- Both 320px and 390px mobile layouts remain free of horizontal overflow.
- Frozen gallery previews use the same shared screen renderer and therefore show the same fixed-header structure.

## Verification

- Every secondary route contains exactly one `.subpage-fixed-header` and one `.subpage-scroll`.
- `.status-bar` and `.subpage-header` are not descendants of `.subpage-scroll`.
- Scrolling `.subpage-scroll` keeps both header rows at the same coordinates and leaves `.app-screen` at `scrollTop = 0`.
- Long secondary pages can still reach their final content.
- The full asset and transfer prototype suites remain green.
