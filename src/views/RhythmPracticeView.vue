<template>
  <div class="page rhythm-practice-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">&lt;</button>
      <span class="title">{{ rhythm.currentPattern?.label ?? '节奏练习' }}</span>
    </header>

    <!-- Ready screen: preview + BPM adjust -->
    <template v-if="rhythm.state === 'idle'">
      <div class="staff-area">
        <RhythmStaff
          v-if="rhythm.flatBeats.length"
          :beats="rhythm.flatBeats"
          :time-signature="rhythm.currentPattern?.timeSignature ?? [4, 4]"
          :active-index="-1"
        />
      </div>

      <div class="bpm-control">
        <span class="bpm-label">速度</span>
        <div class="bpm-row">
          <button class="bpm-adj" @click="rhythm.setBpm(rhythm.bpm - 5)">-5</button>
          <button class="bpm-adj small" @click="rhythm.setBpm(rhythm.bpm - 1)">-</button>
          <span class="bpm-value">{{ rhythm.bpm }}</span>
          <button class="bpm-adj small" @click="rhythm.setBpm(rhythm.bpm + 1)">+</button>
          <button class="bpm-adj" @click="rhythm.setBpm(rhythm.bpm + 5)">+5</button>
        </div>
        <input
          type="range"
          class="bpm-slider"
          :value="rhythm.bpm"
          min="30"
          max="260"
          @input="rhythm.setBpm(Number(($event.target as HTMLInputElement).value))"
        />
        <button class="bpm-reset" @click="resetBpm">恢复默认 ({{ defaultBpm }})</button>
      </div>

      <div class="start-area">
        <button class="start-btn" @click="rhythm.startPractice()">开始练习</button>
      </div>
    </template>

    <!-- Playing / countdown -->
    <template v-else-if="rhythm.state !== 'finished'">
      <div class="info-bar">
        <span class="bpm-badge">BPM {{ rhythm.bpm }}</span>
        <span class="beat-progress">{{ tappedCount }} / {{ rhythm.totalNonRestBeats }}</span>
      </div>

      <div class="staff-area">
        <RhythmStaff
          v-if="rhythm.flatBeats.length"
          :beats="rhythm.flatBeats"
          :time-signature="rhythm.currentPattern?.timeSignature ?? [4, 4]"
          :active-index="rhythm.currentBeatIndex"
        />
      </div>

      <div class="timeline" v-if="rhythm.state === 'playing' && rhythm.totalDuration > 0">
        <div class="timeline-track">
          <div
            class="timeline-playhead"
            :style="{ left: playheadPercent + '%' }"
          ></div>
          <div
            v-for="(marker, i) in beatMarkers"
            :key="i"
            :class="['timeline-marker', { rest: marker.isRest, done: i < rhythm.currentBeatIndex }]"
            :style="{ left: marker.percent + '%' }"
          >
            <span v-if="!marker.isRest" class="marker-dot"></span>
            <span v-else class="marker-rest">-</span>
          </div>
        </div>
      </div>

      <div class="countdown-overlay" v-if="rhythm.state === 'countdown'">
        <span class="countdown-num">{{ rhythm.countdownValue }}</span>
      </div>

      <div class="tap-area">
        <div class="last-tap-row">
          <span v-if="lastRating" :class="['tap-rating', lastRating]">{{ ratingLabel(lastRating) }}</span>
          <span v-if="lastDiffText" class="tap-diff">{{ lastDiffText }}</span>
        </div>

        <div class="tap-btn-wrap">
          <div
            v-if="rhythm.state === 'playing'"
            class="pulse-ring"
            :class="{ firing: pulseActive }"
          ></div>
          <button
            class="tap-btn"
            :class="{ active: tapActive }"
            @pointerdown.prevent="onTap"
          >
            TAP
          </button>
        </div>

        <p class="tap-hint">看到脉冲环收缩时打拍</p>
      </div>
    </template>

    <!-- Results -->
    <template v-else>
      <div class="result-card">
        <h2 class="result-title">练习完成</h2>
        <div class="score-circle">
          <span class="score-num">{{ rhythm.score }}</span>
          <span class="score-unit">分</span>
        </div>
        <div class="result-stats">
          <div class="stat perfect">
            <span class="stat-value">{{ rhythm.ratingCounts.perfect }}</span>
            <span class="stat-label">完美</span>
          </div>
          <div class="stat good">
            <span class="stat-value">{{ rhythm.ratingCounts.good }}</span>
            <span class="stat-label">不错</span>
          </div>
          <div class="stat ok">
            <span class="stat-value">{{ rhythm.ratingCounts.ok }}</span>
            <span class="stat-label">尚可</span>
          </div>
          <div class="stat miss">
            <span class="stat-value">{{ rhythm.ratingCounts.miss }}</span>
            <span class="stat-label">错过</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-primary" @click="retry">再来一次</button>
          <button class="btn-outline" @click="goBack">返回</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useRhythmStore } from '../stores/rhythm'
import RhythmStaff from '../components/RhythmStaff.vue'

const router = useRouter()
const rhythm = useRhythmStore()

const tapActive = ref(false)
const lastRating = ref<string | null>(null)
const lastDiffText = ref<string | null>(null)
const pulseActive = ref(false)

let pulseInterval: ReturnType<typeof setInterval> | null = null

const defaultBpm = computed(() => rhythm.currentPattern?.bpm ?? 80)

const tappedCount = computed(() => rhythm.tapResults.filter(t => !t.isRest).length)

const playheadPercent = computed(() => {
  if (rhythm.totalDuration <= 0) return 0
  return Math.min((rhythm.elapsed / rhythm.totalDuration) * 100, 100)
})

const beatMarkers = computed(() => {
  if (rhythm.totalDuration <= 0) return []
  return rhythm.flatBeats.map((b, i) => ({
    percent: (rhythm.expectedTimes[i] / rhythm.totalDuration) * 100,
    isRest: b.isRest,
  }))
})

const latestResult = computed(() => {
  const results = rhythm.tapResults.filter(t => !t.isRest)
  return results.length > 0 ? results[results.length - 1] : null
})

watch(latestResult, (r) => {
  if (r) {
    lastRating.value = r.rating
    const ms = Math.round(r.diffMs)
    if (ms > 0) lastDiffText.value = `晚 ${ms}ms`
    else if (ms < 0) lastDiffText.value = `早 ${Math.abs(ms)}ms`
    else lastDiffText.value = '0ms'
    setTimeout(() => { lastRating.value = null; lastDiffText.value = null }, 800)
  }
})

watch(() => rhythm.state, (s) => {
  if (s === 'playing') {
    startPulse()
  } else {
    stopPulse()
  }
})

function resetBpm() {
  if (rhythm.currentPattern) rhythm.setBpm(rhythm.currentPattern.bpm)
}

function startPulse() {
  stopPulse()
  firePulse()
  pulseInterval = setInterval(firePulse, 60000 / rhythm.bpm)
}

function firePulse() {
  pulseActive.value = true
  setTimeout(() => { pulseActive.value = false }, 150)
}

function stopPulse() {
  if (pulseInterval) { clearInterval(pulseInterval); pulseInterval = null }
  pulseActive.value = false
}

function onTap() {
  tapActive.value = true
  rhythm.tap()
  setTimeout(() => { tapActive.value = false }, 100)
}

function ratingLabel(rating: string): string {
  const map: Record<string, string> = {
    perfect: '完美!', good: '不错', ok: '尚可', miss: '错过',
  }
  return map[rating] ?? rating
}

function goBack() {
  stopPulse()
  rhythm.reset()
  router.push('/rhythm')
}

function retry() {
  rhythm.startPractice()
}

onBeforeUnmount(() => { stopPulse() })
</script>

<style scoped>
.rhythm-practice-page {
  overflow: hidden;
}

/* ---- BPM control (ready screen) ---- */
.bpm-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
}

.bpm-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.bpm-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bpm-value {
  font-size: 40px;
  font-weight: 800;
  color: #f59e0b;
  min-width: 80px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.bpm-adj {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bpm-adj.small {
  width: 32px;
  height: 32px;
  font-size: 18px;
}

.bpm-adj:active {
  background: var(--border);
}

.bpm-slider {
  width: 100%;
  max-width: 280px;
  accent-color: #f59e0b;
}

.bpm-reset {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: underline;
  background: none;
  border: none;
  padding: 4px;
}

.start-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.start-btn {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  box-shadow: 0 4px 24px rgba(245, 158, 11, 0.4);
  transition: transform 0.1s;
  user-select: none;
}

.start-btn:active {
  transform: scale(0.95);
}

/* ---- info bar ---- */
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.bpm-badge {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.beat-progress {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.staff-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  min-height: 140px;
}

/* ---- timeline ---- */
.timeline {
  flex-shrink: 0;
  padding: 0 16px 8px;
}

.timeline-track {
  position: relative;
  height: 24px;
  background: var(--border);
  border-radius: 12px;
  overflow: visible;
}

.timeline-playhead {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 28px;
  background: #f59e0b;
  border-radius: 2px;
  transform: translateX(-2px);
  z-index: 3;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  transition: left 60ms linear;
}

.timeline-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.marker-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
}

.timeline-marker.done .marker-dot {
  background: #94a3b8;
}

.marker-rest {
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  line-height: 1;
}

/* ---- countdown ---- */
.countdown-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;
}

.countdown-num {
  font-size: 80px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* ---- tap area ---- */
.tap-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 28px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.last-tap-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
}

.tap-rating {
  font-size: 16px;
  font-weight: 700;
  animation: popIn 0.2s ease-out;
}
.tap-rating.perfect { color: #22c55e; }
.tap-rating.good { color: #6366f1; }
.tap-rating.ok { color: #f59e0b; }
.tap-rating.miss { color: #ef4444; }

.tap-diff {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ---- tap button with pulse ring ---- */
.tap-btn-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  pointer-events: none;
}

.pulse-ring.firing {
  animation: ringPulse 0.4s ease-out;
}

@keyframes ringPulse {
  0% {
    transform: scale(1.5);
    border-color: rgba(245, 158, 11, 0.7);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    border-color: rgba(245, 158, 11, 0);
    opacity: 0;
  }
}

.tap-btn {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
  transition: transform 0.08s;
  user-select: none;
  touch-action: manipulation;
  z-index: 1;
}

.tap-btn.active {
  transform: scale(0.92);
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
}

.tap-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ---- result ---- */
.result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 20px;
}

.result-title {
  font-size: 24px;
  font-weight: 700;
}

.score-circle {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-num {
  font-size: 56px;
  font-weight: 800;
  color: #f59e0b;
}

.score-unit {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.result-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
}

.stat.perfect .stat-value { color: #22c55e; }
.stat.perfect .stat-label { color: #22c55e; }
.stat.good .stat-value { color: #6366f1; }
.stat.good .stat-label { color: #6366f1; }
.stat.ok .stat-value { color: #f59e0b; }
.stat.ok .stat-label { color: #f59e0b; }
.stat.miss .stat-value { color: #ef4444; }
.stat.miss .stat-label { color: #ef4444; }

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-outline {
  padding: 10px 24px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 15px;
  color: var(--text-secondary);
}
</style>
