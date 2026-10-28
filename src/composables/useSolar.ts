import * as SunCalc from 'suncalc'
import { computed, reactive, watch } from 'vue'

export const LOCATION = { name: 'Kortrijk', lat: 50.8248, lon: 3.2513 }
export const TILT = 35
export const PANEL = { width: 1.13, length: 1.72 }
export const PANEL_AREA = PANEL.width * PANEL.length
export const EFFICIENCY = 0.2
export const MAX_PANELS = 10
export const PRICE_BUY = 0.3
export const PRICE_SELL = 0.04

const DEG = Math.PI / 180
const DAY_SECONDS = 40
const STEP = 0.25
const HOURS = Array.from({ length: 24 / STEP + 1 }, (_, i) => i * STEP)
const LOAD_PROFILE = [0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 0.8, 1.3, 1.1, 0.8, 0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 1.1, 1.6, 2, 1.9, 1.6, 1.2, 0.9, 0.6]
const LOAD_SUM = LOAD_PROFILE.reduce((a, b) => a + b, 0)

const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', timeZoneName: 'shortOffset' })
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' })
const clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })

function toDate(iso: string, hour: number) {
  const utc = new Date(Date.parse(`${iso}T00:00:00Z`) + hour * 3600000)
  const offset = Number(offsetFormat.format(utc).match(/GMT([+-]\d+)/)?.[1] ?? 0)
  return new Date(utc.getTime() - offset * 3600000)
}

function toHour(date: Date) {
  const [h, m] = clockFormat.format(date).split(':').map(Number)
  return h + m / 60
}

function addDays(iso: string, days: number) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

export const TODAY = dateFormat.format(new Date())
export const LAST_DATE = addDays(TODAY, 15)

const state = reactive({
  date: TODAY,
  hour: toHour(new Date()),
  playing: true,
  azimuth: 180,
  panels: 6,
  yearlyUse: 3500,
  data: null as { dni: number[], dhi: number[], cloud: number[] } | null,
  source: '',
})

async function load(iso: string) {
  state.data = null
  if (daysBetween(TODAY, iso) > 15) {
    state.source = 'Geen voorspelling zo ver vooruit, heldere hemel aangenomen'
    return
  }
  state.source = 'Weerdata laden…'
  const host = daysBetween(TODAY, iso) < -60 ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast'
  const params = new URLSearchParams({
    latitude: String(LOCATION.lat),
    longitude: String(LOCATION.lon),
    hourly: 'direct_normal_irradiance,diffuse_radiation,cloud_cover',
    timezone: 'Europe/Brussels',
    start_date: iso,
    end_date: iso,
  })
  try {
    const res = await fetch(`${host}?${params}`)
    const { hourly } = await res.json()
    if (iso !== state.date) {
      return
    }
    const column = (values: (number | null)[]) => values.map(v => v ?? 0)
    state.data = {
      dni: column(hourly.direct_normal_irradiance),
      dhi: column(hourly.diffuse_radiation),
      cloud: column(hourly.cloud_cover),
    }
    state.source = 'Instraling en bewolking: Open-Meteo'
  }
  catch {
    if (iso === state.date) {
      state.source = 'Geen weerdata, heldere hemel aangenomen'
    }
  }
}

watch(() => state.date, load, { immediate: true })

export function sunAt(hour: number) {
  const p = SunCalc.getPosition(toDate(state.date, hour), LOCATION.lat, LOCATION.lon)
  return { altitude: p.altitude * DEG, azimuth: p.azimuth * DEG }
}

function interpolate(values: number[], hour: number) {
  const h = Math.min(23, Math.max(0, hour))
  const i = Math.floor(h)
  const j = Math.min(23, i + 1)
  return values[i] + (values[j] - values[i]) * (h - i)
}

function irradianceAt(hour: number, altitude: number) {
  if (altitude <= 0) {
    return { dni: 0, dhi: 0 }
  }
  if (state.data) {
    return { dni: interpolate(state.data.dni, hour + 0.5), dhi: interpolate(state.data.dhi, hour + 0.5) }
  }
  const dni = 1353 * 0.7 ** ((1 / Math.sin(altitude)) ** 0.678)
  return { dni, dhi: 0.1 * dni }
}

function panelIrradiance(hour: number, sun = sunAt(hour)) {
  const { dni, dhi } = irradianceAt(hour, sun.altitude)
  const tilt = TILT * DEG
  const cosTheta = Math.sin(sun.altitude) * Math.cos(tilt) + Math.cos(sun.altitude) * Math.sin(tilt) * Math.cos(sun.azimuth - state.azimuth * DEG)
  const direct = dni * Math.max(0, cosTheta)
  return { direct, poa: direct + dhi * (1 + Math.cos(tilt)) / 2 }
}

function powerAt(hour: number, sun = sunAt(hour)) {
  return state.panels * PANEL_AREA * EFFICIENCY * panelIrradiance(hour, sun).poa
}

function loadAt(hour: number) {
  const i = Math.floor(hour) % 24
  const f = hour - Math.floor(hour)
  const weight = LOAD_PROFILE[i] * (1 - f) + LOAD_PROFILE[(i + 1) % 24] * f
  return state.yearlyUse / 365 * 1000 * weight / LOAD_SUM
}

const day = computed(() => HOURS.map(hour => ({ hour, production: powerAt(hour), load: loadAt(hour) })))

function energy(values: number[], until: number) {
  let wh = 0
  for (let i = 0; i < values.length - 1 && HOURS[i] < until; i++) {
    wh += values[i] * Math.min(STEP, until - HOURS[i])
  }
  return wh / 1000
}

function totals(until: number) {
  const d = day.value
  const produced = energy(d.map(s => s.production), until)
  const consumed = energy(d.map(s => s.load), until)
  const selfUse = energy(d.map(s => Math.min(s.production, s.load)), until)
  const toGrid = produced - selfUse
  return {
    produced,
    consumed,
    selfUse,
    toGrid,
    fromGrid: consumed - selfUse,
    autarky: consumed > 0 ? selfUse / consumed : 0,
    savings: selfUse * PRICE_BUY + toGrid * PRICE_SELL,
  }
}

const dayTotals = computed(() => totals(24))
const soFar = computed(() => totals(state.hour))
const peak = computed(() => state.panels * PANEL_AREA * EFFICIENCY * 1000)

const sunTimes = computed(() => {
  const t = SunCalc.getTimes(toDate(state.date, 12), LOCATION.lat, LOCATION.lon)
  return { sunrise: t.sunrise ? toHour(t.sunrise) : 0, sunset: t.sunset ? toHour(t.sunset) : 24 }
})

const now = computed(() => {
  const sun = sunAt(state.hour)
  const { direct, poa } = panelIrradiance(state.hour, sun)
  const production = state.panels * PANEL_AREA * EFFICIENCY * poa
  const load = loadAt(state.hour)
  const cloud = state.data ? interpolate(state.data.cloud, state.hour) : 0
  return { sun, direct, poa, cloud, production, load, net: production - load }
})

function advance(dt: number) {
  if (state.playing) {
    state.hour = (state.hour + dt * 24 / DAY_SECONDS) % 24
  }
}

function setHour(hour: number) {
  state.playing = false
  state.hour = Math.min(23.99, Math.max(0, hour))
}

function setPanels(count: number) {
  state.panels = Math.min(MAX_PANELS, Math.max(1, Math.round(count)))
}

function setAzimuth(deg: number) {
  state.azimuth = ((Math.round(deg) % 360) + 360) % 360
}

const nf = (value: number, digits = 0) => value.toLocaleString('nl-BE', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export function formatPower(watt: number) {
  return Math.abs(watt) >= 1000 ? `${nf(watt / 1000, 2)} kW` : `${nf(watt)} W`
}

export function formatEnergy(kwh: number) {
  return `${nf(kwh, 1)} kWh`
}

export function formatEuro(euro: number) {
  return `€ ${nf(euro, 2)}`
}

export function formatClock(hour: number) {
  const minutes = Math.floor(hour * 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })
}

const COMPASS = ['Noord', 'Noordoost', 'Oost', 'Zuidoost', 'Zuid', 'Zuidwest', 'West', 'Noordwest']

export function compassName(deg: number) {
  return COMPASS[Math.round(deg / 45) % 8]
}

export function useSolar() {
  return { state, day, dayTotals, soFar, now, peak, sunTimes, advance, setHour, setPanels, setAzimuth }
}
