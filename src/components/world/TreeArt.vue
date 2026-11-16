<script setup>
/**
 * Getekende bomen langs het spoor. Elke soort is een eenvoudige SVG met een lichte
 * en een schaduwkant, zodat het landschap één tekenstijl heeft.
 * Spoor 2 (Vlaanderen): populieren, knotwilgen, ronde bomen. Spoor 3 (richting Duitsland): sparren.
 */
defineProps({ kind: { type: String, required: true } })
</script>

<template>
  <svg v-if="kind === 'populier'" viewBox="0 0 100 360" preserveAspectRatio="none">
    <rect x="46" y="300" width="8" height="60" fill="#5b4a3a" />
    <path d="M50 4 C76 60 80 170 70 250 C64 296 56 312 50 312 C44 312 36 296 30 250 C20 170 24 60 50 4Z" fill="#56703a" />
    <path d="M50 4 C76 60 80 170 70 250 C64 296 56 312 50 312 C56 250 58 120 50 4Z" fill="#6f8b46" />
  </svg>

  <svg v-else-if="kind === 'rond'" viewBox="0 0 200 200">
    <rect x="94" y="120" width="12" height="80" fill="#5b4a3a" />
    <circle cx="70" cy="95" r="52" fill="#4f6a37" />
    <circle cx="130" cy="90" r="56" fill="#5d7a3f" />
    <circle cx="100" cy="58" r="54" fill="#6f8b46" />
    <circle cx="120" cy="50" r="30" fill="#7f9b52" />
  </svg>

  <svg v-else-if="kind === 'wilg'" viewBox="0 0 160 200">
    <path d="M66 200 L70 110 C64 104 62 96 66 90 L94 90 C98 96 96 104 90 110 L94 200Z" fill="#5b4a3a" />
    <path d="M80 92 C40 80 10 60 8 30 C30 54 54 64 70 70 C56 50 50 26 56 4 C66 30 72 54 80 68 C88 54 94 30 104 4 C110 26 104 50 90 70 C106 64 130 54 152 30 C150 60 120 80 80 92Z" fill="#7c9550" />
    <path d="M80 92 C88 54 94 30 104 4 C110 26 104 50 90 70 C106 64 130 54 152 30 C150 60 120 80 80 92Z" fill="#91a965" />
  </svg>

  <svg v-else-if="kind === 'struik'" viewBox="0 0 200 100">
    <ellipse cx="60" cy="70" rx="58" ry="32" fill="#4f6a37" />
    <ellipse cx="135" cy="66" rx="62" ry="36" fill="#5d7a3f" />
    <ellipse cx="100" cy="52" rx="50" ry="34" fill="#6f8b46" />
  </svg>

  <svg v-else viewBox="0 0 120 300">
    <rect x="55" y="262" width="10" height="38" fill="#4a3b2e" />
    <path d="M60 2 L88 70 L74 70 L100 140 L82 140 L112 220 L90 220 L118 270 L2 270 L30 220 L8 220 L38 140 L20 140 L46 70 L32 70Z" fill="#2f4a33" />
    <path d="M60 2 L88 70 L74 70 L100 140 L82 140 L112 220 L90 220 L118 270 L60 270Z" fill="#3c5c3d" />
  </svg>
</template>
