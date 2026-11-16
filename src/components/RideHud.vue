<script setup>
import { computed } from 'vue'

/**
 * Alles wat plat bovenop de rit staat: het vertrekbord, de lijnkaart en de
 * informatieborden per halte. De TimeEngine laat de borden in- en uitfaden ([data-hud]).
 */
const props = defineProps({
  data: { type: Object, required: true },
  layout: { type: Object, required: true },
  active: { type: Number, default: 0 },
  board: { type: Object, required: true },
  /** Afgestapt: dan verdwijnen de lijnkaart en de borden van de rit. */
  platform: { type: Boolean, default: false },
})
const emit = defineEmits(['go', 'alight'])

const years = Object.fromEntries(props.data.jaren.map((j) => [j.id, j]))
const stopsById = Object.fromEntries(props.layout.stops.map((s) => [s.id, s]))

/** Haltes met een tekstbord (de tunnel heeft er geen). */
const panels = computed(() => props.layout.windows.filter((w) => w.hud))

/** Het vertrekbord. */
const boardStop = computed(() => stopsById[props.board.id])
const boardYear = computed(() => years[boardStop.value?.year])
const boardName = computed(() => [...(boardStop.value?.bord ?? '')])

/** De lijnkaart: elke halte op zijn plek langs de rit. */
const pct = (cam) => `${((cam / props.layout.total) * 100).toFixed(2)}%`
const route = computed(() =>
  props.layout.windows.map((w, i) => ({ ...w, index: i, left: pct(w.cam) })),
)
const tunnelSpan = computed(() =>
  props.layout.tunnel
    ? { left: pct(props.layout.tunnel.start), width: pct(props.layout.tunnel.end - props.layout.tunnel.start) }
    : null,
)
</script>

<template>
  <div class="hud-layer">
    <!-- Vertrekbord -->
    <div class="board" aria-live="polite">
      <div class="board__main">
        <span class="board__mode">{{ board.mode === 'halte' ? 'Halte' : 'Volgende halte' }}</span>
        <span class="board__name" :aria-label="boardStop?.bord">
          <span
            v-for="(c, i) in boardName"
            :key="`${board.id}-${board.mode}-${i}`"
            class="flap"
            :style="{ animationDelay: `${i * 28}ms` }"
            aria-hidden="true"
            >{{ c === ' ' ? ' ' : c }}</span
          >
        </span>
      </div>
      <div v-if="boardYear" class="board__track">
        <span>{{ boardYear.spoor }}</span>
        <strong>{{ boardYear.label }}</strong>
      </div>
    </div>

    <!-- Lijnkaart -->
    <nav v-show="!platform" class="route" aria-label="Haltes">
      <div class="route__line" data-marker-track>
        <span v-if="tunnelSpan" class="route__tunnel" :style="{ left: tunnelSpan.left, width: tunnelSpan.width }"></span>
        <span class="route__train" data-marker></span>
        <template v-for="r in route" :key="r.id">
          <button
            v-if="r.kind !== 'tunnel'"
            class="route__stop"
            :class="[`route__stop--${r.kind}`, { 'is-active': active === r.index }]"
            :style="{ left: r.left }"
            @click="emit('go', r.index)"
          >
            <i></i><span>{{ r.bord }}</span>
          </button>
        </template>
      </div>
    </nav>

    <!-- Informatieborden per halte -->
    <section
      v-for="w in panels"
      :key="w.id"
      :data-hud="w.id"
      class="hud"
      :class="{ 'is-hidden': w.kind !== 'vertrek' }"
    >
      <article class="poster">
        <header class="poster__head">
          <span>{{ years[w.year].label }}</span>
          <span>{{ years[w.year].schooljaar }}</span>
        </header>

        <!-- Voorstelling -->
        <div v-if="w.kind === 'vertrek'" class="poster__body">
          <h1 class="poster__title">{{ data.voorstelling.titel }}</h1>
          <p class="poster__lead">{{ data.voorstelling.tekst }}</p>
          <dl class="poster__rows">
            <div>
              <dt>Opleiding</dt>
              <dd>{{ data.opleiding }}</dd>
            </div>
            <div>
              <dt>Interesses</dt>
              <dd>{{ data.voorstelling.interesses.join(', ') }}</dd>
            </div>
            <div>
              <dt>Uit de POP-sessies</dt>
              <dd>{{ data.voorstelling.pop }}</dd>
            </div>
          </dl>
          <button class="poster__button" @click="emit('alight', w.id)">Afstappen</button>
        </div>

        <!-- Eindreflectie -->
        <div v-else-if="w.kind === 'eind'" class="poster__body">
          <h2 class="poster__title">Eindreflectie</h2>
          <p class="poster__lead">{{ data.eindreflectie.samenvatting }}</p>
          <button class="poster__button" @click="emit('alight', w.id)">Afstappen</button>
        </div>

        <!-- Activiteit -->
        <div v-else class="poster__body">
          <h2 class="poster__title">{{ stopsById[w.id].station.bord }}</h2>
          <p class="poster__domain">{{ stopsById[w.id].station.domein }}</p>
          <p class="poster__lead">{{ stopsById[w.id].station.samenvatting }}</p>
          <table class="poster__table">
            <tbody>
              <tr v-for="a in stopsById[w.id].station.activiteiten" :key="a.titel">
                <th scope="row">{{ a.titel }}</th>
                <td>{{ a.datum }}</td>
              </tr>
            </tbody>
          </table>
          <button class="poster__button" @click="emit('alight', w.id)">
            {{ w.kind === 'showcase' ? 'Afstappen en het verslag lezen' : 'Afstappen' }}
          </button>
        </div>
      </article>
    </section>

    <div class="hint" data-hint aria-hidden="true">Scroll om te vertrekken</div>
  </div>
</template>
