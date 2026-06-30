import { colors } from './colors'

/**
 * Tokens for the app's "liquid glass" surfaces (expo-glass-effect).
 *
 * `tint` values are blended into the live glass via GlassView's `tintColor`.
 * `fallback` values style the plain surface rendered on devices where the OS
 * glass API is unavailable (`isGlassEffectAPIAvailable() === false`).
 */
export const glass = {
  tint: {
    // Raised panels: search bar, invite card.
    panel: 'rgba(255,255,255,0.08)',
    // Small controls layered on a panel: search clear button.
    control: 'rgba(0,0,0,0.25)',
  },
  fallback: {
    // Chrome floating over imagery (icon buttons) — stays translucent so the
    // photo behind it reads through.
    floating: 'rgba(0,0,0,0.35)',
    floatingBorder: 'rgba(255,255,255,0.2)',
    // Solid panels sitting on the app background.
    panel: colors.surfaceCard,
    panelBorder: colors.borderSubtle,
    // Small controls on a panel.
    control: colors.surfaceRaised,
  },
} as const
