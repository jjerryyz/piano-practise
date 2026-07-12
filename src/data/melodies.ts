import { GENERATED_MELODIES as RAW_MELODIES } from './melodies.generated'
import { createNote, type Accidental, type Note, type NoteLetter } from '../lib/musicTheory'

export interface MelodyNote {
  midi: number
  startBeat: number
  durationBeats: number
  barIndex: number
}

export interface Melody {
  id: string
  title: string
  source: string
  bpm: number
  timeSignature: [number, number]
  keySignature: number
  barCount: number
  notes: MelodyNote[]
}

export interface MelodySection {
  melodyId: string
  title: string
  startBar: number
  /** Inclusive end bar index */
  endBar: number
  timeSignature: [number, number]
  keySignature: number
  notes: MelodyNote[]
}

export const DEFAULT_BARS_PER_SECTION = 2
export const BARS_PER_SECTION_OPTIONS = [2, 4] as const

const GENERATED_MELODIES = RAW_MELODIES as unknown as Melody[]

const SHARP_PC: Array<[NoteLetter, Accidental]> = [
  ['C', 'none'],
  ['C', 'sharp'],
  ['D', 'none'],
  ['D', 'sharp'],
  ['E', 'none'],
  ['F', 'none'],
  ['F', 'sharp'],
  ['G', 'none'],
  ['G', 'sharp'],
  ['A', 'none'],
  ['A', 'sharp'],
  ['B', 'none'],
]

const FLAT_PC: Array<[NoteLetter, Accidental]> = [
  ['C', 'none'],
  ['D', 'flat'],
  ['D', 'none'],
  ['E', 'flat'],
  ['E', 'none'],
  ['F', 'none'],
  ['G', 'flat'],
  ['G', 'none'],
  ['A', 'flat'],
  ['A', 'none'],
  ['B', 'flat'],
  ['B', 'none'],
]

export function getMelodies(): Melody[] {
  return GENERATED_MELODIES
}

export function getMelodyById(id: string): Melody | undefined {
  return GENERATED_MELODIES.find(m => m.id === id)
}

export function midiToNote(midi: number, keySignature = 0): Note {
  const octave = Math.floor(midi / 12) - 1
  const pc = ((midi % 12) + 12) % 12
  const table = keySignature < 0 ? FLAT_PC : SHARP_PC
  const [letter, accidental] = table[pc] ?? ['C', 'none']
  return createNote(letter, octave, accidental)
}

export function melodyNotesToPracticeNotes(notes: MelodyNote[], keySignature = 0): Note[] {
  return notes.map(n => midiToNote(n.midi, keySignature))
}

/**
 * Slice a contiguous bar range from a melody. Never crosses melody boundaries.
 */
export function sliceMelodySection(
  melody: Melody,
  startBar: number,
  barsPerSection: number,
): MelodySection | null {
  if (melody.barCount <= 0 || melody.notes.length === 0) return null

  const span = Math.max(1, Math.min(barsPerSection, melody.barCount))
  const maxStart = Math.max(0, melody.barCount - span)
  const clampedStart = Math.min(Math.max(0, startBar), maxStart)
  const endBar = clampedStart + span - 1

  const notes = melody.notes.filter(n => n.barIndex >= clampedStart && n.barIndex <= endBar)
  if (notes.length === 0) return null

  return {
    melodyId: melody.id,
    title: melody.title,
    startBar: clampedStart,
    endBar,
    timeSignature: melody.timeSignature,
    keySignature: melody.keySignature,
    notes,
  }
}

export function listPossibleSections(melody: Melody, barsPerSection: number): MelodySection[] {
  const span = Math.max(1, Math.min(barsPerSection, melody.barCount))
  const maxStart = Math.max(0, melody.barCount - span)
  const sections: MelodySection[] = []
  for (let start = 0; start <= maxStart; start++) {
    const section = sliceMelodySection(melody, start, span)
    if (section) sections.push(section)
  }
  return sections
}
