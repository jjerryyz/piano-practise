<template>
  <div class="page practice-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">&lt;</button>
      <span class="title">{{ practice.currentGroup?.label ?? '练习' }}</span>
      <MidiIndicator :status="midiStatus" :device-name="midiDevice" />
    </header>

    <template v-if="!practice.isFinished">
      <ScoreBoard
        :question-index="practice.questionIndex"
        :total-questions="practice.totalQuestions"
        :accuracy="practice.accuracy"
        :streak="practice.streak"
        :is-timer-mode="practice.isTimerMode"
        :timer-remaining="practice.timerRemaining"
      />

      <div class="staff-area">
        <StaffNote
          v-if="practice.currentQuestion"
          :notes="practice.currentQuestion.targetNotes"
          :active-index="practice.currentNoteIndex"
          :key-signature="0"
        />
      </div>

      <div class="keyboard-area">
        <PianoKeyboard
          :initial-octave="initialOctave"
          @note-press="onAnswer"
        />
      </div>

      <FeedbackToast
        :visible="practice.lastAnswerCorrect !== null"
        :correct="practice.lastAnswerCorrect === true"
      />
    </template>

    <template v-else>
      <div class="result-card">
        <h2 class="result-title">练习完成</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">{{ practice.correctCount }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ practice.wrongCount }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ practice.accuracy }}%</span>
            <span class="stat-label">正确率</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ practice.bestStreak }}</span>
            <span class="stat-label">最佳连续</span>
          </div>
        </div>
        <div class="stat elapsed">
          用时 {{ formatElapsed(practice.elapsedMs) }}
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import { groupPrimaryOctave } from '../data/noteRanges'
import { useMidi } from '../composables/useMidi'
import StaffNote from '../components/StaffNote.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import ScoreBoard from '../components/ScoreBoard.vue'
import FeedbackToast from '../components/FeedbackToast.vue'
import MidiIndicator from '../components/MidiIndicator.vue'

const router = useRouter()
const practice = usePracticeStore()

const { status: midiStatus, deviceName: midiDevice } = useMidi({
  onNoteOn(midi) { onAnswer(midi) },
})

const initialOctave = computed(() => {
  if (!practice.currentGroup) return 4
  return groupPrimaryOctave(practice.currentGroup)
})

function onAnswer(midi: number) {
  practice.submitAnswer(midi)
}

function goBack() {
  practice.reset()
  router.push('/')
}

function retry() {
  if (practice.currentGroup) {
    practice.startPractice(practice.currentGroup)
  }
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}
</script>

<style scoped>
.practice-page {
  overflow: hidden;
}

.staff-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  min-height: 0;
}

.keyboard-area {
  flex-shrink: 0;
  padding: 8px 8px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 24px;
}

.result-title {
  font-size: 24px;
  font-weight: 700;
}

.result-stats {
  display: flex;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.elapsed {
  font-size: 14px;
  color: var(--text-secondary);
}

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
