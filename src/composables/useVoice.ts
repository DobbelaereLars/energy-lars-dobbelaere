import { reactive } from 'vue'
import { compassName, formatClock, formatEnergy, formatEuro, formatPower, useSolar } from './useSolar'

interface Recognition {
  lang: string
  start: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionConstructor = new () => Recognition

const speechWindow = window as unknown as { SpeechRecognition?: RecognitionConstructor, webkitSpeechRecognition?: RecognitionConstructor }
const RecognitionImpl = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

const DIRECTIONS: [RegExp, number][] = [
  [/noordoost/, 45],
  [/zuidoost/, 135],
  [/zuidwest/, 225],
  [/noordwest/, 315],
  [/noord/, 0],
  [/oost/, 90],
  [/zuid/, 180],
  [/west/, 270],
]

const voice = reactive({
  supported: Boolean(RecognitionImpl),
  listening: false,
  heard: '',
  reply: '',
  understood: true,
})

const solar = useSolar()

function interpret(raw: string) {
  const text = raw.toLowerCase()
  const { state, now, soFar, dayTotals } = solar

  if (/bespa|euro|geld/.test(text)) {
    return `Vandaag bespaar je ongeveer ${formatEuro(dayTotals.value.savings)}.`
  }
  if (/verbruik/.test(text)) {
    const t = dayTotals.value
    const share = t.consumed > 0 ? Math.round(t.selfUse / t.consumed * 100) : 0
    return `Het huis verbruikt nu ${formatPower(now.value.load)}. Over de hele dag ${formatEnergy(t.consumed)}, waarvan ${share}% van de eigen panelen.`
  }
  if (/hoeveel|produc|opbrengst|opwek/.test(text)) {
    return `De panelen leveren nu ${formatPower(now.value.production)}. Tot nu ${formatEnergy(soFar.value.produced)}, over de hele dag ${formatEnergy(dayTotals.value.produced)}.`
  }

  const count = text.match(/(\d+)\s*(?:zonne)?panel/)
  if (count) {
    solar.setPanels(Number(count[1]))
    return `${state.panels} panelen op het dak.`
  }
  if (/panel/.test(text) && /meer|extra|bij/.test(text)) {
    solar.setPanels(state.panels + 2)
    return `${state.panels} panelen op het dak.`
  }
  if (/panel/.test(text) && /minder|weg|af\b/.test(text)) {
    solar.setPanels(state.panels - 2)
    return `${state.panels} panelen op het dak.`
  }

  const time = text.match(/(\d{1,2})[:.u](\d{2})/) ?? text.match(/(\d{1,2})\s*uur/)
  if (time && Number(time[1]) < 24) {
    solar.setHour(Number(time[1]) + (time[2] ? Number(time[2]) / 60 : 0))
    return `De tijd staat op ${formatClock(state.hour)}.`
  }

  const direction = DIRECTIONS.find(([pattern]) => pattern.test(text))
  if (direction) {
    solar.setAzimuth(direction[1])
    return `De panelen liggen nu op het ${compassName(state.azimuth).toLowerCase()}en.`
  }

  if (/pauze|stop/.test(text)) {
    state.playing = false
    return 'De tijd staat stil.'
  }
  if (/start|speel|verder/.test(text)) {
    state.playing = true
    return 'De dag speelt verder.'
  }
  return ''
}

function run(text: string) {
  const reply = interpret(text)
  voice.heard = text
  voice.understood = reply !== ''
  voice.reply = reply || 'Dat begreep ik niet. Probeer een van de commando\'s hieronder.'
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Geen toegang tot de microfoon.',
  'no-speech': 'Ik hoorde niets. Probeer opnieuw.',
  'network': 'Geen verbinding met de spraakdienst.',
}

function listen() {
  if (!RecognitionImpl || voice.listening) {
    return
  }
  const recognition = new RecognitionImpl()
  recognition.lang = 'nl-BE'
  recognition.onresult = e => run(e.results[0][0].transcript)
  recognition.onerror = (e) => {
    voice.reply = ERRORS[e.error] ?? `Spraakfout: ${e.error}`
    voice.understood = false
  }
  recognition.onend = () => {
    voice.listening = false
  }
  voice.listening = true
  recognition.start()
}

export function useVoice() {
  return { voice, listen, run }
}
