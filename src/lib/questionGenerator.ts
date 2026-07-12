import type { Note } from './musicTheory'
import { midiToPitchClass } from './musicTheory'
import type { NoteGroup } from '../data/noteRanges'
import {
  getMelodies,
  listPossibleSections,
  melodyNotesToPracticeNotes,
  type Melody,
  type MelodyNote,
  type MelodySection,
} from '../data/melodies'

export interface MelodyQuestionMeta {
  melodyId: string
  title: string
  startBar: number
  endBar: number
  timeSignature: [number, number]
  keySignature: number
  layoutNotes: MelodyNote[]
}

export interface Question {
  id: number
  targetNotes: Note[]
  startTime: number
  melody?: MelodyQuestionMeta
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
    if (!picked) continue
    notes.push(picked)
    lastMidi = picked.midi
  }

  if (notes.length === 0 && group.notes[0]) {
    notes.push(group.notes[0])
  }

  return {
    id: ++questionCounter,
    targetNotes: notes,
    startTime: Date.now(),
  }
}

export function sectionToQuestion(section: MelodySection): Question {
  return {
    id: ++questionCounter,
    targetNotes: melodyNotesToPracticeNotes(section.notes, section.keySignature),
    startTime: Date.now(),
    melody: {
      melodyId: section.melodyId,
      title: section.title,
      startBar: section.startBar,
      endBar: section.endBar,
      timeSignature: section.timeSignature,
      keySignature: section.keySignature,
      layoutNotes: section.notes,
    },
  }
}

/**
 * Random contiguous bar section from the melody library.
 * Never crosses melody boundaries; preserves original note order.
 */
export function generateMelodySectionQuestion(
  barsPerSection: number,
  options?: {
    melodies?: Melody[]
    exclude?: { melodyId: string; startBar: number }
  },
): Question {
  const melodies = options?.melodies ?? getMelodies()
  const pool: MelodySection[] = []

  for (const melody of melodies) {
    for (const section of listPossibleSections(melody, barsPerSection)) {
      if (
        options?.exclude
        && section.melodyId === options.exclude.melodyId
        && section.startBar === options.exclude.startBar
      ) {
        continue
      }
      pool.push(section)
    }
  }

  const candidates = pool.length > 0
    ? pool
    : melodies.flatMap(m => listPossibleSections(m, barsPerSection))

  if (candidates.length === 0) {
    throw new Error('No melody sections available')
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  if (!picked) {
    throw new Error('No melody sections available')
  }
  return sectionToQuestion(picked)
}

export function evaluateNoteAnswer(note: Note, answerMidi: number): boolean {
  return midiToPitchClass(note.midi) === midiToPitchClass(answerMidi)
}

/** Melody practice requires the exact written pitch including octave. */
export function evaluateMelodyAnswer(note: Note, answerMidi: number): boolean {
  return note.midi === answerMidi
}
