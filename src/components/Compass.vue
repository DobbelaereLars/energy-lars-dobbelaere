<script setup lang="ts">
import { Group, Sprite, SpriteMaterial } from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { canvasTexture, COLORS, COMPASS_RADIUS } from '../lib/blueprint'

const R = COMPASS_RADIUS
const Y = 0.03

const material = new LineMaterial({ color: COLORS.ink, linewidth: 1.4, transparent: true, opacity: 0.5 })
const root = new Group()

const circle = new LineGeometry()
circle.setPositions(Array.from({ length: 97 }, (_, i) => {
  const a = i / 96 * Math.PI * 2
  return [Math.sin(a) * R, Y, Math.cos(a) * R]
}).flat())
root.add(new Line2(circle, material))

const ticks = new LineSegmentsGeometry()
ticks.setPositions(Array.from({ length: 24 }, (_, i) => {
  const a = i / 24 * Math.PI * 2
  const inner = R - (i % 6 === 0 ? 1 : i % 3 === 0 ? 0.6 : 0.3)
  return [Math.sin(a) * inner, Y, Math.cos(a) * inner, Math.sin(a) * R, Y, Math.cos(a) * R]
}).flat())
root.add(new LineSegments2(ticks, material))

function badge(letter: string, x: number, z: number, accent = false) {
  const texture = canvasTexture(96, 96, (ctx) => {
    ctx.beginPath()
    ctx.arc(48, 48, 40, 0, Math.PI * 2)
    ctx.fillStyle = accent ? COLORS.roof : '#ffffff'
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = COLORS.ink
    ctx.stroke()
    ctx.fillStyle = accent ? '#ffffff' : COLORS.ink
    ctx.font = '700 44px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 48, 51)
  })
  const sprite = new Sprite(new SpriteMaterial({ map: texture }))
  sprite.scale.setScalar(1.5)
  sprite.position.set(x, 0.75, z)
  root.add(sprite)
}

badge('N', 0, -R - 1, true)
badge('O', R + 1, 0)
badge('Z', 0, R + 1)
badge('W', -R - 1, 0)
</script>

<template>
  <primitive :object="root" />
</template>
