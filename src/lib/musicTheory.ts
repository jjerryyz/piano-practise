export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Accidental = 'sharp' | 'flat' | 'natural' | 'none'

export interface Note {
  letter: NoteLetter
  octave: number
  accidental: Accidental
  midi: number
  /** Display name like "c1", "C#", "db2" */
  displayName: string
  /** Staff position: semitone distance from middle C (C4 = 0) for vertical placement */
  staffLine: number
}

const LETTER_TO_SEMITONE: Record<NoteLetter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

const LETTER_STAFF_POSITIONS: Record<NoteLetter, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
}

export function accidentalOffset(acc: Accidental): number {
  if (acc === 'sharp') return 1
  if (acc === 'flat') return -1
  return 0
}

export function noteToMidi(letter: NoteLetter, octave: number, accidental: Accidental): number {
  return (octave + 1) * 12 + LETTER_TO_SEMITONE[letter] + accidentalOffset(accidental)
}

/**
 * Staff position in diatonic steps from C4 (middle C).
 * C4=0, D4=1, ... B4=6, C5=7, etc.
 */
export function noteToStaffPosition(letter: NoteLetter, octave: number): number {
  return (octave - 4) * 7 + LETTER_STAFF_POSITIONS[letter]
}

/**
 * Chinese octave naming convention:
 * octave 2 = 大字组 (C-B), octave 3 = 小字组 (c-b),
 * octave 4 = 小字一组 (c1-b1), octave 5 = 小字二组 (c2-b2), etc.
 */
export function octaveToChineseName(octave: number): string {
  const names: Record<number, string> = {
    1: '大字一组',
    2: '大字组',
    3: '小字组',
    4: '小字一组',
    5: '小字二组',
    6: '小字三组',
    7: '小字四组',
  }
  return names[octave] ?? `八度${octave}`
}

export function noteDisplayName(letter: NoteLetter, octave: number, accidental: Accidental): string {
  const isLower = octave >= 3
  const base = isLower ? letter.toLowerCase() : letter
  const accStr = accidental === 'sharp' ? '#' : accidental === 'flat' ? 'b' : ''
  const octSuffix = octave >= 4 ? String(octave - 3) : octave <= 1 ? String(2 - octave) : ''
  return `${base}${accStr}${octSuffix}`
}

export function createNote(letter: NoteLetter, octave: number, accidental: Accidental = 'none'): Note {
  return {
    letter,
    octave,
    accidental,
    midi: noteToMidi(letter, octave, accidental),
    displayName: noteDisplayName(letter, octave, accidental),
    staffLine: noteToStaffPosition(letter, octave),
  }
}

const ALL_LETTERS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** Generate all natural notes in a given octave */
export function notesInOctave(octave: number): Note[] {
  return ALL_LETTERS.map(l => createNote(l, octave))
}

/** Check if two notes are enharmonic equivalents (same MIDI, different spelling) */
export function isEnharmonic(a: Note, b: Note): boolean {
  return a.midi === b.midi && (a.letter !== b.letter || a.accidental !== b.accidental)
}

/**
 * Get all enharmonic spellings for a given MIDI number.
 * E.g. MIDI 61 -> [C#4, Db4]
 */
export function enharmonicSpellings(midi: number): Note[] {
  const octave = Math.floor(midi / 12) - 1
  const pc = midi % 12
  const results: Note[] = []

  for (const letter of ALL_LETTERS) {
    const base = LETTER_TO_SEMITONE[letter]
    if (base === pc) results.push(createNote(letter, octave, 'none'))
    if (base + 1 === pc || (base === 11 && pc === 0)) {
      const oct = base === 11 && pc === 0 ? octave + 1 : octave
      if (base + 1 === pc) results.push(createNote(letter, octave, 'sharp'))
    }
    if (base - 1 === pc || (base === 0 && pc === 11)) {
      if (base - 1 === pc) results.push(createNote(letter, octave, 'flat'))
    }
  }
  return results
}

/**
 * Key signature: number of sharps (positive) or flats (negative).
 * 0 = C major / A minor.
 */
export interface KeySignature {
  value: number
  label: string
}

export const KEY_SIGNATURES: KeySignature[] = [
  { value: -7, label: 'Cb大调 (7b)' },
  { value: -6, label: 'Gb大调 (6b)' },
  { value: -5, label: 'Db大调 (5b)' },
  { value: -4, label: 'Ab大调 (4b)' },
  { value: -3, label: 'Eb大调 (3b)' },
  { value: -2, label: 'Bb大调 (2b)' },
  { value: -1, label: 'F大调 (1b)' },
  { value: 0, label: 'C大调' },
  { value: 1, label: 'G大调 (1#)' },
  { value: 2, label: 'D大调 (2#)' },
  { value: 3, label: 'A大调 (3#)' },
  { value: 4, label: 'E大调 (4#)' },
  { value: 5, label: 'B大调 (5#)' },
  { value: 6, label: 'F#大调 (6#)' },
  { value: 7, label: 'C#大调 (7#)' },
]

const SHARP_ORDER: NoteLetter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: NoteLetter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

/** Returns which note letters are sharped/flatted in a given key signature */
export function keySignatureAccidentals(ks: number): Map<NoteLetter, 'sharp' | 'flat'> {
  const map = new Map<NoteLetter, 'sharp' | 'flat'>()
  if (ks > 0) {
    for (let i = 0; i < Math.min(ks, 7); i++) map.set(SHARP_ORDER[i], 'sharp')
  } else if (ks < 0) {
    for (let i = 0; i < Math.min(-ks, 7); i++) map.set(FLAT_ORDER[i], 'flat')
  }
  return map
}

/** VexFlow note name, e.g. "C#/4", "Db/5" */
export function noteToVexKey(note: Note): string {
  const accMap: Record<Accidental, string> = { sharp: '#', flat: 'b', natural: 'n', none: '' }
  return `${note.letter}${accMap[note.accidental]}/${note.octave}`
}

/** Convert MIDI to a simple note letter (for answer matching, ignoring octave) */
export function midiToPitchClass(midi: number): number {
  return midi % 12
}
