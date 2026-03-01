<template>
  <div class="page metronome-page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">节拍器</span>
    </header>

    <div class="metro-body">
      <div class="bpm-display">
        <span class="bpm-num" :class="{ pulse: playing && beat }">{{ bpm }}</span>
        <span class="bpm-label">BPM ({{ tempoName }})</span>
        <span class="bpm-sub">Beats Per Minute - 每分钟节拍数</span>
      </div>

      <div class="slider-section">
        <input
          type="range"
          class="bpm-slider"
          :min="30"
          :max="260"
          :value="bpm"
          @input="onSlider"
        />
        <div class="slider-marks">
          <span>40</span><span>80</span><span>120</span><span>160</span><span>200</span><span>240</span>
        </div>
      </div>

      <button class="tap-tempo-btn" @click="tapTempo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        点击测速
      </button>

      <div class="time-sig-section">
        <button
          v-for="ts in TIME_SIGNATURES"
          :key="ts.label"
          :class="['ts-btn', { active: timeSigTop === ts.top && timeSigBot === ts.bot }]"
          @click="timeSigTop = ts.top; timeSigBot = ts.bot"
        >
          <span class="ts-num">{{ ts.top }}/{{ ts.bot }}</span>
          <span class="ts-name">{{ ts.label }}</span>
        </button>
      </div>

      <div class="beat-dots">
        <span
          v-for="i in timeSigTop"
          :key="i"
          :class="['dot', { active: playing && currentBeat === i }]"
        ></span>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl-btn" @click="adjustBpm(-1)">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
      <button :class="['play-btn', { active: playing }]" @click="togglePlay">
        <svg v-if="!playing" width="32" height="32" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21" /></svg>
        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg>
      </button>
      <button class="ctrl-btn" @click="adjustBpm(1)">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const bpm = ref(120)
const playing = ref(false)
const beat = ref(false)
const currentBeat = ref(0)
const timeSigTop = ref(4)
const timeSigBot = ref(4)

const TIME_SIGNATURES = [
  { top: 2, bot: 4, label: '二拍子' },
  { top: 3, bot: 4, label: '三拍子' },
  { top: 4, bot: 4, label: '四拍子' },
  { top: 6, bot: 8, label: '六拍子' },
]

const tempoName = ref('中速')
watch(bpm, (v) => {
  if (v < 60) tempoName.value = '极慢'
  else if (v < 80) tempoName.value = '慢速'
  else if (v < 100) tempoName.value = '稍慢'
  else if (v < 120) tempoName.value = '中速'
  else if (v < 140) tempoName.value = '稍快'
  else if (v < 168) tempoName.value = '快速'
  else if (v < 200) tempoName.value = '很快'
  else tempoName.value = '极快'
}, { immediate: true })

let audioCtx: AudioContext | null = null
let tickInterval: ReturnType<typeof setInterval> | null = null

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext()
}

function playClick(accent: boolean) {
  if (!audioCtx) return
  const freq = accent ? 900 : 700
  const vol = accent ? 0.4 : 0.25
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.frequency.value = freq
  osc.type = 'sine'
  gain.gain.setValueAtTime(vol, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.08)
}

function startMetronome() {
  stopMetronome()
  initAudio()
  currentBeat.value = 0
  tick()
  tickInterval = setInterval(tick, 60000 / bpm.value)
}

function tick() {
  currentBeat.value = (currentBeat.value % timeSigTop.value) + 1
  const isAccent = currentBeat.value === 1
  playClick(isAccent)

  beat.value = true
  setTimeout(() => { beat.value = false }, 80)
}

function stopMetronome() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
  currentBeat.value = 0
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    startMetronome()
  } else {
    stopMetronome()
  }
}

function restartIfPlaying() {
  if (playing.value) startMetronome()
}

watch(bpm, restartIfPlaying)
watch(timeSigTop, restartIfPlaying)

function adjustBpm(delta: number) {
  bpm.value = Math.max(30, Math.min(260, bpm.value + delta))
}

function onSlider(e: Event) {
  bpm.value = Number((e.target as HTMLInputElement).value)
}

// tap tempo
const tapTimes: number[] = []
function tapTempo() {
  const now = Date.now()
  tapTimes.push(now)
  if (tapTimes.length > 8) tapTimes.shift()
  if (tapTimes.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < tapTimes.length; i++) {
      const d = tapTimes[i] - tapTimes[i - 1]
      if (d > 2000) { tapTimes.length = 0; tapTimes.push(now); return }
      intervals.push(d)
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    bpm.value = Math.round(60000 / avg)
  }
}

onBeforeUnmount(() => {
  stopMetronome()
})
</script>

<style scoped>
.metronome-page {
  overflow-y: auto;
}

.metro-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 16px;
  gap: 20px;
}

.bpm-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bpm-num {
  font-size: 72px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: transform 0.08s;
}

.bpm-num.pulse {
  transform: scale(1.06);
}

.bpm-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.bpm-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.slider-section {
  width: 100%;
  max-width: 360px;
}

.bpm-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  outline: none;
}

.bpm-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  padding: 4px 2px 0;
  font-size: 11px;
  color: var(--text-secondary);
}

.tap-tempo-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: 1.5px solid var(--border);
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  background: var(--bg-card);
  transition: all 0.15s;
}

.tap-tempo-btn:active {
  background: var(--bg);
  border-color: var(--primary);
  color: var(--primary);
}

.time-sig-section {
  display: flex;
  gap: 10px;
}

.ts-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  min-width: 68px;
  transition: all 0.15s;
}

.ts-btn.active {
  border-color: var(--primary);
  background: #eef2ff;
}

.ts-num {
  font-size: 18px;
  font-weight: 700;
}

.ts-btn.active .ts-num {
  color: var(--primary);
}

.ts-name {
  font-size: 11px;
  color: var(--text-secondary);
}

.beat-dots {
  display: flex;
  gap: 10px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: transparent;
  transition: all 0.08s;
}

.dot.active {
  background: var(--primary);
  border-color: var(--primary);
  transform: scale(1.2);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px 16px 36px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  background: var(--bg-card);
  transition: background 0.1s;
}

.ctrl-btn:active {
  background: var(--bg);
}

.play-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transition: transform 0.1s;
}

.play-btn:active {
  transform: scale(0.94);
}

.play-btn.active {
  background: var(--primary-dark);
}
</style>
