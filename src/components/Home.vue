<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { BoxGeometry, CircleGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Plane, PlaneGeometry, Shape, Sprite, SpriteMaterial, Vector2, Vector3 } from 'three'
import { useDrag } from '../composables/useDrag'
import { MAX_PANELS, PANEL, TILT, useSolar } from '../composables/useSolar'
import { COLORS, COMPASS_RADIUS, damp, flat, handleTexture, lamp, lightUp, nightness, panelTexture, slotTexture, solid } from '../lib/blueprint'

const W = 9
const D = 7
const H = 3.4
const DEG = Math.PI / 180
const RISE = D / 2 * Math.tan(TILT * DEG)
const SLOPE = D / 2 / Math.cos(TILT * DEG) + 0.5

const solar = useSolar()
const home = new Group()
const effects = new Group()

home.add(
  solid(new BoxGeometry(W, H, D), COLORS.wall, [0, H / 2, 0]),
  solid(new BoxGeometry(W + 0.12, 0.55, D + 0.12), COLORS.plinth, [0, 0.275, 0]),
)

const gable = new Shape([new Vector2(-D / 2, 0), new Vector2(D / 2, 0), new Vector2(0, RISE)])
home.add(solid(new ExtrudeGeometry(gable, { depth: W, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-W / 2, H, 0), COLORS.wall))

function roof(direction: 1 | -1, color: string) {
  const pivot = new Group()
  pivot.position.set(0, H + RISE, 0)
  pivot.rotation.x = direction * TILT * DEG
  pivot.add(solid(new BoxGeometry(W + 0.7, 0.22, SLOPE), color, [0, 0.11, direction * SLOPE / 2]))
  home.add(pivot)
  return pivot
}

const front = roof(1, COLORS.roof)
roof(-1, COLORS.roofBack)

const panelMaterial = new MeshLambertMaterial({ map: panelTexture, emissive: COLORS.production, emissiveIntensity: 0 })
const slotMaterial = new MeshBasicMaterial({ map: slotTexture, transparent: true, depthWrite: false })
const hitMaterial = new MeshBasicMaterial({ visible: false })
const slots = Array.from({ length: MAX_PANELS }, (_, i) => {
  const x = (Math.floor(i / 2) - 2) * (PANEL.width + 0.14)
  const z = 0.45 + PANEL.length / 2 + (i % 2) * (PANEL.length + 0.12)
  const panel = solid(new BoxGeometry(PANEL.width, 0.08, PANEL.length), panelMaterial, [x, 0.27, z])
  const slot = new Mesh(new PlaneGeometry(PANEL.width, PANEL.length).rotateX(-Math.PI / 2), slotMaterial)
  slot.position.set(x, 0.23, z)
  const target = new Mesh(new PlaneGeometry(PANEL.width, PANEL.length).rotateX(-Math.PI / 2), hitMaterial)
  target.position.set(x, 0.32, z)
  target.userData.index = i
  front.add(panel, slot, target)
  return { panel, slot, target, scale: 0 }
})

const glassMaterial = flat(COLORS.glass)
glassMaterial.emissive.set('#ffd27a')

function windowAt(position: [number, number, number], rotationY = 0, width = 1.3, height = 1.4) {
  const group = new Group()
  group.add(
    solid(new BoxGeometry(width + 0.24, height + 0.24, 0.08), COLORS.wall),
    solid(new BoxGeometry(width, height, 0.1), glassMaterial),
    solid(new BoxGeometry(0.07, height, 0.13), COLORS.wall),
  )
  group.position.set(...position)
  group.rotation.y = rotationY
  home.add(group)
}

windowAt([-2.7, 2, D / 2 + 0.04])
windowAt([2.6, 2, D / 2 + 0.04])
windowAt([W / 2 + 0.04, 2, 1.5], Math.PI / 2)
windowAt([W / 2 + 0.04, 2, -1.2], Math.PI / 2)
windowAt([0, 2, -D / 2 - 0.04], Math.PI)
windowAt([-W / 2 - 0.04, 2, 0], -Math.PI / 2)
home.add(
  solid(new BoxGeometry(1.15, 2.3, 0.1), COLORS.glass, [0, 1.15 + 0.3, D / 2 + 0.05]),
  solid(new BoxGeometry(0.4, 1.2, 0.12), COLORS.wall, [0, 1.75, D / 2 + 0.06]),
)

const doorLamp = lamp(0, 3)
doorLamp.group.position.set(0.95, 2.45, D / 2 + 0.25)
home.add(doorLamp.group)

const lamps = [doorLamp, ...[-5.6, 5.6].map((x) => {
  const post = lamp(3.8, 30)
  post.group.position.set(x, 0, 5.6)
  home.add(post.group)
  return post
})]

const handle = new Sprite(new SpriteMaterial({ map: handleTexture, depthTest: false, transparent: true }))
handle.position.set(0, 0.9, COMPASS_RADIUS - 1.2)
handle.renderOrder = 3
home.add(handle)

home.add(solid(new BoxGeometry(0.2, 0.8, 0.55), COLORS.wall, [W / 2 + 0.1, 1.4, 0]))

const turntable = new Mesh(new CircleGeometry(15, 48).rotateX(-Math.PI / 2), new MeshBasicMaterial({ visible: false }))
effects.add(turntable)

const ground = new Plane(new Vector3(0, 1, 0), 0)
const hit = new Vector3()
let startAngle = 0
let startAzimuth = 0
let highlighted = false
let turning = false

useDrag(() => turntable, {
  start(ray) {
    turning = true
    if (ray.ray.intersectPlane(ground, hit)) {
      startAngle = Math.atan2(hit.x, hit.z)
      startAzimuth = solar.state.azimuth
    }
  },
  move(ray) {
    if (ray.ray.intersectPlane(ground, hit)) {
      solar.setAzimuth(startAzimuth - (Math.atan2(hit.x, hit.z) - startAngle) / DEG)
    }
  },
  end() {
    turning = false
  },
  hover(over) {
    highlighted = over
  },
  click(ray) {
    const [picked] = ray.intersectObjects(slots.map(s => s.target))
    if (picked) {
      const index = picked.object.userData.index as number
      solar.setPanels(index < solar.state.panels ? index : index + 1)
    }
  },
})

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.1)
  const { state, now, peak } = solar
  const n = now.value

  const angle = (180 - state.azimuth) * DEG
  home.rotation.y += Math.atan2(Math.sin(angle - home.rotation.y), Math.cos(angle - home.rotation.y)) * (1 - Math.exp(-6 * dt))
  home.updateMatrixWorld()
  const size = highlighted || turning ? 2.2 : 1.7 + Math.sin(performance.now() / 400) * 0.08
  handle.scale.setScalar(damp(handle.scale.x, size, 12, dt))

  slots.forEach((s, i) => {
    s.scale = damp(s.scale, i < state.panels ? 1 : 0, 10, dt)
    s.panel.scale.setScalar(Math.max(0.001, s.scale))
    s.panel.visible = s.scale > 0.01
    s.slot.visible = i >= state.panels
  })

  const share = Math.min(1, n.production / peak.value)
  panelMaterial.emissiveIntensity = share * 0.7
  const night = nightness(n.sun.altitude)
  glassMaterial.emissiveIntensity = night * 0.9
  lightUp(lamps, night)
})
</script>

<template>
  <primitive :object="home" />
  <primitive :object="effects" />
</template>
