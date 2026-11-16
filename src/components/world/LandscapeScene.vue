<script setup>
import WorldLayer from './WorldLayer.vue'
import TreeArt from './TreeArt.vue'
import { GROUND } from '../../journey/layout'

/** De grond met het spoor, de bovenleiding en de bomen langs de rit. */
const props = defineProps({ layout: { type: Object, required: true } })

const TREE_SIZE = {
  populier: { w: 260, h: 1500 },
  rond: { w: 800, h: 800 },
  wilg: { w: 420, h: 520 },
  struik: { w: 420, h: 210 },
  spar: { w: 560, h: 1400 },
}
const trackBed = props.layout.ground.filter((g) => g.track)
const treeSize = (t) => ({ w: Math.round(TREE_SIZE[t.kind].w * t.size), h: Math.round(TREE_SIZE[t.kind].h * t.size) })

/** De paal staat links van het spoor; de arm reikt tot boven het midden van het spoor. */
const POLE = { x: -400, width: 440, top: -600 }
</script>

<template>
  <!-- Alleen het spoorbed is 3D; het gras eromheen is de platte achtergrond (bespaart veel geheugen). -->
  <WorldLayer
    v-for="g in trackBed"
    :key="`g${g.z}`"
    kind="floor"
    base
    :class="[`land--${g.year}`, { 'land--track': g.track }]"
    :z="g.z"
    :y="GROUND"
    :len="g.len"
    :width="720"
  >
    <div class="surface s-ground"></div>
  </WorldLayer>

  <!-- Rijdraad boven het spoor -->
  <WorldLayer v-for="w in layout.wires" :key="`w${w.z}`" kind="floor" :bias="2" :z="w.z" :y="-470" :len="w.len" :width="4">
    <div class="surface s-wire"></div>
  </WorldLayer>

  <!-- Palen van de bovenleiding -->
  <WorldLayer
    v-for="p in layout.poles"
    :key="`p${p.z}`"
    kind="billboard"
    :z="p.z"
    :x="POLE.x + POLE.width / 2 - 20"
    :y="(GROUND + POLE.top) / 2"
    :width="POLE.width"
    :height="GROUND - POLE.top"
    :near="[-200, -500]"
  >
    <svg class="pole" viewBox="0 0 440 1000" preserveAspectRatio="none">
      <rect x="6" y="0" width="22" height="1000" fill="#5f6b73" />
      <rect x="6" y="0" width="7" height="1000" fill="#7d8a92" />
      <rect x="0" y="984" width="34" height="16" fill="#8f8a80" />
      <rect x="20" y="96" width="420" height="10" fill="#5f6b73" />
      <line x1="24" y1="30" x2="380" y2="98" stroke="#5f6b73" stroke-width="6" />
      <rect x="414" y="104" width="6" height="30" fill="#3d4449" />
    </svg>
  </WorldLayer>

  <WorldLayer
    v-for="t in layout.trees"
    :key="`t${t.z}${t.x}`"
    kind="billboard"
    :z="t.z"
    :x="t.x"
    :y="GROUND - treeSize(t).h / 2"
    :width="treeSize(t).w"
    :height="treeSize(t).h"
    :near="[-200, -500]"
  >
    <TreeArt :kind="t.kind" />
  </WorldLayer>
</template>
