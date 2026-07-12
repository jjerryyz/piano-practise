import { onBeforeUnmount } from 'vue'

interface ActiveVoice {
  oscillators: OscillatorNode[]
  gain: GainNode
  startedAt: number
  releaseTimer?: ReturnType<typeof setTimeout>
}

const PARTIALS: Array<{ ratio: number; gain: number; type: OscillatorType }> = [
  { ratio: 1, gain: 1, type: 'triangle' },
  { ratio: 2, gain: 0.42, type: 'sine' },
  { ratio: 3, gain: 0.18, type: 'sine' },
  { ratio: 4, gain: 0.08, type: 'sine' },
]

/** Minimum audible length for quick screen taps (seconds). */
const TAP_MIN_DURATION = 0.38
const RELEASE_TIME = 0.45

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function createImpulse(ctx: AudioContext, duration = 0.32): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.4
    }
  }
  return buffer
}

/**
 * Lightweight offline Web Audio piano synth for practice feedback.
 * Creates/resumes AudioContext on first user gesture or MIDI event.
 */
export function usePianoSound() {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let dry: GainNode | null = null
  let wet: GainNode | null = null
  let convolver: ConvolverNode | null = null
  const active = new Map<number, ActiveVoice>()

  async function ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null

    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()

      master = ctx.createGain()
      master.gain.value = 0.55
      master.connect(ctx.destination)

      dry = ctx.createGain()
      dry.gain.value = 0.9
      dry.connect(master)

      wet = ctx.createGain()
      wet.gain.value = 0.2
      wet.connect(master)

      convolver = ctx.createConvolver()
      convolver.buffer = createImpulse(ctx)
      convolver.connect(wet)
    }

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // Autoplay policies may still block; next gesture will retry.
      }
    }

    return ctx
  }

  function clearReleaseTimer(voice: ActiveVoice) {
    if (voice.releaseTimer !== undefined) {
      clearTimeout(voice.releaseTimer)
      voice.releaseTimer = undefined
    }
  }

  function releaseVoice(midi: number, immediate = false) {
    const voice = active.get(midi)
    if (!voice || !ctx) return

    clearReleaseTimer(voice)

    const now = ctx.currentTime
    const release = immediate ? 0.02 : RELEASE_TIME
    try {
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now)
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release)
    } catch {
      // ignore scheduling races during teardown
    }

    const stopAt = now + release + 0.03
    for (const osc of voice.oscillators) {
      try {
        osc.stop(stopAt)
      } catch {
        // already stopped
      }
    }

    window.setTimeout(() => {
      const current = active.get(midi)
      if (current === voice) active.delete(midi)
    }, (release + 0.06) * 1000)
  }

  async function noteOn(midi: number, velocity = 0.8) {
    const audio = await ensureContext()
    if (!audio || !dry || !convolver) return

    if (active.has(midi)) releaseVoice(midi, true)

    const freq = midiToFrequency(midi)
    const vel = Math.min(Math.max(velocity, 0.05), 1)
    const now = audio.currentTime

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.24 * vel, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.16 * vel, now + 0.09)
    gain.gain.exponentialRampToValueAtTime(0.08 * vel, now + 0.55)
    gain.gain.exponentialRampToValueAtTime(0.035 * vel, now + 1.8)
    gain.connect(dry)
    gain.connect(convolver)

    const oscillators: OscillatorNode[] = []
    for (const partial of PARTIALS) {
      const osc = audio.createOscillator()
      osc.type = partial.type
      osc.frequency.setValueAtTime(freq * partial.ratio, now)

      const partialGain = audio.createGain()
      partialGain.gain.value = partial.gain
      osc.connect(partialGain)
      partialGain.connect(gain)
      osc.start(now)
      oscillators.push(osc)
    }

    active.set(midi, { oscillators, gain, startedAt: now })
  }

  function noteOff(midi: number) {
    const voice = active.get(midi)
    if (!voice || !ctx) return

    clearReleaseTimer(voice)
    const elapsed = ctx.currentTime - voice.startedAt
    const remainMs = Math.max(0, (TAP_MIN_DURATION - elapsed) * 1000)
    if (remainMs > 0) {
      voice.releaseTimer = setTimeout(() => releaseVoice(midi, false), remainMs)
      return
    }
    releaseVoice(midi, false)
  }

  /** Confirmed screen tap: start sound and auto-release after a short natural sustain. */
  async function playTap(midi: number, velocity = 0.85) {
    await noteOn(midi, velocity)
    const voice = active.get(midi)
    if (!voice) return
    clearReleaseTimer(voice)
    voice.releaseTimer = setTimeout(() => releaseVoice(midi, false), TAP_MIN_DURATION * 1000)
  }

  function stopAll() {
    for (const midi of [...active.keys()]) {
      const voice = active.get(midi)
      if (voice) clearReleaseTimer(voice)
      releaseVoice(midi, true)
    }
    active.clear()
  }

  function dispose() {
    stopAll()
    if (ctx) {
      void ctx.close().catch(() => undefined)
    }
    ctx = null
    master = null
    dry = null
    wet = null
    convolver = null
  }

  onBeforeUnmount(dispose)

  return { noteOn, noteOff, playTap, stopAll, dispose, ensureContext }
}
