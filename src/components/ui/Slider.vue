<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ min: number, max: number, step?: number }>()
const model = defineModel<number>({ required: true })

const fill = computed(() => `${(model.value - props.min) / (props.max - props.min) * 100}%`)
</script>

<template>
  <input v-model.number="model" class="slider" type="range" :min="min" :max="max" :step="step ?? 1" :style="{ '--fill': fill }" />
</template>
