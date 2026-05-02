import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NoteGroup } from '../data/noteRanges'
import type { Question } from '../lib/questionGenerator'
import { generateQuestion, evaluateNoteAnswer } from '../lib/questionGenerator'
import { useWrongBookStore, type WrongRecord } from './wrongBook'
import { useSettingsStore } from './settings'
import { createNote, noteDisplayName, type NoteLetter, type Accidental } from '../lib/musicTheory'

type PracticeMode = 'normal' | 'wrong-review'

export const usePracticeStore = defineStore('practice', () => {
  const currentGroup = ref<NoteGroup | null>(null)
  const currentQuestion = ref<Question | null>(null)
  const currentReviewRecord = ref<WrongRecord | null>(null)
  const currentNoteIndex = ref(0)
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
  const notesPerQuestion = ref(1)
  const practiceMode = ref<PracticeMode>('normal')
  const reviewQueue = ref<WrongRecord[]>([])

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let startTimestamp = 0

  const accuracy = computed(() => {
    const total = correctCount.value + wrongCount.value
    return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
  })

  const isWrongBookReview = computed(() => practiceMode.value === 'wrong-review')

  function startPractice(group: NoteGroup) {
    const settings = useSettingsStore()
    stopTimer()
    practiceMode.value = 'normal'
    reviewQueue.value = []
    currentReviewRecord.value = null
    currentGroup.value = group
    questionIndex.value = 0
    currentNoteIndex.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    streak.value = 0
    bestStreak.value = 0
    elapsedMs.value = 0
    isFinished.value = false
    lastAnswerCorrect.value = null
    startTimestamp = Date.now()
    notesPerQuestion.value = settings.notesPerQuestion

    isTimerMode.value = settings.practiceMode === 'timer'
    totalQuestions.value = isTimerMode.value ? 999 : settings.questionCount

    if (isTimerMode.value) {
      timerRemaining.value = settings.timerSeconds
      startTimer()
    }

    nextQuestion()
  }

  function startWrongBookReview(records?: WrongRecord[]) {
    const wrongBook = useWrongBookStore()
    const queue = [...(records ?? wrongBook.dueRecords)].sort((a, b) => a.dueAt - b.dueAt)
    if (queue.length === 0) return false

    stopTimer()
    practiceMode.value = 'wrong-review'
    reviewQueue.value = queue
    currentReviewRecord.value = null
    questionIndex.value = 0
    currentNoteIndex.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    streak.value = 0
    bestStreak.value = 0
    elapsedMs.value = 0
    isFinished.value = false
    lastAnswerCorrect.value = null
    isTimerMode.value = false
    timerRemaining.value = 0
    notesPerQuestion.value = 1
    totalQuestions.value = queue.length
    startTimestamp = Date.now()
    currentGroup.value = {
      id: 'wrong-review',
      label: '错题复习',
      sublabel: `到期错题 ${queue.length} 题`,
      section: '错题本',
      notes: queue.map(recordToNote),
      difficulty: 'beginner',
      includeAccidentals: true,
    }

    nextQuestion()
    return true
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
    if (isWrongBookReview.value) {
      const record = reviewQueue.value[questionIndex.value]
      if (!record) {
        finishPractice()
        return
      }

      currentReviewRecord.value = record
      currentQuestion.value = {
        id: Date.now(),
        targetNotes: [recordToNote(record)],
        startTime: Date.now(),
      }
      currentNoteIndex.value = 0
      questionIndex.value++
      return
    }

    if (!currentGroup.value) return
    const targetNotes = currentQuestion.value?.targetNotes
    const lastMidi = targetNotes?.[targetNotes.length - 1]?.midi
    currentQuestion.value = generateQuestion(currentGroup.value, notesPerQuestion.value, lastMidi)
    currentNoteIndex.value = 0
    questionIndex.value++
  }

  function submitAnswer(answerMidi: number) {
    if (!currentQuestion.value || !currentGroup.value || isFinished.value || lastAnswerCorrect.value !== null) return

    const targetNote = currentQuestion.value.targetNotes[currentNoteIndex.value]
    if (!targetNote) return

    const correct = evaluateNoteAnswer(targetNote, answerMidi)
    lastAnswerCorrect.value = correct
    const answerName = answerNameFromMidi(answerMidi)

    if (correct) {
      correctCount.value++
      streak.value++
      if (streak.value > bestStreak.value) bestStreak.value = streak.value
    } else {
      wrongCount.value++
      streak.value = 0
    }

    if (isWrongBookReview.value && currentReviewRecord.value) {
      const wrongBook = useWrongBookStore()
      wrongBook.recordReviewResult(currentReviewRecord.value.id, correct, {
        midi: answerMidi,
        name: answerName,
      })
    } else if (!correct) {
      const wrongBook = useWrongBookStore()

      wrongBook.addRecord({
        targetNote: {
          letter: targetNote.letter,
          octave: targetNote.octave,
          accidental: targetNote.accidental,
          displayName: targetNote.displayName,
        },
        userAnswerMidi: answerMidi,
        userAnswerName: answerName,
        groupId: currentGroup.value.id,
        groupLabel: currentGroup.value.label,
      })
    }

    const isLastNote = currentNoteIndex.value >= currentQuestion.value.targetNotes.length - 1
    const isLastQuestion = !isTimerMode.value && questionIndex.value >= totalQuestions.value

    setTimeout(() => {
      lastAnswerCorrect.value = null

      if (isLastNote) {
        if (isLastQuestion) {
          finishPractice()
        } else {
          nextQuestion()
        }
      } else {
        currentNoteIndex.value++
      }
    }, 400)
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
    currentReviewRecord.value = null
    currentNoteIndex.value = 0
    questionIndex.value = 0
    practiceMode.value = 'normal'
    reviewQueue.value = []
    isFinished.value = false
    lastAnswerCorrect.value = null
  }

  function recordToNote(record: WrongRecord) {
    return createNote(
      record.targetNote.letter as NoteLetter,
      record.targetNote.octave,
      record.targetNote.accidental as Accidental,
    )
  }

  function answerNameFromMidi(answerMidi: number): string {
    const answerOctave = Math.floor(answerMidi / 12) - 1
    const answerPc = answerMidi % 12
    const letterNames: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
    const answerLetter = letterNames[answerPc] ?? 'C'
    return noteDisplayName(answerLetter, answerOctave, 'none')
  }

  return {
    currentGroup,
    currentQuestion,
    currentReviewRecord,
    currentNoteIndex,
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
    notesPerQuestion,
    practiceMode,
    isWrongBookReview,
    startPractice,
    startWrongBookReview,
    submitAnswer,
    finishPractice,
    reset,
  }
})
