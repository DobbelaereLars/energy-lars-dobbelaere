<script setup lang="ts">
import { OrbitControls } from '@tresjs/cientos'
import { useLoop } from '@tresjs/core'
import { ref } from 'vue'
import type { Group } from 'three'

const DAY_DURATION = 24
const SUN_RADIUS = 7
const sunRef = ref<Group | null>(null)
let elapsed = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  elapsed += delta
  const progress = (elapsed % DAY_DURATION) / DAY_DURATION
  const angle = progress * 2 * Math.PI
  sunRef.value?.position.set(Math.cos(angle) * SUN_RADIUS, Math.sin(angle) * SUN_RADIUS, -3)
})
</script>

<template>
  <TresPerspectiveCamera :position="[5, 5, 5]" :look-at="[0, 0, 0]" />
  <OrbitControls />

  <TresAmbientLight :intensity="0.5" color="white" />

  <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
    <TresPlaneGeometry :args="[10, 10]" />
    <TresMeshStandardMaterial color="gray" />
  </TresMesh>

  <TresMesh :position="[0, 0.7, 0]">
    <TresBoxGeometry :args="[2, 1.4, 2]" />
    <TresMeshStandardMaterial color="lightblue" />
  </TresMesh>

  <TresGroup :position="[0, 1.666, 0]" :scale="[1, 0.4, 1]">
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[1.328, 1.328, 2.2, 3]" />
      <TresMeshStandardMaterial color="firebrick" />
    </TresMesh>
  </TresGroup>

  <TresMesh :position="[0.592, 1.824, -0.5]" :rotation="[0, 0, -0.605]">
    <TresBoxGeometry :args="[0.9, 0.04, 0.9]" />
    <TresMeshStandardMaterial color="#1a2a5c" />
  </TresMesh>
  <TresMesh :position="[0.592, 1.824, 0.5]" :rotation="[0, 0, -0.605]">
    <TresBoxGeometry :args="[0.9, 0.04, 0.9]" />
    <TresMeshStandardMaterial color="#1a2a5c" />
  </TresMesh>

  <TresGroup ref="sunRef" :position="[SUN_RADIUS, 0, -3]">
    <TresMesh>
      <TresSphereGeometry :args="[0.5, 32, 32]" />
      <TresMeshBasicMaterial color="gold" />
    </TresMesh>
    <TresPointLight :intensity="80" color="#fff2cc" />
  </TresGroup>

  <TresMesh :position="[2.5, 1.25, 2]">
    <TresCylinderGeometry :args="[0.05, 0.07, 2.5, 12]" />
    <TresMeshStandardMaterial color="#333333" />
  </TresMesh>
  <TresMesh :position="[2.5, 2.6, 2]">
    <TresSphereGeometry :args="[0.18, 24, 24]" />
    <TresMeshBasicMaterial color="#ffe9a8" />
  </TresMesh>
  <TresPointLight :position="[2.5, 2.6, 2]" :intensity="8" color="#ffd98a" />

  <TresDirectionalLight :position="[0, 2, 4]" :intensity="1" cast-shadow />

  <TresAxesHelper />
</template>
