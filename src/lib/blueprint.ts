import { AdditiveBlending, BackSide, BoxGeometry, CanvasTexture, Color, CylinderGeometry, EdgesGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, PointLight, Sprite, SpriteMaterial, SRGBColorSpace, Vector3 } from 'three'
import type { BufferGeometry, Material } from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'

export const COLORS = {
  ink: '#1d3461',
  wall: '#ffffff',
  plinth: '#c6daf2',
  roof: '#2a62c9',
  roofBack: '#1f3f7d',
  glass: '#d4e5f8',
  plot: '#e9f2fc',
  panel: '#cfe1f7',
  sun: '#ffc83d',
  production: '#f2a516',
  import: '#d9534f',
}

export const POLE = new Vector3(11, 0, -9)
export const PLOT_SIZE = 28
export const TREES: [number, number, number][] = [[-11, 5.5, 0.9], [6.5, -11.2, 1], [-6.5, -11.4, 0.8]]
export const POLE_TOP = new Vector3(POLE.x, 6.2, POLE.z)

export const ink = new LineMaterial({ color: COLORS.ink, linewidth: 1.6 })
const hullMaterial = new MeshBasicMaterial({ color: COLORS.ink, side: BackSide })

export function flat(color: string) {
  return new MeshLambertMaterial({ color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
}

export function outline(geometry: BufferGeometry) {
  return new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(geometry, 25)), ink)
}

export function solid(geometry: BufferGeometry, material: Material | string, position: [number, number, number] = [0, 0, 0]) {
  const mesh = new Mesh(geometry, typeof material === 'string' ? flat(material) : material)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.add(outline(geometry))
  return mesh
}

export function rounded(geometry: BufferGeometry, material: Material | string, position: [number, number, number] = [0, 0, 0]) {
  const mesh = new Mesh(geometry, typeof material === 'string' ? flat(material) : material)
  mesh.position.set(...position)
  mesh.castShadow = true
  const hull = new Mesh(geometry, hullMaterial)
  hull.scale.setScalar(1.06)
  mesh.add(hull)
  return mesh
}

export function dashedLine(color: string, dash = 0.45, linewidth = 2) {
  const line = new Line2(new LineGeometry(), new LineMaterial({ color, linewidth, dashed: true, dashSize: dash, gapSize: dash * 0.8 }))
  line.frustumCulled = false
  return line
}

export const view = { left: -20, right: 20, top: 15 }

export function setPoints(line: Line2, points: Vector3[]) {
  line.geometry.setPositions(points.flatMap(p => [p.x, p.y, p.z]))
  line.computeLineDistances()
}

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export const panelTexture = canvasTexture(128, 192, (ctx) => {
  ctx.fillStyle = COLORS.panel
  ctx.fillRect(0, 0, 128, 192)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  for (let x = 1; x < 4; x++) {
    ctx.beginPath()
    ctx.moveTo(x * 32, 0)
    ctx.lineTo(x * 32, 192)
    ctx.stroke()
  }
  for (let y = 1; y < 6; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * 32)
    ctx.lineTo(128, y * 32)
    ctx.stroke()
  }
})

export const slotTexture = canvasTexture(128, 192, (ctx) => {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 4
  ctx.setLineDash([12, 9])
  ctx.strokeRect(4, 4, 120, 184)
})

export const sunTexture = canvasTexture(256, 256, (ctx) => {
  ctx.translate(128, 128)
  ctx.strokeStyle = COLORS.ink
  ctx.lineCap = 'round'
  ctx.lineWidth = 10
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4)
    ctx.beginPath()
    ctx.moveTo(0, 74)
    ctx.lineTo(0, 108)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, 56, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.sun
  ctx.fill()
  ctx.stroke()
})

export const SUN_DISTANCE = 16

export function sunPosition(altitude: number, azimuth: number, target = new Vector3()) {
  return target.set(
    Math.cos(altitude) * Math.sin(azimuth),
    Math.sin(altitude),
    -Math.cos(altitude) * Math.cos(azimuth),
  ).multiplyScalar(SUN_DISTANCE)
}

export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

export function nightness(altitude: number) {
  return Math.min(1, Math.max(0, (2 - altitude * 180 / Math.PI) / 6))
}

export const moonTexture = canvasTexture(256, 256, (ctx) => {
  ctx.translate(128, 128)
  ctx.lineWidth = 10
  ctx.strokeStyle = COLORS.ink
  ctx.fillStyle = '#f4f1de'
  ctx.beginPath()
  ctx.arc(0, 0, 90, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(42, -30, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.beginPath()
  ctx.arc(0, 0, 90, 0, Math.PI * 2)
  ctx.clip()
  ctx.beginPath()
  ctx.arc(42, -30, 80, 0, Math.PI * 2)
  ctx.stroke()
})

export const glowTexture = canvasTexture(128, 128, (ctx) => {
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255, 220, 140, 0.95)')
  gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.35)')
  gradient.addColorStop(1, 'rgba(255, 190, 90, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
})

export const lampGlass = new MeshLambertMaterial({ color: '#fff6dc', emissive: '#ffc85a', emissiveIntensity: 0 })
const glowMaterial = new SpriteMaterial({ map: glowTexture, blending: AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })

export interface Lamp {
  group: Group
  light: PointLight
  max: number
}

export function lamp(height: number, max: number): Lamp {
  const group = new Group()
  const size = height > 0 && height < 2 ? 0.3 : 0.42
  if (height > 0) {
    group.add(rounded(new CylinderGeometry(0.08, 0.12, height, 10), COLORS.wall, [0, height / 2, 0]))
  }
  group.add(
    solid(new BoxGeometry(size, size * 1.1, size), lampGlass, [0, height + size * 0.55, 0]),
    solid(new BoxGeometry(size * 1.4, 0.1, size * 1.4), COLORS.ink, [0, height + size * 1.15, 0]),
  )
  const halo = new Sprite(glowMaterial)
  halo.scale.setScalar(size * 7)
  halo.position.y = height + size * 0.55
  const light = new PointLight('#ffc874', 0, 0, 2)
  light.position.y = height + size * 0.4
  group.add(halo, light)
  return { group, light, max }
}

export function lightUp(lamps: Lamp[], night: number) {
  lampGlass.emissiveIntensity = night * 1.2
  glowMaterial.opacity = night * 0.85
  lamps.forEach((l) => {
    l.light.intensity = night * l.max
  })
}

export const ORBIT_RADIUS = 15
const ORBIT_TILT = 80 * Math.PI / 180
const ORBIT_RIGHT = new Vector3(1, 0, 0)
const ORBIT_UP = new Vector3(0, Math.cos(ORBIT_TILT), Math.sin(ORBIT_TILT))

export function orbitPosition(angle: number, target = new Vector3()) {
  return target.copy(ORBIT_RIGHT).multiplyScalar(Math.cos(angle) * ORBIT_RADIUS).addScaledVector(ORBIT_UP, Math.sin(angle) * ORBIT_RADIUS)
}

export function orbitAngle(hour: number, sunrise: number, sunset: number) {
  const day = sunset - sunrise
  const h = ((hour - sunrise) % 24 + 24) % 24
  return h < day ? Math.PI * h / day : Math.PI + Math.PI * (h - day) / (24 - day)
}

export function orbitHour(angle: number, sunrise: number, sunset: number) {
  const day = sunset - sunrise
  const a = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const h = a < Math.PI ? a / Math.PI * day : day + (a - Math.PI) / Math.PI * (24 - day)
  return (sunrise + h) % 24
}

export const COMPASS_RADIUS = 9.5

export const handleTexture = canvasTexture(128, 128, (ctx) => {
  ctx.translate(64, 64)
  ctx.beginPath()
  ctx.arc(0, 0, 54, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.roof
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.fillStyle = '#ffffff'
  for (const [from, to] of [[1.15, 1.8], [0.15, 0.8]]) {
    ctx.beginPath()
    ctx.arc(0, 0, 27, from * Math.PI, to * Math.PI)
    ctx.stroke()
    const a = to * Math.PI
    const p = [Math.cos(a) * 27, Math.sin(a) * 27]
    const t = [-Math.sin(a), Math.cos(a)]
    const n = [Math.cos(a), Math.sin(a)]
    ctx.beginPath()
    ctx.moveTo(p[0] + t[0] * 12, p[1] + t[1] * 12)
    ctx.lineTo(p[0] + n[0] * 10, p[1] + n[1] * 10)
    ctx.lineTo(p[0] - n[0] * 10, p[1] - n[1] * 10)
    ctx.closePath()
    ctx.fill()
  }
})

const SKY = [
  { altitude: -12, top: '#0e1830', bottom: '#22365f' },
  { altitude: -5, top: '#25336b', bottom: '#8a6a9c' },
  { altitude: 0, top: '#4a6fc4', bottom: '#ffad7a' },
  { altitude: 8, top: '#4f97e8', bottom: '#ffe1b8' },
  { altitude: 20, top: '#3d8de6', bottom: '#cfe8ff' },
].map(k => ({ ...k, top: new Color(k.top), bottom: new Color(k.bottom) }))

export function skyColors(altitude: number) {
  const degrees = altitude * 180 / Math.PI
  const i = Math.max(0, SKY.findLastIndex(k => k.altitude <= degrees))
  const a = SKY[i]
  const b = SKY[Math.min(SKY.length - 1, i + 1)]
  const t = b === a ? 0 : Math.min(1, (degrees - a.altitude) / (b.altitude - a.altitude))
  return {
    top: `#${a.top.clone().lerp(b.top, t).getHexString()}`,
    bottom: `#${a.bottom.clone().lerp(b.bottom, t).getHexString()}`,
  }
}
