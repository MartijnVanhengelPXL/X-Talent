/**
 * Kleine rekenhulpjes voor de camerarit. Geen DOM, alleen getallen.
 * Eenheden zijn "wereld-eenheden": de camera rijdt langs de z-as van 0 tot `total`.
 */

/** CSS-perspectief van het podium in px (= afstand van het oog tot het scherm). */
export const P = 1000

/** Deel van de resterende afstand dat de camera per 60 Hz-frame aflegt (zachte vertraging). */
export const FOLLOW = 0.14
export const FRAME_MS = 1000 / 60

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** 1 zolang d <= a, 0 vanaf d >= b, lineair daartussen. */
export function fade(d, a, b) {
  if (d <= a) return 1
  if (d >= b) return 0
  return 1 - (d - a) / (b - a)
}

/** Smoothstep, begrensd tot 0..1. */
export function ease(p) {
  const t = clamp(p, 0, 1)
  return t * t * (3 - 2 * t)
}

/** Zelfde vertraging op elk scherm, of het nu 60 of 144 Hz is. */
export function followFactor(dt) {
  return 1 - (1 - FOLLOW) ** (Math.max(0, dt) / FRAME_MS)
}

/** Schaal van de wereld: 1 vanaf 1440 px breed, kleiner op kleine schermen. */
export function worldScale(width) {
  return clamp(width / 1440, 0.45, 1)
}

export function cameraForScroll(scrollY, trackTop, span, total) {
  return clamp((scrollY - trackTop) / Math.max(1, span), 0, 1) * total
}

export function scrollForCamera(cam, trackTop, span, total) {
  return trackTop + (cam / total) * Math.max(1, span)
}

/** Zichtbaarheid van een tekstblok: fade-in na `a`, fade-out voor `b`. */
export function hudVisibility(cam, a, b, edge = 180) {
  return clamp(Math.min((cam - a) / edge, (b - cam) / edge), 0, 1)
}

/** Welk hoofdstuk actief is voor een camerapositie. */
export function activeIndex(windows, cam) {
  let active = 0
  windows.forEach((w, i) => {
    if (cam >= w.start) active = i
  })
  return active
}
