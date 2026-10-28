<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { BoxGeometry, CylinderGeometry, Group, MeshLambertMaterial, RepeatWrapping, SphereGeometry, Vector3 } from 'three'
import { useSolar } from '../composables/useSolar'
import { canvasTexture, COLORS, damp, PLOT_SIZE, POLE, POLE_TOP, rounded, solid, TREES, view } from '../lib/blueprint'

const SIZE = PLOT_SIZE
const CLOUDS = 5

const grid = canvasTexture(64, 64, (ctx) => {
  ctx.fillStyle = COLORS.plot
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = '#d2e2f5'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, 64, 64)
})
grid.wrapS = RepeatWrapping
grid.wrapT = RepeatWrapping
grid.repeat.set(SIZE / 2, SIZE / 2)

const root = new Group()
const plot = solid(new BoxGeometry(SIZE, 0.6, SIZE), new MeshLambertMaterial({ map: grid, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), [0, -0.3, 0])
plot.castShadow = false
root.add(plot)

function tree(x: number, z: number, size: number) {
  const group = new Group()
  group.position.set(x, 0, z)
  group.scale.setScalar(size)
  group.add(
    rounded(new CylinderGeometry(0.16, 0.22, 2, 10), COLORS.wall, [0, 1, 0]),
    rounded(new SphereGeometry(1.35, 24, 16), '#c4dbf4', [0, 2.9, 0]),
  )
  root.add(group)
}

TREES.forEach(([x, z, size]) => tree(x, z, size))

root.add(
  rounded(new CylinderGeometry(0.14, 0.2, POLE_TOP.y, 10), COLORS.wall, [POLE.x, POLE_TOP.y / 2, POLE.z]),
  solid(new BoxGeometry(1.6, 0.16, 0.16), COLORS.wall, [POLE.x, POLE_TOP.y - 0.3, POLE.z]),
)

const clouds = Array.from({ length: CLOUDS }, (_, i) => {
  const cloud = new Group()
  ;[[0, 0, 1.4], [1.5, -0.2, 1.1], [-1.5, -0.3, 1]].forEach(([x, y, r]) => {
    cloud.add(rounded(new SphereGeometry(r, 20, 14), COLORS.wall, [x, y, 0]))
  })
  root.add(cloud)
  return { cloud, shown: 0, u: (i + 0.5) / CLOUDS, row: i % 2 }
})

const solar = useSolar()
const { camera } = useTres()
const local = new Vector3()

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.1)
  const cam = camera.value
  if (!cam) {
    return
  }
  const visible = Math.round(solar.now.value.cloud / 100 * CLOUDS)
  clouds.forEach((c, i) => {
    c.u = (c.u + dt * 0.012) % 1
    c.shown = damp(c.shown, i < visible ? 1 : 0, 3, dt)
    const size = c.shown * Math.max(0, Math.min(1, c.u / 0.12, (1 - c.u) / 0.12))
    c.cloud.scale.set(size, size * 0.75, size)
    c.cloud.visible = size > 0.01
    local.set(view.left + 3 + (view.right - view.left - 6) * c.u, view.top - 2.5 - c.row * 2.6, -120)
    c.cloud.position.copy(local).applyMatrix4(cam.matrixWorld)
    c.cloud.quaternion.copy(cam.quaternion)
  })
})
</script>

<template>
  <primitive :object="root" />
</template>
