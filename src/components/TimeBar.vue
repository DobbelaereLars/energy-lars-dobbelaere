<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatClock, formatDate, LAST_DATE, useSolar } from '../composables/useSolar'
import { useVoice } from '../composables/useVoice'
import Icon from './ui/Icon.vue'
import Slider from './ui/Slider.vue'

const { state, sunTimes, setHour } = useSolar()
const { voice, listen } = useVoice()

const showVoice = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined
watch(() => [voice.listening, voice.heard, voice.reply], () => {
  showVoice.value = true
  clearTimeout(hideTimer)
  if (!voice.listening) {
    hideTimer = setTimeout(() => (showVoice.value = false), 7000)
  }
})

const hour = computed({ get: () => state.hour, set: setHour })
const daylight = computed(() => ({
  '--rise': `${sunTimes.value.sunrise / 24 * 100}%`,
  '--set': `${sunTimes.value.sunset / 24 * 100}%`,
}))

function setDate(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (value) {
    state.date = value
  }
}
</script>

<template>
  <section class="card timebar">
    <Transition name="toast">
      <div v-if="showVoice" class="toast" role="status">
        <p class="heard">
          <Icon name="mic" />{{ voice.listening ? 'Luistert…' : voice.heard ? `“${voice.heard}”` : '' }}
        </p>
        <p v-if="!voice.listening && voice.reply" class="reply" :class="{ error: !voice.understood }">
          {{ voice.reply }}
        </p>
      </div>
    </Transition>

    <div class="row">
      <button type="button" class="round" :aria-label="state.playing ? 'Pauzeer' : 'Speel de dag af'" @click="state.playing = !state.playing">
        <Icon :name="state.playing ? 'pause' : 'play'" />
      </button>
      <div class="clock">
        <strong>{{ formatClock(state.hour) }}</strong>
        <span class="muted">{{ formatDate(state.date) }}</span>
      </div>
      <input type="date" :value="state.date" :max="LAST_DATE" aria-label="Datum" @change="setDate" />
      <button
        type="button"
        class="round mic"
        :class="{ listening: voice.listening }"
        :disabled="!voice.supported"
        :aria-label="voice.listening ? 'Luistert' : 'Spreek een commando'"
        :title="voice.supported ? 'Spreek een commando, bv. &quot;zet de zon op 15 uur&quot;' : 'Spraak werkt niet in deze browser'"
        @click="listen"
      >
        <Icon name="mic" />
      </button>
    </div>

    <Slider v-model="hour" class="sun-slider" :min="0" :max="23.99" :step="0.01" :style="daylight" aria-label="Tijd van de dag" />
    <div class="times muted">
      <span>00:00</span>
      <span><Icon name="sun" /> {{ formatClock(sunTimes.sunrise) }} – {{ formatClock(sunTimes.sunset) }}</span>
      <span>24:00</span>
    </div>
  </section>
</template>

<style scoped>
.timebar {
  position: relative;
  display: grid;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clock {
  flex: 1;
  display: grid;
  min-width: 0;
}

.clock strong {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.clock span,
.times {
  font-size: 12px;
  white-space: nowrap;
}

.times {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -4px;
}

.times .icon {
  width: 13px;
  height: 13px;
  vertical-align: -2px;
}

.toast {
  position: absolute;
  right: calc(100% + 16px);
  bottom: 0;
  width: max-content;
  max-width: 340px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
  font-size: 13px;
}

.toast p {
  margin: 0;
}

.toast .heard {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
}

.toast .icon {
  width: 14px;
  height: 14px;
  color: var(--accent);
}

.toast .reply {
  margin-top: 3px;
  font-weight: 500;
}

.toast .reply.error {
  color: var(--import);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.mic {
  background: var(--pill);
  box-shadow: 0 4px 12px -4px rgba(17, 26, 46, 0.5);
}

.mic:hover:not(:disabled) {
  background: #24304a;
}

.mic.listening {
  background: var(--import);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--import) 25%, transparent);
  }
}

@media (max-width: 1100px) {
  .toast {
    right: 0;
    bottom: calc(100% + 10px);
  }
}
</style>
