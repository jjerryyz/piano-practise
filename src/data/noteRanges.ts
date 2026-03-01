import {
  notesInOctave, octaveToChineseName,
  type Note, type NoteLetter, createNote,
} from '../lib/musicTheory'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface NoteGroup {
  id: string
  label: string
  sublabel: string
  /** Section heading for UI grouping */
  section: string
  notes: Note[]
  difficulty: Difficulty
  includeAccidentals: boolean
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function naturals(...octaves: number[]): Note[] {
  return octaves.flatMap(o => notesInOctave(o))
}

function withAccidentals(notes: Note[], octaves: number[]): Note[] {
  const all = [...notes]
  const sharps: NoteLetter[] = ['C', 'D', 'F', 'G', 'A']
  const flats: NoteLetter[] = ['D', 'E', 'G', 'A', 'B']
  for (const oct of octaves) {
    for (const l of sharps) all.push(createNote(l, oct, 'sharp'))
    for (const l of flats) all.push(createNote(l, oct, 'flat'))
  }
  return all
}

function noteRange(startLetter: NoteLetter, startOct: number, endLetter: NoteLetter, endOct: number): Note[] {
  const ALL: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const notes: Note[] = []
  for (let oct = startOct; oct <= endOct; oct++) {
    for (const l of ALL) {
      if (oct === startOct && ALL.indexOf(l) < ALL.indexOf(startLetter)) continue
      if (oct === endOct && ALL.indexOf(l) > ALL.indexOf(endLetter)) continue
      notes.push(createNote(l, oct))
    }
  }
  return notes
}

// ---------------------------------------------------------------------------
// Beginner – one group per octave, natural notes only
// ---------------------------------------------------------------------------

function beginnerGroup(octave: number): NoteGroup {
  const label = octaveToChineseName(octave)
  const notes = notesInOctave(octave)
  const isLower = octave >= 3
  const r0 = isLower ? 'c' : 'C'
  const r1 = isLower ? 'b' : 'B'
  const suf = octave >= 4 ? String(octave - 3) : octave <= 1 ? String(2 - octave) : ''
  return {
    id: `beg-${octave}`,
    label,
    sublabel: `${r0}${suf}-${r1}${suf} | 音符数量 ${notes.length}`,
    section: '常用音符',
    notes,
    difficulty: 'beginner',
    includeAccidentals: false,
  }
}

const BEGINNER_GROUPS: NoteGroup[] = [
  beginnerGroup(2),
  beginnerGroup(3),
  beginnerGroup(4),
  beginnerGroup(5),
  beginnerGroup(6),
]

// ---------------------------------------------------------------------------
// Intermediate – by register + ledger-line categories
// ---------------------------------------------------------------------------

function makeIntermediate(
  id: string, label: string, sublabel: string, section: string,
  notes: Note[], acc: boolean,
): NoteGroup {
  return { id, label, sublabel, section, notes, difficulty: 'intermediate', includeAccidentals: acc }
}

const INT_COMMON: NoteGroup[] = [
  makeIntermediate(
    'int-low', '低音区', 'C-B (大字组 + 小字组) | 含升降号',
    '常见音区',
    withAccidentals(naturals(2, 3), [2, 3]),
    true,
  ),
  makeIntermediate(
    'int-mid', '中音区', 'c-b1 (小字组 + 小字一组) | 含升降号',
    '常见音区',
    withAccidentals(naturals(3, 4), [3, 4]),
    true,
  ),
  makeIntermediate(
    'int-high', '高音区', 'c2-b3 (小字二组 + 小字三组) | 含升降号',
    '常见音区',
    withAccidentals(naturals(5, 6), [5, 6]),
    true,
  ),
]

/*
 * Ledger-line groups are defined relative to the clef used for display:
 *   treble clef (oct≥4) staff range = E4-F5
 *   bass clef (oct≤3) staff range = G2-A3
 *
 * 下加线: notes below the staff bottom line
 * 中间线: notes on / between the 5 staff lines
 * 上加线: notes above the staff top line
 */
const INT_LEDGER: NoteGroup[] = [
  makeIntermediate(
    'int-ledger-low', '下加线',
    '低音谱表 C2-F2 + 高音谱表 C4-D4',
    '加线练习',
    [...noteRange('C', 2, 'F', 2), ...noteRange('C', 4, 'D', 4)],
    false,
  ),
  makeIntermediate(
    'int-staff', '中间线',
    '低音谱表 G2-A3 + 高音谱表 E4-F5',
    '加线练习',
    [...noteRange('G', 2, 'A', 3), ...noteRange('E', 4, 'F', 5)],
    false,
  ),
  makeIntermediate(
    'int-ledger-high', '上加线',
    '低音谱表 B3 + 高音谱表 G5-C6',
    '加线练习',
    [...noteRange('B', 3, 'B', 3), ...noteRange('G', 5, 'C', 6)],
    false,
  ),
]

const INTERMEDIATE_GROUPS: NoteGroup[] = [...INT_COMMON, ...INT_LEDGER]

// ---------------------------------------------------------------------------
// Advanced – full range, single group
// ---------------------------------------------------------------------------

const ADV_NOTES = withAccidentals(naturals(2, 3, 4, 5, 6), [2, 3, 4, 5, 6])

const ADVANCED_GROUPS: NoteGroup[] = [
  {
    id: 'adv-full',
    label: '全音区',
    sublabel: `C-b3 (大字组 ~ 小字三组) | 音符数量 ${ADV_NOTES.length}`,
    section: '全音区练习',
    notes: ADV_NOTES,
    difficulty: 'advanced',
    includeAccidentals: true,
  },
]

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const NOTE_GROUPS: NoteGroup[] = [
  ...BEGINNER_GROUPS,
  ...INTERMEDIATE_GROUPS,
  ...ADVANCED_GROUPS,
]

export function getGroupsByDifficulty(difficulty: Difficulty): NoteGroup[] {
  return NOTE_GROUPS.filter(g => g.difficulty === difficulty)
}

/** Compute the most representative octave from a group's notes */
export function groupPrimaryOctave(group: NoteGroup): number {
  if (group.notes.length === 0) return 4
  const counts = new Map<number, number>()
  for (const n of group.notes) {
    counts.set(n.octave, (counts.get(n.octave) ?? 0) + 1)
  }
  let best = 4, bestCount = 0
  for (const [oct, c] of counts) {
    if (c > bestCount) { best = oct; bestCount = c }
  }
  return best
}
