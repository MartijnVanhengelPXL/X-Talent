<script setup>
import { computed } from 'vue'
import WorldLayer from './WorldLayer.vue'
import { GROUND, PLATFORM_TOP, WALL } from '../../journey/layout'

/**
 * Eén station: een perron rechts van het spoor met een luifel, het stationsbord,
 * lantaarns, een bank en achteraan de muur van het stationsgebouw met de foto's
 * van de activiteit. Als je afstapt, kijk je recht naar die muur.
 * Wat met `ride` gemarkeerd is, verdwijnt op het perron (het zou voor de muur staan).
 */
const props = defineProps({
  stop: { type: Object, required: true },
  bufferZ: { type: Number, default: 0 },
  spoor: { type: String, default: '' },
})

const Z = computed(() => props.stop.z)
const PLATFORM = { from: 260, width: 800, half: 1100 }
const CANOPY = { y: -200, x: 720, width: 680, half: 760 }
const pillars = [-560, 0, 560]
const lamps = [-850, 850]
const wallH = WALL.bottom - WALL.top
const img = (src) => import.meta.env.BASE_URL + src
/** Maximaal drie foto's op de muur. */
const fotos = computed(() => props.stop.fotos.slice(0, 3))
</script>

<template>
  <!-- Perron -->
  <WorldLayer
    kind="floor"
    :z="Z - PLATFORM.half"
    :x="PLATFORM.from + PLATFORM.width / 2"
    :y="PLATFORM_TOP"
    :len="PLATFORM.half * 2"
    :width="PLATFORM.width"
  >
    <div class="surface s-platform"></div>
  </WorldLayer>
  <WorldLayer
    kind="wall-right"
    :z="Z - PLATFORM.half"
    :x="PLATFORM.from"
    :y="(GROUND + PLATFORM_TOP) / 2"
    :len="PLATFORM.half * 2"
    :height="GROUND - PLATFORM_TOP"
  >
    <div class="surface s-platform-edge"></div>
  </WorldLayer>

  <!-- Muur van het stationsgebouw, met de foto's -->
  <WorldLayer
    kind="wall-right"
    :z="Z - WALL.half"
    :x="WALL.x"
    :y="(WALL.top + WALL.bottom) / 2"
    :len="WALL.half * 2"
    :height="wallH"
  >
    <div class="surface s-building">
      <div class="building__door"><i></i></div>
      <div class="building__window"></div>
      <div class="expo">
        <div class="expo__title">{{ stop.titel }}</div>
        <div class="expo__photos" :class="`expo__photos--${fotos.length}`">
          <figure v-for="(f, i) in fotos" :key="i" class="expo__photo">
            <img :src="img(f.src)" :alt="f.onderschrift" />
            <figcaption>{{ f.onderschrift }}</figcaption>
          </figure>
        </div>
      </div>
      <div class="building__window building__window--end"></div>
    </div>
  </WorldLayer>

  <!-- Luifel met steunen -->
  <WorldLayer kind="ceiling" :z="Z - CANOPY.half" :x="CANOPY.x" :y="CANOPY.y" :len="CANOPY.half * 2" :width="CANOPY.width">
    <div class="surface s-canopy"></div>
  </WorldLayer>
  <WorldLayer
    v-for="p in pillars"
    :key="p"
    kind="billboard"
    ride
    :z="Z + p"
    :x="CANOPY.x + 220"
    :y="(CANOPY.y + PLATFORM_TOP) / 2"
    :width="18"
    :height="PLATFORM_TOP - CANOPY.y"
  >
    <div class="pillar"></div>
  </WorldLayer>

  <!-- Perronnummer aan de middelste steun -->
  <WorldLayer kind="billboard" ride :z="Z - 2" :x="CANOPY.x + 220" :y="60" :width="64" :height="64">
    <div class="track-number">{{ spoor }}</div>
  </WorldLayer>

  <!-- Lantaarns aan de spoorkant van het perron -->
  <WorldLayer
    v-for="l in lamps"
    :key="`l${l}`"
    kind="billboard"
    ride
    :z="Z + l"
    :x="420"
    :y="PLATFORM_TOP - 260"
    :width="120"
    :height="520"
  >
    <svg viewBox="0 0 120 520">
      <rect x="56" y="40" width="8" height="480" fill="#33404a" />
      <rect x="50" y="500" width="20" height="20" fill="#33404a" />
      <path d="M60 40 H104 V52 H60Z" fill="#33404a" />
      <path d="M84 50 H118 L112 66 H90Z" fill="#33404a" />
      <rect x="92" y="66" width="18" height="5" fill="#ffe7a8" />
    </svg>
  </WorldLayer>

  <!-- Stationsbord, hangend onder de luifel -->
  <WorldLayer kind="billboard" ride :z="Z" :x="640" :y="-118" :width="560" :height="150" :mx="520">
    <div class="sign" :class="[`sign--${stop.kind}`, { 'sign--extra': stop.station?.bordExtra }]">
      <i class="sign__rod"></i><i class="sign__rod"></i>
      <div class="sign__plate">
        <span>{{ stop.bord }}</span>
        <span v-if="stop.station?.bordExtra" class="sign__extra">{{ stop.station.bordExtra }}</span>
      </div>
    </div>
  </WorldLayer>

  <!-- Bank en vuilnisbak -->
  <WorldLayer kind="billboard" ride :z="Z - 380" :x="900" :y="PLATFORM_TOP - 55" :width="260" :height="110">
    <svg viewBox="0 0 260 110">
      <rect x="10" y="20" width="240" height="14" rx="3" fill="#7a5a3c" />
      <rect x="10" y="40" width="240" height="14" rx="3" fill="#8b6a48" />
      <rect x="0" y="62" width="260" height="12" rx="3" fill="#8b6a48" />
      <rect x="22" y="56" width="8" height="54" fill="#33404a" />
      <rect x="230" y="56" width="8" height="54" fill="#33404a" />
    </svg>
  </WorldLayer>
  <WorldLayer kind="billboard" ride :z="Z + 300" :x="930" :y="PLATFORM_TOP - 50" :width="70" :height="100">
    <svg viewBox="0 0 70 100">
      <rect x="4" y="10" width="62" height="78" rx="6" fill="#3d6b4f" />
      <rect x="0" y="6" width="70" height="10" rx="3" fill="#2f5440" />
      <rect x="30" y="88" width="10" height="12" fill="#33404a" />
    </svg>
  </WorldLayer>

  <!-- Stationsklok bij vertrek -->
  <WorldLayer v-if="stop.kind === 'vertrek'" kind="billboard" ride :z="Z + 560" :x="470" :y="-100" :width="130" :height="190">
    <svg viewBox="0 0 130 190">
      <rect x="62" y="0" width="6" height="56" fill="#2b3640" />
      <circle cx="65" cy="122" r="62" fill="#2b3640" />
      <circle cx="65" cy="122" r="54" fill="#f7f7f2" />
      <g stroke="#1d2328" stroke-width="3">
        <line x1="65" y1="74" x2="65" y2="84" /><line x1="65" y1="160" x2="65" y2="170" />
        <line x1="17" y1="122" x2="27" y2="122" /><line x1="103" y1="122" x2="113" y2="122" />
      </g>
      <line x1="65" y1="122" x2="65" y2="86" stroke="#1d2328" stroke-width="5" stroke-linecap="round" />
      <line x1="65" y1="122" x2="90" y2="135" stroke="#1d2328" stroke-width="6" stroke-linecap="round" />
      <circle cx="65" cy="122" r="4" fill="#c8102e" />
    </svg>
  </WorldLayer>

  <!-- Stootblok aan het einde van het spoor -->
  <WorldLayer
    v-if="stop.kind === 'eind'"
    kind="billboard"
    :z="bufferZ"
    :x="0"
    :y="GROUND - 120"
    :width="460"
    :height="240"
  >
    <svg viewBox="0 0 460 240">
      <rect x="40" y="70" width="28" height="170" fill="#4a4f54" />
      <rect x="392" y="70" width="28" height="170" fill="#4a4f54" />
      <rect x="20" y="70" width="420" height="60" fill="#f2f0ea" />
      <g fill="#c8102e">
        <path d="M20 70h50l-40 60H20z" /><path d="M110 70h60l-40 60H70z" /><path d="M210 70h60l-40 60h-60z" />
        <path d="M310 70h60l-40 60h-60z" /><path d="M410 70h30v60h-70z" />
      </g>
      <rect x="20" y="70" width="420" height="60" fill="none" stroke="#2b3036" stroke-width="4" />
      <circle cx="230" cy="40" r="22" fill="#2b3036" />
      <circle cx="230" cy="40" r="15" fill="#e8313f" />
      <rect x="226" y="58" width="8" height="12" fill="#2b3036" />
    </svg>
  </WorldLayer>
</template>
