<script setup>
import data from './data/portfolio.json'
import TrainRide from './components/TrainRide.vue'
import ActivityOverview from './components/ActivityOverview.vue'

const naarBoven = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <TrainRide />
  <ActivityOverview />
  <footer class="footer">
    <span>{{ data.naam }}, X-Talent 2026-2027</span>
    <a href="#" @click.prevent="naarBoven">Opnieuw instappen</a>
  </footer>
</template>
