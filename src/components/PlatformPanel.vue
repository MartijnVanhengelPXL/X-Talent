<script setup>
import { computed, nextTick, ref, watch } from 'vue'

/**
 * De uitleg die je leest als je afgestapt bent: naast de fotomuur van het station.
 * Opgebouwd volgens de richtvragen van X-Talent (omschrijving, kern en reflectie).
 */
const props = defineProps({
  data: { type: Object, required: true },
  stop: { type: Object, default: null },
  /** Het paneel verschijnt pas als de camera op het perron staat. */
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['board'])

const station = computed(() => props.stop?.station ?? null)
const jaar = computed(() => props.data.jaren.find((j) => j.id === props.stop?.year))
const img = (src) => import.meta.env.BASE_URL + src

const boardBtn = ref(null)
watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await nextTick()
      boardBtn.value?.focus({ preventScroll: true })
    }
  },
)
</script>

<template>
  <Transition name="panel">
    <aside v-if="stop && visible" class="platform-panel" :aria-label="stop.titel" @keydown.esc="emit('board')">
      <header class="platform-panel__head">
        <div>
          <p>{{ jaar?.label }}<template v-if="station">, {{ station.domein }}</template></p>
          <h2>{{ stop.titel }}</h2>
        </div>
        <button ref="boardBtn" class="platform-panel__board" @click="emit('board')">Opstappen</button>
      </header>

      <div class="platform-panel__body" data-scrollable tabindex="0">
        <!-- Foto's: op een gsm hier, op een groot scherm hangen ze aan de muur -->
        <div class="platform-panel__photos">
          <figure v-for="(f, i) in stop.fotos" :key="i">
            <img :src="img(f.src)" :alt="f.onderschrift" />
            <figcaption>{{ f.onderschrift }}</figcaption>
          </figure>
        </div>

        <!-- Voorstelling -->
        <template v-if="stop.kind === 'vertrek'">
          <p class="platform-panel__lead">{{ data.voorstelling.tekst }}</p>
          <dl class="platform-panel__rows">
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
        </template>

        <!-- Eindreflectie -->
        <template v-else-if="stop.kind === 'eind'">
          <p class="platform-panel__lead">{{ data.eindreflectie.samenvatting }}</p>
          <section v-for="q in data.eindreflectie.vragen" :key="q.vraag" class="qa">
            <h3>{{ q.vraag }}</h3>
            <p>{{ q.antwoord }}</p>
          </section>
        </template>

        <!-- Activiteit -->
        <template v-else-if="station">
          <p class="platform-panel__lead">{{ station.samenvatting }}</p>

          <section v-if="station.verslag">
            <h3 class="platform-panel__part">Omschrijving</h3>
            <dl class="platform-panel__rows">
              <div>
                <dt>Doel van de activiteit</dt>
                <dd>{{ station.verslag.doelstellingen.activiteit }}</dd>
              </div>
              <div>
                <dt>Mijn eigen doel</dt>
                <dd>{{ station.verslag.doelstellingen.eigen }}</dd>
              </div>
              <div v-if="station.verslag.team">
                <dt>Team</dt>
                <dd>{{ station.verslag.team }}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 class="platform-panel__part">{{ station.activiteiten.length > 1 ? 'Activiteiten' : 'Activiteit' }}</h3>
            <article v-for="a in station.activiteiten" :key="a.titel" class="activity">
              <h4>{{ a.titel }}</h4>
              <p>{{ a.omschrijving }}</p>
              <p class="activity__meta">
                <span>{{ a.locatie }}</span><span>{{ a.datum }}</span><span v-if="a.duur">{{ a.duur }}</span>
              </p>
            </article>
          </section>

          <template v-if="station.verslag">
            <section>
              <h3 class="platform-panel__part">Verslag</h3>
              <p>{{ station.verslag.verslag }}</p>
            </section>
            <section>
              <h3 class="platform-panel__part">Reflectie</h3>
              <section v-for="q in station.verslag.reflectie" :key="q.vraag" class="qa">
                <h4>{{ q.vraag }}</h4>
                <p>{{ q.antwoord }}</p>
              </section>
            </section>
          </template>
        </template>
      </div>
    </aside>
  </Transition>
</template>
