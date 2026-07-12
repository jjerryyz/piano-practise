<template>
  <div class="page practice-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">&lt;</button>
      <span class="title">{{ headerTitle }}</span>
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

      <p v-if="practice.isMelodyPractice && practice.sectionLabel" class="section-hint">
        {{ practice.sectionLabel }}
      </p>

      <div class="staff-area">
        <StaffNote
          v-if="practice.currentQuestion"
          :notes="practice.currentQuestion.targetNotes"
          :active-index="practice.currentNoteIndex"
          :key-signature="practice.currentQuestion.melody?.keySignature ?? 0"
          :layout-notes="practice.currentQuestion.melody?.layoutNotes"
          :time-signature="practice.currentQuestion.melody?.timeSignature"
        />
      </div>

      <div class="keyboard-area">
        <PianoKeyboard
          :initial-octave="initialOctave"
          :active-midi="midiPressed"
          @note-press="onScreenTap"
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import { useMidi } from '../composables/useMidi'
import { usePianoSound } from '../composables/usePianoSound'
import StaffNote from '../components/StaffNote.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import ScoreBoard from '../components/ScoreBoard.vue'
import FeedbackToast from '../components/FeedbackToast.vue'
import MidiIndicator from '../components/MidiIndicator.vue'

const router = useRouter()
const practice = usePracticeStore()
const midiPressed = ref<number | null>(null)
const { noteOn, noteOff, playTap } = usePianoSound()

onMounted(() => {
  if (!practice.currentQuestion && !practice.isFinished) {
    router.replace(practice.isMelodyPractice ? '/melody' : '/')
  }
})

const { status: midiStatus, deviceName: midiDevice } = useMidi({
  onNoteOn(midi, velocity) {
    midiPressed.value = midi
    void noteOn(midi, velocity / 127)
    onAnswer(midi)
  },
  onNoteOff(midi) {
    noteOff(midi)
    if (midiPressed.value === midi) midiPressed.value = null
  },
})

const headerTitle = computed(() => {
  if (practice.isWrongBookReview) return '错题复习'
  if (practice.isMelodyPractice) return '旋律章节'
  return practice.currentGroup?.label ?? '练习'
})

// c¹ (MIDI octave 4) is the keyboard's stable starting position.
const initialOctave = 4

function onScreenTap(midi: number) {
  void playTap(midi, 0.85)
  onAnswer(midi)
}

function onAnswer(midi: number) {
  practice.submitAnswer(midi)
}

function goBack() {
  const target = practice.isWrongBookReview
    ? '/wrong-book'
    : practice.isMelodyPractice
      ? '/melody'
      : '/'
  practice.reset()
  router.push(target)
}

function retry() {
  if (practice.isWrongBookReview) {
    practice.startWrongBookReview()
  } else if (practice.isMelodyPractice) {
    practice.startMelodyPractice(practice.barsPerSection)
  } else if (practice.currentGroup) {
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

.section-hint {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 0 16px 4px;
  flex-shrink: 0;
}

.staff-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  min-height: 0;
  overflow: hidden;
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
