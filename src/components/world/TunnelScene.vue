<script setup>
import WorldLayer from './WorldLayer.vue'
import { GROUND, TUNNEL } from '../../journey/layout'

/**
 * De tunnel tussen het 2de en het 3de jaar: een stenen portaal in een heuvel,
 * een donkere koker met lampen, en aan het einde het licht van spoor 3.
 */
const props = defineProps({ tunnel: { type: Object, required: true } })

const R = TUNNEL.halfWidth
const TOP = TUNNEL.archY - R // bovenkant van de boog
const lights = []
for (let z = props.tunnel.start + 250; z < props.tunnel.end; z += 380) lights.push(z)

/** Ingang: heuvel van 5000 breed, onderkant op de grond. Opening in het midden. */
const HILL = { w: 5000, h: 1700 }
const cx = HILL.w / 2
const floorY = HILL.h
const archY = HILL.h - (GROUND - TUNNEL.archY)
const archPath = `M${cx - R} ${floorY + 10} V${archY} A${R} ${R} 0 0 1 ${cx + R} ${archY} V${floorY + 10} Z`

/**
 * De heuvel is één tekening, maar wordt in drie stukken getoond: een heel groot vlak
 * tekent de browser soms maar half. Elk stuk toont zijn deel van dezelfde tekening.
 */
const pieces = [
  [0, 1800],
  [1800, 3200],
  [3200, HILL.w],
].map(([a, b], i) => ({ i, a, w: b - a, x: (a + b) / 2 - cx }))

/** Een rechthoek als pad, met de boog erin uitgespaard (evenodd): geen masker nodig. */
const rectWithArch = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z ${archPath}`
const hillBack = `M0 ${HILL.h} C${HILL.w * 0.12} ${HILL.h * 0.55} ${HILL.w * 0.3} ${HILL.h * 0.08} ${cx} ${HILL.h * 0.06} C${HILL.w * 0.72} ${HILL.h * 0.05} ${HILL.w * 0.86} ${HILL.h * 0.5} ${HILL.w} ${HILL.h} Z ${archPath}`
const hillLight = `M${cx - 380} ${HILL.h * 0.1} C${cx} ${HILL.h * 0.04} ${HILL.w * 0.75} ${HILL.h * 0.12} ${HILL.w} ${HILL.h} H${cx + 900} C${cx + 700} ${HILL.h * 0.6} ${cx + 300} ${HILL.h * 0.25} ${cx - 380} ${HILL.h * 0.1}Z`
const stones = rectWithArch(cx - R - 260, archY - R - 250, (R + 260) * 2, HILL.h - (archY - R - 250))

/** De koker in stukken van ongeveer 650: kortere vlakken zijn goedkoper om te tekenen als je erdoor rijdt. */
const SEG = 4
const segLen = (props.tunnel.end - props.tunnel.start - 12) / SEG
const segs = Array.from({ length: SEG }, (_, i) => props.tunnel.start + 6 + i * segLen)

/** Uitgang, van binnenuit gezien. */
const EXIT = { w: 2400, h: 1400 }
const ex = EXIT.w / 2
const eFloor = EXIT.h
const eArch = EXIT.h - (GROUND - TUNNEL.archY)
const exitPath = `M${ex - R} ${eFloor + 10} V${eArch} A${R} ${R} 0 0 1 ${ex + R} ${eArch} V${eFloor + 10} Z`
const exitWall = `M0 0H${EXIT.w}V${EXIT.h}H0Z ${exitPath}`
</script>

<template>
  <!-- Portaal in de heuvel -->
  <WorldLayer
    v-for="p in pieces"
    :key="p.i"
    class="layer--steady"
    kind="billboard"
    :z="tunnel.start"
    :x="p.x"
    :y="GROUND - HILL.h / 2"
    :width="p.w"
    :height="HILL.h"
    :near="[-100, -400]"
  >
    <svg class="portal" :viewBox="`${p.a} 0 ${p.w} ${HILL.h}`" preserveAspectRatio="none">
      <defs>
        <pattern :id="`stones-${p.i}`" width="120" height="70" patternUnits="userSpaceOnUse">
          <rect width="120" height="70" fill="#9b958a" />
          <path d="M0 35h120M60 0v35M0 70h120M30 35v35M90 35v35" stroke="#837d72" stroke-width="5" />
        </pattern>
      </defs>
      <path :d="hillBack" fill="#5f7d3e" fill-rule="evenodd" />
      <path :d="hillLight" fill="#6f8f48" />
      <path :d="stones" :fill="`url(#stones-${p.i})`" fill-rule="evenodd" />
      <rect :x="cx - R - 290" :y="archY - R - 290" :width="(R + 290) * 2" height="50" fill="#7a746a" />
      <path :d="`M${cx - R - 50} ${floorY} V${archY} A${R + 50} ${R + 50} 0 0 1 ${cx + R + 50} ${archY} V${floorY}`" fill="none" stroke="#b9b3a6" stroke-width="44" />
      <rect :x="cx - 230" :y="archY - R - 220" width="460" height="130" rx="6" fill="#23407a" />
      <rect :x="cx - 218" :y="archY - R - 208" width="436" height="106" rx="3" fill="none" stroke="#fff" stroke-width="4" />
      <text :x="cx" :y="archY - R - 128" text-anchor="middle" class="portal__label">{{ tunnel.label }}</text>
    </svg>
  </WorldLayer>

  <!-- Binnenkant van de tunnel, in stukken -->
  <template v-for="z in segs" :key="`seg${z}`">
    <WorldLayer kind="floor" base class="land--tunnel land--track" :z="z" :y="GROUND" :len="segLen" :width="R * 2">
      <div class="surface s-ground"></div>
    </WorldLayer>
    <WorldLayer kind="wall-left" :bias="1" :z="z" :x="-R" :y="(GROUND + TOP) / 2" :len="segLen" :height="GROUND - TOP">
      <div class="surface s-tunnel"></div>
    </WorldLayer>
    <WorldLayer kind="wall-right" :bias="1" :z="z" :x="R" :y="(GROUND + TOP) / 2" :len="segLen" :height="GROUND - TOP">
      <div class="surface s-tunnel"></div>
    </WorldLayer>
    <WorldLayer kind="ceiling" :bias="1" :z="z" :y="TOP" :len="segLen" :width="R * 2">
      <div class="surface s-tunnel s-tunnel--top"></div>
    </WorldLayer>
  </template>
  <WorldLayer
    v-for="(z, i) in lights"
    :key="z"
    kind="billboard"
    :z="z"
    :x="i % 2 ? R - 30 : -R + 30"
    :y="-120"
    :width="34"
    :height="20"
    :fog="[2400, 3000]"
  >
    <i class="tunnel-light"></i>
  </WorldLayer>

  <!-- Uitgang, van binnenuit -->
  <WorldLayer
    class="layer--steady"
    kind="billboard"
    :z="tunnel.end"
    :y="GROUND - EXIT.h / 2"
    :width="EXIT.w"
    :height="EXIT.h"
    :near="[-60, -300]"
    :fog="[3000, 4000]"
  >
    <svg :viewBox="`0 0 ${EXIT.w} ${EXIT.h}`">
      <path :d="exitWall" fill="#1d1f22" fill-rule="evenodd" />
    </svg>
  </WorldLayer>
</template>
