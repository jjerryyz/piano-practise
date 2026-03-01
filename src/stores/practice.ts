import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NoteGroup } from '../data/noteRanges'
import type { Question } from '../lib/questionGenerator'
import { generateQuestion, evaluateAnswer } from '../lib/questionGenerator'
import { useWrongBookStore } from './wrongBook'
import { useSettingsStore } from './settings'
import { noteDisplayName, type NoteLetter, type Accidental } from '../lib/musicTheory'

export const usePracticeStore = defineStore('practice', () => {
  const currentGroup = ref<NoteGroup | null>(null)
  const currentQuestion = ref<Question | null>(null)
  const questionIndex = ref(0)
  const totalQuestions = ref(0)
  const correctCount = ref(0)
  const wrongCount = ref(0)
  const streak = ref(0)
  const bestStreak = ref(0)
  const elapsedMs = ref(0)
  const isFinished = ref(false)
  const lastAnswerCorrect = ref<boolean | null>(null)
  const timerRemaining = ref(0)
  const isTimerMode = ref(false)

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let startTimestamp = 0

  const accuracy = computed(() => {
    const total = correctCount.value + wrongCount.value
    return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
  })

  function startPractice(group: NoteGroup) {
    const settings = useSettingsStore()
    currentGroup.value = group
    questionIndex.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    streak.value = 0
    bestStreak.value = 0
    elapsedMs.value = 0
    isFinished.value = false
    lastAnswerCorrect.value = null
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
    stopTimer()
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
    if (!currentGroup.value) return
    const lastMidi = currentQuestion.value?.targetNote.midi
    currentQuestion.value = generateQuestion(currentGroup.value, lastMidi)
    questionIndex.value++
  }

  function submitAnswer(answerMidi: number) {
    if (!currentQuestion.value || !currentGroup.value || isFinished.value) return

    const correct = evaluateAnswer(currentQuestion.value, answerMidi)
    lastAnswerCorrect.value = correct

    if (correct) {
      correctCount.value++
      streak.value++
      if (streak.value > bestStreak.value) bestStreak.value = streak.value
    } else {
      wrongCount.value++
      streak.value = 0

      const wrongBook = useWrongBookStore()
      const target = currentQuestion.value.targetNote
      const answerOctave = Math.floor(answerMidi / 12) - 1
      const answerPc = answerMidi % 12
      const letterNames: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
      const answerLetter = letterNames[answerPc]

      wrongBook.addRecord({
        targetNote: {
          letter: target.letter,
          octave: target.octave,
          accidental: target.accidental,
          displayName: target.displayName,
        },
        userAnswerMidi: answerMidi,
        userAnswerName: noteDisplayName(answerLetter, answerOctave, 'none' as Accidental),
        groupId: currentGroup.value.id,
        groupLabel: currentGroup.value.label,
      })
    }

    if (!isTimerMode.value && questionIndex.value >= totalQuestions.value) {
      finishPractice()
    } else {
      setTimeout(() => {
        lastAnswerCorrect.value = null
        nextQuestion()
      }, 600)
    }
  }

  function finishPractice() {
    isFinished.value = true
    elapsedMs.value = Date.now() - startTimestamp
    stopTimer()
  }

  function reset() {
    stopTimer()
    currentGroup.value = null
    currentQuestion.value = null
    questionIndex.value = 0
    isFinished.value = false
    lastAnswerCorrect.value = null
  }

  return {
    currentGroup,
    currentQuestion,
    questionIndex,
    totalQuestions,
    correctCount,
    wrongCount,
    streak,
    bestStreak,
    accuracy,
    elapsedMs,
    isFinished,
    lastAnswerCorrect,
    timerRemaining,
    isTimerMode,
    startPractice,
    submitAnswer,
    finishPractice,
    reset,
  }
})
