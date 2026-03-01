export type RhythmDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface RhythmBeat {
  /** VexFlow duration: 'w'=whole, 'h'=half, 'q'=quarter, '8'=eighth, '16'=sixteenth */
  duration: string
  isRest: boolean
  /** Duration in beats (quarter note = 1) */
  beats: number
}

export interface RhythmPattern {
  id: string
  label: string
  sublabel: string
  section: string
  difficulty: RhythmDifficulty
  timeSignature: [number, number]
  bpm: number
  bars: RhythmBeat[][]
}

function b(duration: string, beats: number, isRest = false): RhythmBeat {
  return { duration, beats, isRest }
}

const Q = () => b('q', 1)
const H = () => b('h', 2)
const W = () => b('w', 4)
const E = () => b('8', 0.5)
const S = () => b('16', 0.25)
const QR = () => b('q', 1, true)
const HR = () => b('h', 2, true)
const ER = () => b('8', 0.5, true)

// ---------------------------------------------------------------------------
// Beginner patterns
// ---------------------------------------------------------------------------

const BEGINNER: RhythmPattern[] = [
  {
    id: 'beg-quarter',
    label: '四分音符',
    sublabel: '稳定的四拍',
    section: '基础节奏',
    difficulty: 'beginner',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [Q(), Q(), Q(), Q()],
      [Q(), Q(), Q(), Q()],
    ],
  },
  {
    id: 'beg-half',
    label: '二分音符',
    sublabel: '每拍持续两拍',
    section: '基础节奏',
    difficulty: 'beginner',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [H(), H()],
      [H(), H()],
    ],
  },
  {
    id: 'beg-mix-qh',
    label: '四分 + 二分',
    sublabel: '混合练习',
    section: '基础节奏',
    difficulty: 'beginner',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [Q(), Q(), H()],
      [H(), Q(), Q()],
    ],
  },
  {
    id: 'beg-whole',
    label: '全音符',
    sublabel: '持续四拍',
    section: '基础节奏',
    difficulty: 'beginner',
    timeSignature: [4, 4],
    bpm: 72,
    bars: [
      [W()],
      [W()],
    ],
  },
  {
    id: 'beg-rest-q',
    label: '含四分休止符',
    sublabel: '注意休止',
    section: '带休止符',
    difficulty: 'beginner',
    timeSignature: [4, 4],
    bpm: 76,
    bars: [
      [Q(), QR(), Q(), Q()],
      [Q(), Q(), QR(), Q()],
    ],
  },
]

// ---------------------------------------------------------------------------
// Intermediate patterns
// ---------------------------------------------------------------------------

const INTERMEDIATE: RhythmPattern[] = [
  {
    id: 'int-eighth',
    label: '八分音符',
    sublabel: '均匀的八分音符',
    section: '八分音符',
    difficulty: 'intermediate',
    timeSignature: [4, 4],
    bpm: 88,
    bars: [
      [E(), E(), E(), E(), E(), E(), E(), E()],
      [E(), E(), E(), E(), E(), E(), E(), E()],
    ],
  },
  {
    id: 'int-eighth-quarter',
    label: '八分 + 四分',
    sublabel: '混合节奏型',
    section: '八分音符',
    difficulty: 'intermediate',
    timeSignature: [4, 4],
    bpm: 84,
    bars: [
      [E(), E(), Q(), E(), E(), Q()],
      [Q(), E(), E(), Q(), Q()],
    ],
  },
  {
    id: 'int-rest-eighth',
    label: '含八分休止',
    sublabel: '后半拍起',
    section: '休止符进阶',
    difficulty: 'intermediate',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [ER(), E(), Q(), ER(), E(), Q()],
      [Q(), ER(), E(), ER(), E(), Q()],
    ],
  },
  {
    id: 'int-synco-1',
    label: '切分节奏 1',
    sublabel: '短-长-短',
    section: '切分节奏',
    difficulty: 'intermediate',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [E(), E(), Q(), E(), E(), Q()],
      [Q(), E(), E(), H()],
    ],
  },
  {
    id: 'int-rest-half',
    label: '含二分休止',
    sublabel: '长休止',
    section: '休止符进阶',
    difficulty: 'intermediate',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [H(), HR()],
      [Q(), Q(), HR()],
    ],
  },
]

// ---------------------------------------------------------------------------
// Advanced patterns
// ---------------------------------------------------------------------------

const ADVANCED: RhythmPattern[] = [
  {
    id: 'adv-sixteenth',
    label: '十六分音符',
    sublabel: '快速均分',
    section: '十六分音符',
    difficulty: 'advanced',
    timeSignature: [4, 4],
    bpm: 72,
    bars: [
      [S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S(), S()],
    ],
  },
  {
    id: 'adv-16-8-mix',
    label: '十六分 + 八分',
    sublabel: '混合细分',
    section: '十六分音符',
    difficulty: 'advanced',
    timeSignature: [4, 4],
    bpm: 76,
    bars: [
      [S(), S(), E(), S(), S(), E(), E(), E(), E(), E()],
      [E(), S(), S(), E(), E(), S(), S(), S(), S(), Q()],
    ],
  },
  {
    id: 'adv-synco-2',
    label: '切分节奏 2',
    sublabel: '复杂切分',
    section: '综合节奏',
    difficulty: 'advanced',
    timeSignature: [4, 4],
    bpm: 84,
    bars: [
      [E(), Q(), E(), Q(), Q()],
      [Q(), E(), Q(), E(), Q()],
    ],
  },
  {
    id: 'adv-complex',
    label: '综合节奏',
    sublabel: '多种时值混合',
    section: '综合节奏',
    difficulty: 'advanced',
    timeSignature: [4, 4],
    bpm: 80,
    bars: [
      [Q(), E(), E(), H()],
      [E(), E(), Q(), E(), E(), Q()],
      [H(), Q(), QR()],
    ],
  },
]

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  ...BEGINNER,
  ...INTERMEDIATE,
  ...ADVANCED,
]

export function getRhythmByDifficulty(difficulty: RhythmDifficulty): RhythmPattern[] {
  return RHYTHM_PATTERNS.filter(p => p.difficulty === difficulty)
}
