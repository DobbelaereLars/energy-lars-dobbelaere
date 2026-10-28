<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { Vector3 } from 'three'
import type { OrthographicCamera } from 'three'
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useSolar } from '../composables/useSolar'
import { orbitPosition, PLOT_SIZE, POLE_TOP, TREES, view } from '../lib/blueprint'
import Compass from './Compass.vue'
import Home from './Home.vue'
import Plot from './Plot.vue'
import Sky from './Sky.vue'

const TARGET = new Vector3(0, 3, 0)
const MARGIN = 2
const GAP = 24
const HALF = PLOT_SIZE / 2

const EXTENTS = [
  ...[-HALF, HALF].flatMap(x => [-HALF, HALF].flatMap(z => [new Vector3(x, 0, z), new Vector3(x, -0.6, z)])),
  ...TREES.map(([x, z, size]) => new Vector3(x, 4.3 * size, z)),
  POLE_TOP,
  ...Array.from({ length: 33 }, (_, i) => orbitPosition(Math.PI * i / 32)),
]

const solar = useSolar()
const { sizes, renderer } = useTres()
const cameraRef = shallowRef<OrthographicCamera | null>(null)
const point = new Vector3()
let dirty = true

function freeArea(canvas: DOMRect) {
  const panel = document.querySelector('.hud .panel')?.getBoundingClientRect()
  if (!panel || window.innerWidth <= 1100) {
    return { left: GAP, top: GAP, width: canvas.width - GAP * 2, height: canvas.height - GAP * 2 }
  }
  return { left: GAP, top: GAP, width: panel.left - canvas.left - GAP * 2, height: canvas.height - GAP * 2 }
}

function fit(camera: OrthographicCamera) {
  const canvas = renderer.domElement.getBoundingClientRect()
  if (!canvas.width || !canvas.height) {
    return
  }
  camera.lookAt(TARGET)
  camera.updateMatrixWorld()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of EXTENTS) {
    point.copy(p).applyMatrix4(camera.matrixWorldInverse)
    minX = Math.min(minX, point.x - MARGIN)
    maxX = Math.max(maxX, point.x + MARGIN)
    minY = Math.min(minY, point.y - MARGIN)
    maxY = Math.max(maxY, point.y + MARGIN)
  }
  const area = freeArea(canvas)
  const scale = Math.min(area.width / (maxX - minX), area.height / (maxY - minY))
  camera.left = (minX + maxX) / 2 - (area.left + area.width / 2) / scale
  camera.right = camera.left + canvas.width / scale
  camera.top = (minY + maxY) / 2 + (area.top + area.height / 2) / scale
  camera.bottom = camera.top - canvas.height / scale
  camera.updateProjectionMatrix()
  view.left = camera.left + area.left / scale
  view.right = camera.left + (area.left + area.width) / scale
  view.top = camera.top - area.top / scale
  dirty = false
}

function refit() {
  dirty = true
}

watch([sizes.width, sizes.height], refit)
onMounted(() => {
  window.addEventListener('resize', refit)
  document.fonts?.ready.then(refit)
})
onUnmounted(() => window.removeEventListener('resize', refit))

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  if (dirty && cameraRef.value) {
    fit(cameraRef.value)
  }
})

const daylight = () => Math.min(1, Math.max(0, solar.now.value.sun.altitude * 180 / Math.PI / 8 + 0.4))
</script>

<template>
  <TresOrthographicCamera ref="cameraRef" :position="[40, 44, 40]" :near="-200" :far="400" />

  <TresHemisphereLight :intensity="0.55 + 1.95 * daylight()" color="#f2f7ff" ground-color="#9fbbe0" />

  <Plot />
  <Compass />
  <Sky />
  <Home />
</template>
