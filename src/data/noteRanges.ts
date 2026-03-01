import { notesInOctave, octaveToChineseName, type Note, type NoteLetter, createNote, type Accidental } from '../lib/musicTheory'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface NoteGroup {
  id: string
  label: string
  sublabel: string
  octave: number
  notes: Note[]
  difficulty: Difficulty
  /** Whether to include accidentals in this group */
  includeAccidentals: boolean
}

function makeGroup(
  octave: number,
  difficulty: Difficulty,
  includeAccidentals: boolean = false,
): NoteGroup {
  const label = octaveToChineseName(octave)
  const isLower = octave >= 3
  const rangeStart = isLower ? 'c' : 'C'
  const rangeEnd = isLower ? 'b' : 'B'
  const suffix = octave >= 4 ? String(octave - 3) : octave <= 1 ? String(2 - octave) : ''

  const notes = notesInOctave(octave)

  if (includeAccidentals) {
    const accidentalNotes: Note[] = []
    const sharps: NoteLetter[] = ['C', 'D', 'F', 'G', 'A']
    for (const l of sharps) {
      accidentalNotes.push(createNote(l, octave, 'sharp'))
    }
    const flats: NoteLetter[] = ['D', 'E', 'G', 'A', 'B']
    for (const l of flats) {
      accidentalNotes.push(createNote(l, octave, 'flat'))
    }
    notes.push(...accidentalNotes)
  }

  return {
    id: `oct-${octave}${includeAccidentals ? '-acc' : ''}`,
    label,
    sublabel: `${rangeStart}${suffix}-${rangeEnd}${suffix} | 音符数量 ${notes.length}`,
    octave,
    notes,
    difficulty,
    includeAccidentals,
  }
}

export const NOTE_GROUPS: NoteGroup[] = [
  makeGroup(2, 'beginner'),
  makeGroup(3, 'beginner'),
  makeGroup(4, 'beginner'),
  makeGroup(5, 'beginner'),
  makeGroup(6, 'beginner'),

  makeGroup(2, 'intermediate', false),
  makeGroup(3, 'intermediate', false),
  makeGroup(4, 'intermediate', true),
  makeGroup(5, 'intermediate', true),

  makeGroup(4, 'advanced', true),
  makeGroup(5, 'advanced', true),
  makeGroup(3, 'advanced', true),
]

export function getGroupsByDifficulty(difficulty: Difficulty): NoteGroup[] {
  return NOTE_GROUPS.filter(g => g.difficulty === difficulty)
}
