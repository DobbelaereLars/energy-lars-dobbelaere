<script setup lang="ts">
import { computed } from 'vue'
import { formatEnergy, formatEuro, useSolar } from '../composables/useSolar'
import Icon from './ui/Icon.vue'

const R = 46
const C = 60
const GAP = 1.6

const { dayTotals } = useSolar()

const segments = computed(() => {
  const t = dayTotals.value
  const parts = [
    { key: 'self', label: 'Zelf verbruikt', value: t.selfUse },
    { key: 'export', label: 'Naar het net', value: t.toGrid },
    { key: 'import', label: 'Van het net', value: t.fromGrid },
  ]
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1
  const shown = parts.filter(p => p.value > 0.01).length
  let start = 0
  return parts.map((p) => {
    const share = p.value / total * 100
    const length = Math.max(0, share - (shown > 1 ? GAP : 0))
    const mid = (start + share / 2) / 100 * Math.PI * 2 - Math.PI / 2
    const segment = {
      ...p,
      share,
      dash: `${length} ${100 - length}`,
      offset: -start,
      x: C + Math.cos(mid) * R,
      y: C + Math.sin(mid) * R,
      text: p.value.toLocaleString('nl-BE', { maximumFractionDigits: 1 }),
    }
    start += share
    return segment
  })
})
</script>

<template>
  <div class="flow">
    <h3>
      <Icon name="pie" />Waar gaat de stroom naartoe?
      <span class="meta">vandaag</span>
    </h3>

    <div class="body">
      <div class="summary">
        <span>Zelfvoorzienend</span>
        <div class="headline">
          <strong>{{ Math.round(dayTotals.autarky * 100) }}%</strong>
          <span class="savings">{{ formatEuro(dayTotals.savings) }} bespaard</span>
        </div>
        <ul>
          <li v-for="s in segments" :key="s.key">
            <i class="dot" :class="s.key"></i>{{ s.label }}
            <b>{{ formatEnergy(s.value) }}</b>
          </li>
        </ul>
      </div>

      <svg :viewBox="`0 0 ${C * 2} ${C * 2}`" role="img" aria-label="Verdeling van de stroom vandaag">
        <defs>
          <linearGradient id="seg-self" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#8db2f5" />
            <stop offset="1" stop-color="#2a62c9" />
          </linearGradient>
          <linearGradient id="seg-export" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffd98a" />
            <stop offset="1" stop-color="#f29c16" />
          </linearGradient>
          <linearGradient id="seg-import" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f6b3a9" />
            <stop offset="1" stop-color="#d9534f" />
          </linearGradient>
        </defs>
        <circle :cx="C" :cy="C" :r="R" class="track" />
        <circle
          v-for="s in segments"
          :key="s.key"
          :cx="C"
          :cy="C"
          :r="R"
          pathLength="100"
          :stroke="`url(#seg-${s.key})`"
          :stroke-dasharray="s.dash"
          :stroke-dashoffset="s.offset"
          :transform="`rotate(-90 ${C} ${C})`"
          class="segment"
        />
        <g v-for="s in segments.filter(s => s.share > 7)" :key="`l${s.key}`" :transform="`translate(${s.x}, ${s.y})`">
          <rect :x="-(s.text.length * 3.4 + 6)" y="-9" :width="s.text.length * 6.8 + 12" height="18" rx="5" class="pill-bg" />
          <text y="4" class="pill-text">{{ s.text }}</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.flow {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

h3 .icon {
  width: 18px;
  height: 18px;
  color: var(--accent);
}

h3 .meta {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}

.body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.summary {
  flex: 1;
  display: grid;
  min-width: 0;
}

.summary > span {
  font-size: 12px;
  color: var(--muted);
}

.headline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.headline strong {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.savings {
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--export) 12%, transparent);
  color: var(--export);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

ul {
  display: grid;
  gap: 3px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--muted);
}

li {
  display: flex;
  align-items: center;
}

li b {
  margin-left: auto;
  color: var(--ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dot.self {
  background: var(--accent);
}

.dot.export {
  background: var(--production);
}

.dot.import {
  background: var(--import);
}

svg {
  flex: none;
  width: 118px;
  height: 118px;
}

.track {
  fill: none;
  stroke: var(--accent-soft);
  stroke-width: 22;
}

.segment {
  fill: none;
  stroke-width: 22;
}

.pill-bg {
  fill: var(--pill);
}

.pill-text {
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
  fill: #fff;
}
</style>
