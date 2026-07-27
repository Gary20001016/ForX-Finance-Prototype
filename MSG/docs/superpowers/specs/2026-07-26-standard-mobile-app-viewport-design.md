# Standard Mobile App Viewport Design

## Goal

Render `message-center-app.html` as a standard mobile application page instead of a max-width responsive web column.

## Viewport behavior

- Desktop preview uses a centered `390 × 844` logical-pixel phone canvas.
- If the desktop viewport is shorter than 876 pixels, the phone canvas height is reduced to the available viewport height while keeping the content scrollable.
- Mobile browsers use the full available viewport width and `100dvh` height.
- The document body itself does not scroll; message content scrolls inside the phone canvas.

## Layer structure

The `.phone` element is the visual viewport and clips every App layer. A `.phone-scroll` element owns content scrolling. The bottom navigation, detail overlay, bottom sheet, and toast are positioned within `.phone`, so desktop previews never cover the surrounding browser window.

## Fixed regions

- Status bar, page header, and primary category tabs remain sticky at the top of the phone scroll area.
- Bottom navigation remains fixed to the bottom of the phone canvas.
- List padding reserves space for the bottom navigation and safe-area inset.

## Mobile adaptation

At viewport widths below `600px`, the App removes desktop borders, radii, shadows, and outer spacing. The canvas fills the device viewport and honors `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

## Acceptance criteria

- Desktop canvas width is exactly `390px`.
- Desktop canvas maximum height is `844px`.
- Mobile canvas width is `100%` and height is `100dvh`.
- The body does not acquire a second scrollbar.
- The message list remains scrollable.
- Bottom navigation remains visible during scrolling.
- Detail overlays and toast messages do not extend outside the phone canvas.
