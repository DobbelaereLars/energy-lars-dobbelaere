<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { Color, DirectionalLight, Sprite, SpriteMaterial, Vector3 } from 'three'
import { useDrag } from '../composables/useDrag'
import { useSolar } from '../composables/useSolar'
import { COLORS, dashedLine, moonTexture, nightness, orbitAngle, orbitHour, orbitPosition, setPoints, sunPosition, sunTexture } from '../lib/blueprint'

const solar = useSolar()
const { camera } = useTres()

const sun = new Sprite(new SpriteMaterial({ map: sunTexture, depthWrite: false, depthTest: false, transparent: true }))
sun.scale.setScalar(3.4)
sun.renderOrder = 2

const moon = new Sprite(new SpriteMaterial({ map: moonTexture, depthWrite: false, depthTest: false, transparent: true }))
moon.scale.setScalar(2.6)
moon.renderOrder = 2

const dayPath = dashedLine(COLORS.ink, 0.5, 1.6)
dayPath.material.transparent = true
dayPath.material.opacity = 0.45
setPoints(dayPath, Array.from({ length: 65 }, (_, i) => orbitPosition(Math.PI * i / 64)))

const nightPath = dashedLine(COLORS.ink, 0.3, 1.2)
nightPath.material.transparent = true
nightPath.material.opacity = 0.2
setPoints(nightPath, Array.from({ length: 65 }, (_, i) => orbitPosition(Math.PI + Math.PI * i / 64)))

const light = new DirectionalLight('#ffffff', 0)
light.castShadow = true
light.shadow.mapSize.set(2048, 2048)
Object.assign(light.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 })
light.shadow.bias = -0.0008
light.shadow.normalBias = 0.03

const WARM = new Color('#ffb067')
const center = new Vector3()
const right = new Vector3()
const up = new Vector3()
let dragged: Sprite | null = null

function dragAround(sprite: Sprite, offset: number) {
  useDrag(() => sprite, {
    start() {
      dragged = sprite
    },
    move(_, pointer) {
      center.set(0, 0, 0).project(camera.value!)
      orbitPosition(0, right).project(camera.value!).sub(center)
      orbitPosition(Math.PI / 2, up).project(camera.value!).sub(center)
      const dx = pointer.x - center.x
      const dy = pointer.y - center.y
      const det = right.x * up.y - right.y * up.x
      const angle = Math.atan2((right.x * dy - right.y * dx) / det, (dx * up.y - dy * up.x) / det)
      const { sunrise, sunset } = solar.sunTimes.value
      solar.setHour(orbitHour(angle + offset, sunrise, sunset))
    },
    end() {
      dragged = null
    },
  })
}

dragAround(sun, 0)
dragAround(moon, Math.PI)

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  solar.advance(Math.min(delta, 0.1))

  const s = solar.now.value.sun
  const { sunrise, sunset } = solar.sunTimes.value
  const angle = orbitAngle(solar.state.hour, sunrise, sunset)
  const sunUp = Math.sin(angle) > 0
  orbitPosition(angle, sun.position)
  orbitPosition(angle + Math.PI, moon.position)
  const fade = 1 - Math.exp(-6 * Math.min(delta, 0.1))
  sun.material.opacity += (Math.max(dragged === sun ? 0.45 : 0, Math.min(1, Math.sin(angle) / 0.25)) - sun.material.opacity) * fade
  moon.material.opacity += (Math.max(dragged === moon ? 0.45 : 0, Math.min(1, -Math.sin(angle) / 0.25)) - moon.material.opacity) * fade
  sun.visible = sun.material.opacity > 0.01
  moon.visible = moon.material.opacity > 0.01

  if (s.altitude > 0) {
    sunPosition(s.altitude, s.azimuth, light.position).multiplyScalar(1.6)
    light.color.set('#ffffff').lerp(WARM, 1 - Math.min(1, s.altitude * 180 / Math.PI / 20))
    light.intensity = 1.1 * Math.min(1, s.altitude * 180 / Math.PI / 8)
  }
  else {
    light.position.copy(moon.position).multiplyScalar(1.6)
    light.color.set('#b9c9ff')
    light.intensity = sunUp ? 0 : 0.5 * nightness(s.altitude)
  }
})
</script>

<template>
  <primitive :object="sun" />
  <primitive :object="moon" />
  <primitive :object="dayPath" />
  <primitive :object="nightPath" />
  <primitive :object="light" />
</template>
