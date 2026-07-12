import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type PracticeType = 'single-note' | 'melody-section'

export interface WrongRecord {
  id: string
  targetNote: { letter: string; octave: number; accidental: string; displayName: string }
  userAnswerMidi: number
  userAnswerName: string
  groupId: string
  groupLabel: string
  timestamp: number
  practiceType: PracticeType
  reviewLevel: number
  dueAt: number
  lastReviewedAt: number | null
  reviewCorrectCount: number
  reviewWrongCount: number
}

const STORAGE_KEY = 'wrongBook'
const REVIEW_INTERVALS = [
  0,
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  15 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
]

function noteKey(record: Pick<WrongRecord, 'groupId' | 'targetNote' | 'practiceType'>): string {
  const note = record.targetNote
  return `${record.practiceType}:${record.groupId}:${note.letter}:${note.octave}:${note.accidental}`
}

function normalizePracticeType(value: unknown): PracticeType {
  return value === 'melody-section' ? 'melody-section' : 'single-note'
}

function normalizeRecord(record: Partial<WrongRecord>): WrongRecord | null {
  if (!record.id || !record.targetNote || !record.groupId || !record.groupLabel) return null
  const timestamp = record.timestamp ?? Date.now()
  return {
    id: record.id,
    targetNote: record.targetNote,
    userAnswerMidi: record.userAnswerMidi ?? 0,
    userAnswerName: record.userAnswerName ?? '-',
    groupId: record.groupId,
    groupLabel: record.groupLabel,
    timestamp,
    practiceType: normalizePracticeType(record.practiceType),
    reviewLevel: record.reviewLevel ?? 0,
    dueAt: record.dueAt ?? timestamp,
    lastReviewedAt: record.lastReviewedAt ?? null,
    reviewCorrectCount: record.reviewCorrectCount ?? 0,
    reviewWrongCount: record.reviewWrongCount ?? 0,
  }
}

function loadRecords(): WrongRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeRecord)
      .filter((record): record is WrongRecord => record !== null)
  } catch {
    return []
  }
}

export const useWrongBookStore = defineStore('wrongBook', () => {
  const records = ref<WrongRecord[]>(loadRecords())

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  const dueRecords = computed(() => {
    const now = Date.now()
    return records.value
      .filter(r => r.dueAt <= now)
      .sort((a, b) => a.dueAt - b.dueAt)
  })

  const upcomingRecords = computed(() => {
    const now = Date.now()
    return records.value
      .filter(r => r.dueAt > now)
      .sort((a, b) => a.dueAt - b.dueAt)
  })

  const reviewStats = computed(() => ({
    total: records.value.length,
    due: dueRecords.value.length,
    learning: records.value.filter(r => r.reviewLevel <= 1).length,
    mastered: records.value.filter(r => r.reviewLevel >= REVIEW_INTERVALS.length - 1).length,
  }))

  function addRecord(record: Omit<WrongRecord, 'id' | 'timestamp' | 'reviewLevel' | 'dueAt' | 'lastReviewedAt' | 'reviewCorrectCount' | 'reviewWrongCount'> & { practiceType?: PracticeType }) {
    const now = Date.now()
    const practiceType = record.practiceType ?? 'single-note'
    const payload = { ...record, practiceType }
    const existing = records.value.find(r => noteKey(r) === noteKey(payload))
    if (existing) {
      existing.userAnswerMidi = record.userAnswerMidi
      existing.userAnswerName = record.userAnswerName
      existing.groupLabel = record.groupLabel
      existing.timestamp = now
      existing.practiceType = practiceType
      existing.reviewLevel = 0
      existing.dueAt = now
      existing.reviewWrongCount++
    } else {
      records.value.push({
        ...record,
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: now,
        practiceType,
        reviewLevel: 0,
        dueAt: now,
        lastReviewedAt: null,
        reviewCorrectCount: 0,
        reviewWrongCount: 1,
      })
    }
    save()
  }

  function recordReviewResult(id: string, correct: boolean, answer?: { midi: number; name: string }) {
    const record = records.value.find(r => r.id === id)
    if (!record) return

    const now = Date.now()
    record.lastReviewedAt = now

    if (answer) {
      record.userAnswerMidi = answer.midi
      record.userAnswerName = answer.name
    }

    if (correct) {
      record.reviewCorrectCount++
      record.reviewLevel = Math.min(record.reviewLevel + 1, REVIEW_INTERVALS.length - 1)
    } else {
      record.reviewWrongCount++
      record.reviewLevel = 0
    }

    record.dueAt = now + (REVIEW_INTERVALS[record.reviewLevel] ?? 0)
    save()
  }

  function removeRecord(id: string) {
    records.value = records.value.filter(r => r.id !== id)
    save()
  }

  function clearAll() {
    records.value = []
    save()
  }

  function getByGroup(groupId: string): WrongRecord[] {
    return records.value.filter(r => r.groupId === groupId)
  }

  return {
    records,
    dueRecords,
    upcomingRecords,
    reviewStats,
    addRecord,
    recordReviewResult,
    removeRecord,
    clearAll,
    getByGroup,
  }
})
