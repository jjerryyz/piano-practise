import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RhythmPattern, RhythmBeat } from '../data/rhythmPatterns'

export type RhythmState = 'idle' | 'countdown' | 'playing' | 'finished'

export interface TapResult {
  expectedTime: number
  actualTime: number
  diffMs: number
  rating: 'perfect' | 'good' | 'ok' | 'miss'
  isRest: boolean
}

const THRESHOLDS = { perfect: 100, good: 200, ok: 320 }

function rateTap(diffMs: number): TapResult['rating'] {
  const abs = Math.abs(diffMs)
  if (abs <= THRESHOLDS.perfect) return 'perfect'
  if (abs <= THRESHOLDS.good) return 'good'
  if (abs <= THRESHOLDS.ok) return 'ok'
  return 'miss'
}

export const useRhythmStore = defineStore('rhythm', () => {
  const currentPattern = ref<RhythmPattern | null>(null)
  const bpm = ref(80)
  const state = ref<RhythmState>('idle')
  const countdownValue = ref(0)

  const flatBeats = ref<RhythmBeat[]>([])
  const expectedTimes = ref<number[]>([])
  const tapResults = ref<TapResult[]>([])
  const currentBeatIndex = ref(0)
  const playStartTime = ref(0)
  /** Continuously updated elapsed time (ms) since playback start */
  const elapsed = ref(0)
  /** Total duration of the pattern in ms */
  const totalDuration = ref(0)

  let metronomeInterval: ReturnType<typeof setInterval> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let animFrame: number | null = null
  let audioCtx: AudioContext | null = null

  const totalNonRestBeats = computed(() => flatBeats.value.filter(b => !b.isRest).length)

  const score = computed(() => {
    if (tapResults.value.length === 0) return 0
    const taps = tapResults.value.filter(t => !t.isRest)
    if (taps.length === 0) return 0
    const pts = taps.reduce((s, t) => {
      if (t.rating === 'perfect') return s + 100
      if (t.rating === 'good') return s + 75
      if (t.rating === 'ok') return s + 40
      return s
    }, 0)
    return Math.round(pts / taps.length)
  })

  const ratingCounts = computed(() => {
    const counts = { perfect: 0, good: 0, ok: 0, miss: 0 }
    for (const t of tapResults.value) {
      if (!t.isRest) counts[t.rating]++
    }
    return counts
  })

  function preparePattern(pattern: RhythmPattern) {
    stop()
    currentPattern.value = pattern
    bpm.value = pattern.bpm
    state.value = 'idle'
    tapResults.value = []
    currentBeatIndex.value = 0
    elapsed.value = 0

    flatBeats.value = pattern.bars.flat()
  }

  function setBpm(val: number) {
    bpm.value = Math.max(30, Math.min(260, val))
  }

  function startPractice() {
    if (!currentPattern.value) return
    state.value = 'countdown'
    tapResults.value = []
    currentBeatIndex.value = 0
    elapsed.value = 0

    const beats = flatBeats.value
    const msPerBeat = 60000 / bpm.value
    const times: number[] = []
    let t = 0
    for (const beat of beats) {
      times.push(t)
      t += beat.beats * msPerBeat
    }
    expectedTimes.value = times
    totalDuration.value = t

    countdownValue.value = 4
    initAudio()

    countdownInterval = setInterval(() => {
      countdownValue.value--
      playClick(800, 0.08)
      if (countdownValue.value <= 0) {
        if (countdownInterval) clearInterval(countdownInterval)
        countdownInterval = null
        beginPlayback()
      }
    }, msPerBeat)
    playClick(800, 0.08)
  }

  function beginPlayback() {
    state.value = 'playing'
    playStartTime.value = performance.now()

    const msPerBeat = 60000 / bpm.value
    let beatCount = 0
    const totalBeatDuration = flatBeats.value.reduce((s, b) => s + b.beats, 0)
    const totalClicks = Math.ceil(totalBeatDuration)

    metronomeInterval = setInterval(() => {
      beatCount++
      if (beatCount >= totalClicks) {
        stopMetronome()
        setTimeout(() => finish(), msPerBeat)
        return
      }
      playClick(beatCount % (currentPattern.value?.timeSignature[0] ?? 4) === 0 ? 900 : 700, 0.06)
    }, msPerBeat)
    playClick(900, 0.08)

    startAnimLoop()
  }

  function startAnimLoop() {
    const loop = () => {
      if (state.value !== 'playing') return
      elapsed.value = performance.now() - playStartTime.value
      animFrame = requestAnimationFrame(loop)
    }
    animFrame = requestAnimationFrame(loop)
  }

  function stopAnimLoop() {
    if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null }
  }

  function tap() {
    if (state.value !== 'playing') return
    const now = performance.now() - playStartTime.value
    advancePastRests(now)

    if (currentBeatIndex.value >= flatBeats.value.length) return

    // Find the non-rest beat whose expected time is closest to `now`
    let bestIdx = -1
    let bestDist = Infinity
    for (let i = currentBeatIndex.value; i < flatBeats.value.length; i++) {
      const beat = flatBeats.value[i]
      const expectedAt = expectedTimes.value[i]
      if (!beat || expectedAt === undefined) continue
      if (beat.isRest) continue
      const dist = Math.abs(now - expectedAt)
      if (dist < bestDist) {
        bestIdx = i
        bestDist = dist
      } else {
        break // distances only grow from here
      }
    }

    if (bestIdx === -1) return

    // Mark every beat before bestIdx as skipped
    while (currentBeatIndex.value < bestIdx) {
      const b = flatBeats.value[currentBeatIndex.value]
      const expectedAt = expectedTimes.value[currentBeatIndex.value]
      if (!b || expectedAt === undefined) break
      tapResults.value.push({
        expectedTime: expectedAt,
        actualTime: now,
        diffMs: now - expectedAt,
        rating: b.isRest ? 'perfect' : 'miss',
        isRest: b.isRest,
      })
      currentBeatIndex.value++
    }

    // Match this tap to the closest beat
    const expected = expectedTimes.value[currentBeatIndex.value]
    if (expected === undefined) return
    const diff = now - expected
    tapResults.value.push({
      expectedTime: expected,
      actualTime: now,
      diffMs: diff,
      rating: rateTap(diff),
      isRest: false,
    })
    currentBeatIndex.value++

    advancePastRests(now)

    if (currentBeatIndex.value >= flatBeats.value.length) {
      setTimeout(() => finish(), 300)
    }
  }

  function advancePastRests(now: number) {
    while (currentBeatIndex.value < flatBeats.value.length) {
      const beat = flatBeats.value[currentBeatIndex.value]
      if (!beat?.isRest) break
      const expected = expectedTimes.value[currentBeatIndex.value]
      if (expected === undefined) break
      tapResults.value.push({
        expectedTime: expected,
        actualTime: now,
        diffMs: 0,
        rating: 'perfect',
        isRest: true,
      })
      currentBeatIndex.value++
    }
  }

  function finish() {
    state.value = 'finished'
    stopMetronome()
    stopAnimLoop()
  }

  function stop() {
    state.value = 'idle'
    stopMetronome()
    stopAnimLoop()
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
  }

  function stopMetronome() {
    if (metronomeInterval) { clearInterval(metronomeInterval); metronomeInterval = null }
  }

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext()
  }

  function playClick(freq: number, dur: number) {
    if (!audioCtx) return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur)
    osc.start()
    osc.stop(audioCtx.currentTime + dur)
  }

  function reset() {
    stop()
    currentPattern.value = null
    tapResults.value = []
    currentBeatIndex.value = 0
    elapsed.value = 0
  }

  return {
    currentPattern,
    bpm,
    state,
    countdownValue,
    flatBeats,
    expectedTimes,
    currentBeatIndex,
    tapResults,
    totalNonRestBeats,
    totalDuration,
    elapsed,
    score,
    ratingCounts,
    preparePattern,
    setBpm,
    startPractice,
    tap,
    stop,
    reset,
  }
})
