# Wavelytics brand assets

The Wavelytics wave mark — the same glyph used in the site nav, dashboard
header, auth screen, and the browser-tab favicon.

| File | Use |
| --- | --- |
| `wavelytics-mark.svg` | Clean vector glyph, 24×24 viewBox (exact site mark). Scales to any size. |
| `wavelytics-mark-512.svg` | Same glyph with padding, sized for raster export. |
| `wavelytics-mark.png` | 512×512 PNG, transparent background. Drop-in for decks, docs, app icons. |

- **Brand blue:** `#38bdf8` (Tailwind sky-400).
- **Stroke:** round caps + round joins, width 2 on the 24-unit grid.
- Transparent background — works on light and dark surfaces. Recolor by
  changing the `stroke` value in the SVG.

Need other sizes/formats? Re-render the PNG from the SVG, e.g.:

```bash
chrome --headless --default-background-color=00000000 \
  --screenshot=wavelytics-mark.png --window-size=512,512 wavelytics-mark-512.svg
```
