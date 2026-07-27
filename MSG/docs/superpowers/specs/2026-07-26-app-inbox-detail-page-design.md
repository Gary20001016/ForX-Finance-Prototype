# App Inbox Detail Page Design

## Goal

Make the App prototype behave like a native in-app inbox: a text-first message list navigates to a full message-detail page inside the phone canvas.

## Message list

- Do not show a logo, category icon, avatar, or placeholder mark.
- Show category/topic metadata, risk label when applicable, title, summary, time, and unread dot.
- Use a two-column row: message content and trailing time/unread state.
- Do not show a redundant `最新消息` or selected-category heading above the list. Primary and topic tabs already communicate the current scope.

## Detail navigation

- Selecting a message marks it read and opens a full-screen detail view inside the phone canvas.
- The detail view replaces the previous bottom-sheet presentation.
- A back button returns to the message list without reloading the page.
- Browser document scrolling remains disabled; the detail body scrolls within the phone canvas.

## Detail content

- Page title: `消息详情`
- Metadata: primary category, topic, and message time
- Message title, summary, risk prompt when applicable, and full body
- An action button appears only when the message has both action copy and a configured business target

## Acceptance criteria

- No list row contains a message logo or icon.
- Clicking every list row opens the full detail page.
- The detail page remains inside the `390 × 844` phone canvas.
- Back returns to the current category/topic/list state.
- The bottom navigation is not visible over the detail page.
- Existing unread counters update after a message is opened.
