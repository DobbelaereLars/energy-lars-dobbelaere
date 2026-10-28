<script setup lang="ts">
import { computed } from 'vue'
import { compassName, MAX_PANELS, useSolar } from '../composables/useSolar'
import FlowChart from './FlowChart.vue'
import ProductionChart from './ProductionChart.vue'
import Icon from './ui/Icon.vue'
import Slider from './ui/Slider.vue'

const { state, now, peak, setPanels } = useSolar()

const kwp = computed(() => (peak.value / 1000).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
</script>

<template>
  <section class="card">
    <header class="card-head">
      <Icon name="bolt" />
      <h2>Hoeveel stroom wekken we op?</h2>
      <span class="meta">{{ Math.round(now.cloud) }}% bewolkt</span>
    </header>

    <div class="controls">
      <span class="name">Panelen</span>
      <div class="stepper">
        <button type="button" aria-label="Minder panelen" :disabled="state.panels <= 1" @click="setPanels(state.panels - 1)">
          <Icon name="minus" />
        </button>
        <strong>{{ state.panels }}</strong>
        <button type="button" aria-label="Meer panelen" :disabled="state.panels >= MAX_PANELS" @click="setPanels(state.panels + 1)">
          <Icon name="plus" />
        </button>
      </div>
      <span class="value">{{ kwp }} kWp · {{ compassName(state.azimuth) }}</span>

      <span class="name">Verbruik</span>
      <Slider v-model="state.yearlyUse" :min="1500" :max="8000" :step="100" aria-label="Jaarverbruik gezin" />
      <span class="value">{{ state.yearlyUse.toLocaleString('nl-BE') }} kWh/jaar</span>
    </div>

    <ProductionChart />
    <FlowChart />
  </section>
</template>

<style scoped>
.controls {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 12px;
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--accent-soft);
  font-size: 13px;
}

.name {
  color: var(--muted);
}

.value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stepper strong {
  min-width: 18px;
  font-size: 15px;
  text-align: center;
}

.stepper button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(29, 52, 97, 0.14);
}

.stepper .icon {
  width: 16px;
  height: 16px;
}
</style>
