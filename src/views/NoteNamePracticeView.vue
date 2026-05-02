<template>
  <div class="page note-name-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">&lt;</button>
      <span class="title">音名识别</span>
    </header>

    <template v-if="!isFinished">
      <ScoreBoard
        :question-index="questionIndex"
        :total-questions="totalQuestions"
        :accuracy="accuracy"
        :streak="streak"
        :is-timer-mode="isTimerMode"
        :timer-remaining="timerRemaining"
      />

      <div class="prompt">看五线谱，选择对应的音名</div>

      <div class="staff-area">
        <StaffNote
          v-if="currentNote"
          :notes="[currentNote]"
          :active-index="0"
          :key-signature="0"
        />
      </div>

      <div class="answer-area">
        <button
          v-for="letter in letterOptions"
          :key="letter"
          class="letter-btn"
          :disabled="lastAnswerCorrect !== null"
          @click="submitAnswer(letter)"
        >
          {{ letter }}
        </button>
      </div>

      <FeedbackToast
        :visible="lastAnswerCorrect !== null"
        :correct="lastAnswerCorrect === true"
      />
    </template>

    <template v-else>
      <div class="result-card">
        <h2 class="result-title">练习完成</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">{{ correctCount }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ wrongCount }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ accuracy }}%</span>
            <span class="stat-label">正确率</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ bestStreak }}</span>
            <span class="stat-label">最佳连续</span>
          </div>
        </div>
        <div class="stat elapsed">用时 {{ formatElapsed(elapsedMs) }}</div>
        <div class="result-actions">
          <button class="btn-primary" @click="startPractice">再来一次</button>
          <button class="btn-outline" @click="goBack">返回</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StaffNote from '../components/StaffNote.vue'
import ScoreBoard from '../components/ScoreBoard.vue'
import FeedbackToast from '../components/FeedbackToast.vue'
import { notesInOctave, type Note, type NoteLetter } from '../lib/musicTheory'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const settings = useSettingsStore()

const letterOptions: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const notePool = [
  ...notesInOctave(3),
  ...notesInOctave(4),
  ...notesInOctave(5),
]

const currentNote = ref<Note | null>(null)
const questionIndex = ref(0)
const totalQuestions = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const streak = ref(0)
const bestStreak = ref(0)
const lastAnswerCorrect = ref<boolean | null>(null)
const isFinished = ref(false)
const isTimerMode = ref(false)
const timerRemaining = ref(0)
const elapsedMs = ref(0)

let timerInterval: ReturnType<typeof setInterval> | null = null
let startTimestamp = 0
let lastMidi: number | null = null

const accuracy = computed(() => {
  const total = correctCount.value + wrongCount.value
  return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
})

onMounted(startPractice)
onBeforeUnmount(stopTimer)

function startPractice() {
  stopTimer()
  questionIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  streak.value = 0
  bestStreak.value = 0
  elapsedMs.value = 0
  lastAnswerCorrect.value = null
  isFinished.value = false
  lastMidi = null
  startTimestamp = Date.now()

  isTimerMode.value = settings.practiceMode === 'timer'
  totalQuestions.value = isTimerMode.value ? 999 : settings.questionCount

  if (isTimerMode.value) {
    timerRemaining.value = settings.timerSeconds
    startTimer()
  }

  nextQuestion()
}

function startTimer() {
  timerInterval = setInterval(() => {
    timerRemaining.value--
    if (timerRemaining.value <= 0) {
      finishPractice()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function nextQuestion() {
  const candidates = lastMidi === null ? notePool : notePool.filter(note => note.midi !== lastMidi)
  const picked = candidates[Math.floor(Math.random() * candidates.length)] ?? notePool[0]
  if (!picked) return

  currentNote.value = picked
  lastMidi = picked.midi
  questionIndex.value++
}

function submitAnswer(answer: NoteLetter) {
  if (!currentNote.value || isFinished.value || lastAnswerCorrect.value !== null) return

  const correct = currentNote.value.letter === answer
  lastAnswerCorrect.value = correct

  if (correct) {
    correctCount.value++
    streak.value++
    if (streak.value > bestStreak.value) bestStreak.value = streak.value
  } else {
    wrongCount.value++
    streak.value = 0
  }

  const isLastQuestion = !isTimerMode.value && questionIndex.value >= totalQuestions.value
  setTimeout(() => {
    lastAnswerCorrect.value = null
    if (isLastQuestion) {
      finishPractice()
    } else {
      nextQuestion()
    }
  }, 400)
}

function finishPractice() {
  if (isFinished.value) return
  isFinished.value = true
  elapsedMs.value = Date.now() - startTimestamp
  stopTimer()
}

function goBack() {
  stopTimer()
  router.push('/')
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}
</script>

<style scoped>
.note-name-page {
  overflow: hidden;
}

.prompt {
  padding: 12px 16px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.staff-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  min-height: 0;
}

.answer-area {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 16px 12px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.letter-btn {
  min-height: 56px;
  border-radius: 14px;
  background: #eef2ff;
  color: var(--primary);
  font-size: 22px;
  font-weight: 700;
  transition: transform 0.1s, background 0.15s;
}

.letter-btn:active {
  transform: scale(0.96);
  background: #e0e7ff;
}

.letter-btn:disabled {
  opacity: 0.7;
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
