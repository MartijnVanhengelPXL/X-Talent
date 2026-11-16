<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import data from '../data/portfolio.json'
import { buildLayout } from '../journey/layout'
import { RideEngine } from '../journey/engine'
import LandscapeScene from './world/LandscapeScene.vue'
import StationScene from './world/StationScene.vue'
import TunnelScene from './world/TunnelScene.vue'
import RideHud from './RideHud.vue'
import PlatformPanel from './PlatformPanel.vue'
import './world/world.css'
import './hud.css'

/**
 * De treinrit. Het spoor (track) is heel hoog zodat je kunt scrollen; het podium (stage)
 * blijft sticky in beeld en toont de 3D-wereld vanuit de cabine van de trein.
 */
const layout = buildLayout(data)

const track = ref(null)
const stage = ref(null)
const scaler = ref(null)
const world = ref(null)
const active = ref(0)
const board = ref({ mode: 'halte', id: layout.stops[0].id })
/** Bij welke halte je afgestapt bent, en of de camera al op het perron staat. */
const platformStop = ref(null)
const onPlatform = ref(false)
let engine = null

const spoorNr = (stop) => data.jaren.find((j) => j.id === stop.year)?.spoor.replace(/\D/g, '') ?? ''

async function alight(id) {
  if (!engine || platformStop.value) return
  platformStop.value = layout.stops.find((s) => s.id === id)
  await engine.alight(id)
  onPlatform.value = true
}

async function boardTrain() {
  if (!engine || !onPlatform.value) return
  onPlatform.value = false
  await engine.board()
  platformStop.value = null
}

function go(i) {
  if (!platformStop.value) engine?.goTo(i)
}

onMounted(() => {
  const huds = {}
  stage.value.querySelectorAll('[data-hud]').forEach((el) => (huds[el.dataset.hud] = el))
  engine = new RideEngine(
    {
      track: track.value,
      stage: stage.value,
      scaler: scaler.value,
      world: world.value,
      huds,
      marker: stage.value.querySelector('[data-marker]'),
      markerTrack: stage.value.querySelector('[data-marker-track]'),
      hint: stage.value.querySelector('[data-hint]'),
    },
    layout,
    {
      onChapter(index) {
        active.value = index
        stage.value.dataset.era = layout.windows[index].year
      },
      onBoard(state) {
        board.value = state
      },
    },
  )
  engine.start()
})

onBeforeUnmount(() => engine?.destroy())
</script>

<template>
  <div ref="track" class="track" :style="{ height: `${layout.trackVh}vh` }">
    <div ref="stage" class="stage" :data-era="layout.stops[0].year">
      <!-- Lucht en verre horizon -->
      <div class="sky sky--2tin" aria-hidden="true">
        <svg class="far" viewBox="0 0 1600 160" preserveAspectRatio="none">
          <path d="M0 160 V128 C80 120 140 126 220 118 C300 112 360 124 460 120 C560 116 620 104 700 110 C800 118 880 112 980 116 C1080 120 1160 108 1260 114 C1360 120 1460 112 1600 118 V160Z" fill="#7d955a" />
          <rect x="1040" y="62" width="10" height="56" fill="#8b9a86" />
          <path d="M1036 64 L1045 30 L1054 64Z" fill="#8b9a86" />
          <g stroke="#b9c4c2" stroke-width="3" fill="none">
            <line x1="300" y1="122" x2="300" y2="58" />
            <line x1="300" y1="58" x2="276" y2="44" /><line x1="300" y1="58" x2="326" y2="48" /><line x1="300" y1="58" x2="298" y2="86" />
            <line x1="360" y1="124" x2="360" y2="70" />
            <line x1="360" y1="70" x2="342" y2="60" /><line x1="360" y1="70" x2="380" y2="64" /><line x1="360" y1="70" x2="359" y2="92" />
          </g>
          <path d="M0 160 V140 C120 136 260 142 420 138 C600 134 760 142 940 138 C1120 134 1300 142 1600 136 V160Z" fill="#91a96d" />
        </svg>
      </div>
      <div class="sky sky--3tin" aria-hidden="true">
        <svg class="far" viewBox="0 0 1600 160" preserveAspectRatio="none">
          <path d="M0 160 V80 C120 40 240 30 380 70 C500 104 600 60 760 40 C900 22 1020 70 1160 60 C1300 50 1440 20 1600 50 V160Z" fill="#8e9c8a" />
          <path d="M0 160 V110 C160 80 300 90 460 108 C620 126 760 86 940 90 C1120 94 1260 120 1600 96 V160Z" fill="#6f8257" />
          <path d="M0 160 V138 C200 128 420 140 640 134 C860 128 1080 142 1300 134 C1420 130 1520 134 1600 132 V160Z" fill="#7f9461" />
        </svg>
      </div>

      <div ref="scaler" class="scaler">
        <div class="persp">
          <div ref="world" class="world" aria-hidden="true">
            <LandscapeScene :layout="layout" />
            <StationScene v-for="s in layout.stops" :key="s.id" :stop="s" :buffer-z="layout.bufferZ" :spoor="spoorNr(s)" />
            <TunnelScene v-if="layout.tunnel" :tunnel="layout.tunnel" />
          </div>
        </div>
      </div>

      <div
        v-if="layout.tunnel"
        class="ov ov--tunnel"
        data-overlay
        :data-from="layout.tunnel.start - 300"
        :data-to="layout.tunnel.end + 200"
        aria-hidden="true"
      ></div>

      <RideHud
        :data="data"
        :layout="layout"
        :active="active"
        :board="board"
        :platform="!!platformStop"
        @go="go"
        @alight="alight"
      />
      <PlatformPanel :data="data" :stop="platformStop" :visible="onPlatform" @board="boardTrain" />
    </div>
  </div>
</template>

<style scoped>
.track {
  position: relative;
}
.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #e4ebe2;
}
.scaler {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  /* De 3D-wereld blijft in haar eigen laag, onder de borden en het uitlegpaneel. */
  isolation: isolate;
}
.persp {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
/* Geen preserve-3d: elk object wordt apart geprojecteerd en de engine bepaalt de volgorde. */
.world {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  perspective: 1000px;
  perspective-origin: 0 0;
}
.ov {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}
.ov--tunnel {
  background: radial-gradient(ellipse 70% 80% at 50% 50%, transparent 40%, rgba(10, 10, 12, 0.7) 100%);
}
</style>
