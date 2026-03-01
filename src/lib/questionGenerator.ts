import type { Note } from './musicTheory'
import { midiToPitchClass } from './musicTheory'
import type { NoteGroup } from '../data/noteRanges'

export interface Question {
  id: number
  targetNotes: Note[]
  startTime: number
}

let questionCounter = 0

export function generateQuestion(group: NoteGroup, count: number, excludeLastMidi?: number): Question {
  const notes: Note[] = []
  let lastMidi = excludeLastMidi

  for (let i = 0; i < count; i++) {
    let pool = group.notes
    if (lastMidi !== undefined && pool.length > 1) {
      pool = pool.filter(n => n.midi !== lastMidi)
    }
    const picked = pool[Math.floor(Math.random() * pool.length)]
    notes.push(picked)
    lastMidi = picked.midi
  }

  return {
    id: ++questionCounter,
    targetNotes: notes,
    startTime: Date.now(),
  }
}

export function evaluateNoteAnswer(note: Note, answerMidi: number): boolean {
  return midiToPitchClass(note.midi) === midiToPitchClass(answerMidi)
}
