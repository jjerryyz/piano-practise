import type { Note } from './musicTheory'
import { midiToPitchClass } from './musicTheory'
import type { NoteGroup } from '../data/noteRanges'

export interface Question {
  id: number
  targetNote: Note
  /** Set of acceptable MIDI pitch classes (for enharmonic tolerance) */
  acceptablePitchClasses: Set<number>
  /** Timestamp when question was presented */
  startTime: number
}

let questionCounter = 0

export function generateQuestion(group: NoteGroup, excludeLastMidi?: number): Question {
  let pool = group.notes
  if (excludeLastMidi !== undefined && pool.length > 1) {
    pool = pool.filter(n => n.midi !== excludeLastMidi)
  }
  const targetNote = pool[Math.floor(Math.random() * pool.length)]
  const acceptable = new Set([midiToPitchClass(targetNote.midi)])

  return {
    id: ++questionCounter,
    targetNote,
    acceptablePitchClasses: acceptable,
    startTime: Date.now(),
  }
}

export function generateQuestionSet(group: NoteGroup, count: number): Question[] {
  const questions: Question[] = []
  let lastMidi: number | undefined
  for (let i = 0; i < count; i++) {
    const q = generateQuestion(group, lastMidi)
    questions.push(q)
    lastMidi = q.targetNote.midi
  }
  return questions
}

export function evaluateAnswer(question: Question, answerMidi: number): boolean {
  return question.acceptablePitchClasses.has(midiToPitchClass(answerMidi))
}
