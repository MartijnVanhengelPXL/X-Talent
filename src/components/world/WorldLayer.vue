<script setup>
import { computed } from 'vue'

/**
 * Eén object in de 3D-wereld. Het zegt alleen waar het staat; de TimeEngine leest
 * de data-attributen en verschuift het tijdens het scrollen.
 *
 * - z: diepte langs de rit, x: links/rechts van het midden, y: op/neer (positief = omlaag)
 * - kind: billboard (plat, kijkt naar de camera), floor, ceiling, wall-left, wall-right
 * - len: lengte van een vloer/plafond/muur langs z
 * - mx, my, ms: andere x, y en schaal op smalle schermen (gsm)
 */
const props = defineProps({
  kind: { type: String, required: true },
  z: { type: Number, required: true },
  x: Number,
  y: Number,
  len: Number,
  width: Number,
  height: Number,
  fog: Array,
  near: Array,
  mx: Number,
  my: Number,
  ms: Number,
  /** Grond: altijd als eerste getekend. */
  base: Boolean,
  /** Teken een vloer/muur iets later dan zijn verste punt zou zeggen. */
  bias: Number,
  /** Alleen tijdens de rit: verdwijnt als je op het perron naar de muur kijkt. */
  ride: Boolean,
})

const pair = (v) => (v ? v.join(',') : undefined)

const style = computed(() => {
  const s = {}
  if (props.kind === 'floor' || props.kind === 'ceiling') {
    const w = props.width ?? 1000
    s.width = `${w}px`
    s.height = `${props.len}px`
  } else if (props.kind === 'wall-left' || props.kind === 'wall-right') {
    const h = props.height ?? 800
    s.width = `${props.len}px`
    s.height = `${h}px`
  } else {
    if (props.width) s.width = `${props.width}px`
    if (props.height) s.height = `${props.height}px`
  }
  return s
})
</script>

<template>
  <div
    class="layer"
    :class="`layer--${kind}`"
    :style="style"
    :data-layer="kind"
    :data-z="z"
    :data-x="x"
    :data-y="y"
    :data-len="len"
    :data-fog="pair(fog)"
    :data-near="pair(near)"
    :data-mx="mx"
    :data-my="my"
    :data-ms="ms"
    :data-base="base ? '' : undefined"
    :data-bias="bias"
    :data-ride="ride ? '' : undefined"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Alle objecten draaien om de linkerbovenhoek; de engine centreert ze zelf (zie engine.js). */
.layer {
  position: absolute;
  left: 0;
  top: 0;
  visibility: hidden;
  transform-origin: 0 0;
}
.layer--wall-left,
.layer--wall-right {
  overflow: hidden;
}
</style>
