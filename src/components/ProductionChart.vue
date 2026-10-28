<script setup lang="ts">
import { computed } from 'vue'
import { formatClock, formatEnergy, formatPower, useSolar } from '../composables/useSolar'

const W = 344
const H = 116
const BASE = 90
const TOP = 14
const SLOT = W / 24
const BAR = SLOT - 4
const TICKS = [0, 6, 12, 18]

const { state, day, dayTotals, soFar, now } = useSolar()

const hours = computed(() => Array.from({ length: 24 }, (_, h) => {
  const quarter = day.value.slice(h * 4, h * 4 + 4)
  return {
    production: quarter.reduce((sum, s) => sum + s.production, 0) / 4000,
    load: quarter.reduce((sum, s) => sum + s.load, 0) / 4000,
  }
}))

const scale = computed(() => Math.max(0.5, ...hours.value.map(h => Math.max(h.production, h.load))) * 1.1)
const current = computed(() => Math.min(23, Math.floor(state.hour)))
const x = (hour: number) => hour * SLOT + SLOT / 2
const y = (kwh: number) => BASE - kwh / scale.value * (BASE - TOP)
const loadLine = computed(() => hours.value.map((h, i) => `${x(i)},${y(h.load)}`).join(' '))
const exporting = computed(() => now.value.net >= 0)
const nf = (value: number) => value.toLocaleString('nl-BE', { maximumFractionDigits: 1 })
</script>

<template>
  <div class="stats">
    <div>
      <span>Opbrengst nu</span>
      <strong>{{ formatPower(now.production) }}</strong>
    </div>
    <div>
      <span>Verbruik nu</span>
      <strong>{{ formatPower(now.load) }}</strong>
    </div>
    <div>
      <span>{{ exporting ? 'Naar het net' : 'Van het net' }}</span>
      <strong :class="exporting ? 'export' : 'import'">{{ formatPower(Math.abs(now.net)) }}</strong>
    </div>
  </div>

  <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Opbrengst en verbruik per uur">
    <defs>
      <linearGradient id="bar-past" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe2a3" />
        <stop offset="1" stop-color="#fff1d4" />
      </linearGradient>
      <linearGradient id="bar-now" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffc24d" />
        <stop offset="1" stop-color="#f29c16" />
      </linearGradient>
      <linearGradient id="bar-later" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdf1d9" />
        <stop offset="1" stop-color="#fef9ef" />
      </linearGradient>
    </defs>
    <rect
      v-for="(h, i) in hours"
      :key="i"
      :x="x(i) - BAR / 2"
      :y="y(h.production)"
      :width="BAR"
      :height="Math.max(2, BASE - y(h.production))"
      rx="3"
      :fill="i === current ? 'url(#bar-now)' : i < current ? 'url(#bar-past)' : 'url(#bar-later)'"
    />
    <polyline :points="loadLine" class="load" />
    <circle :cx="x(current)" :cy="y(hours[current].load)" r="3.5" class="load-dot" />
    <text :x="x(current)" :y="y(hours[current].production) - 6" class="value">{{ nf(hours[current].production) }}</text>
    <template v-for="t in TICKS" :key="t">
      <text v-if="Math.abs(t - current) > 2" :x="Math.max(15, x(t))" :y="H - 8" class="tick">{{ formatClock(t) }}</text>
    </template>
    <g :transform="`translate(${Math.min(W - 24, Math.max(24, x(current)))}, ${H - 20})`">
      <rect x="-23" y="0" width="46" height="18" rx="5" class="pill-bg" />
      <text x="0" y="12.5" class="pill-text">{{ formatClock(current) }}</text>
    </g>
  </svg>

  <div class="legend">
    <span><i class="dot production"></i>Opbrengst</span>
    <span><i class="dot consumption"></i>Verbruik</span>
    <span class="meta">{{ formatEnergy(soFar.produced) }} van {{ formatEnergy(dayTotals.produced) }}</span>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0 4px;
}

.stats div {
  display: grid;
  gap: 1px;
}

.stats span {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.stats strong {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.export {
  color: var(--export);
}

.import {
  color: var(--import);
}

svg {
  display: block;
  width: 100%;
  height: auto;
}

.load {
  fill: none;
  stroke: var(--consumption);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.load-dot {
  fill: var(--consumption);
  stroke: #fff;
  stroke-width: 2;
}

.value {
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
  fill: var(--ink);
}

.tick {
  font-size: 10px;
  text-anchor: middle;
  fill: var(--muted);
}

.pill-bg {
  fill: var(--pill);
}

.pill-text {
  font-size: 10.5px;
  font-weight: 600;
  text-anchor: middle;
  fill: #fff;
}

.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.legend .meta {
  margin-left: auto;
}
</style>
