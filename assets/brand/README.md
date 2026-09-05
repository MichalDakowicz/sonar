# Sonar brand assets

The mark is a sonar scope: an open ring sweeping around a record, with the
blip breaking out of the gap - one release, spotted. Everything is drawn on a
64x64 grid so it stays crisp at 16px in the header and at 1024px as an app icon.

It is deliberately the *same* mark as Radar's and the other sibling's - the same
ring, the same blip, the same stroke weight - with only the centre glyph and the
colour changed. Three apps, one family: put the icons side by side and they read
as a set rather than as three unrelated projects.

| File               | Use                                                                  |
| ------------------ | -------------------------------------------------------------------- |
| `logo.svg`         | The mark. Imported as a component (`import Logo from '@/assets/brand/logo.svg'`). |
| `logo-mono.svg`    | Single-colour mark using `currentColor` - pass `color` to tint it.    |
| `splash.svg`       | The mark, for splash/launch surfaces.                                |

`logo.svg` is the single source of truth for every PNG in `assets/images/`.
After editing it, regenerate them:

```bash
npm run icons
```

## Palette

One flat colour, no gradients: `#10B981` - the `--primary` token from
`src/theme/colors.ts`. The backdrop everywhere is `#09090B` (`--background`).
