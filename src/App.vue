<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { NoToneMapping, PCFShadowMap } from 'three'
import { computed } from 'vue'
import EnergyCard from './components/EnergyCard.vue'
import TheExperience from './components/TheExperience.vue'
import TimeBar from './components/TimeBar.vue'
import { useSolar } from './composables/useSolar'
import { nightness, skyColors } from './lib/blueprint'

const { now } = useSolar()
const night = computed(() => nightness(now.value.sun.altitude))
const sceneStyle = computed(() => {
  const sky = skyColors(now.value.sun.altitude)
  return { '--sky-top': sky.top, '--sky-bottom': sky.bottom, '--stars': night.value * (1 - now.value.cloud / 200) }
})

const stars = Array.from({ length: 150 }, (_, i) => {
  const random = (n: number) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1
  const size = `${1 + random(3) * 1.8}px`
  return { left: `${random(1) * 100}%`, top: `${random(2) ** 1.5 * 80}%`, width: size, height: size, animationDelay: `${-random(4) * 4}s` }
})
</script>

<template>
  <div class="scene" :style="sceneStyle">
    <div class="stars" aria-hidden="true">
      <i v-for="(star, i) in stars" :key="i" :style="star"></i>
    </div>
    <TresCanvas alpha :clear-alpha="0" shadows :shadow-map-type="PCFShadowMap" :tone-mapping="NoToneMapping">
      <TheExperience />
    </TresCanvas>
  </div>
  <main class="hud">
    <div class="panel">
      <EnergyCard />
      <TimeBar />
    </div>
  </main>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-bottom) 80%);
}

.stars {
  position: absolute;
  inset: 0;
  opacity: var(--stars);
  pointer-events: none;
}

.stars i {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: twinkle 3.5s ease-in-out infinite;
}

@keyframes twinkle {
  50% {
    opacity: 0.25;
  }
}

.hud {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: center;
  width: 440px;
  padding: 20px;
  pointer-events: none;
}

.panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
  pointer-events: auto;
}

@media (max-width: 1100px) {
  .scene {
    position: relative;
    height: 60vh;
  }

  .hud {
    position: static;
    width: auto;
    padding: 12px;
    pointer-events: auto;
  }

  .panel {
    gap: 12px;
  }
}
</style>
