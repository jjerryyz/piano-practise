/**
 * Write bundled public-domain single-melody MIDI fixtures from note lists.
 * Run: npx tsx scripts/generate-sample-midis.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { Midi } = require('@tonejs/midi') as typeof import('@tonejs/midi')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const midiDir = join(root, 'assets', 'midi')
const manifestPath = join(midiDir, 'manifest.json')

interface ManifestEntry {
  id: string
  file: string
  title: string
  source: string
  keySignature: number
  bpm: number
  timeSignature: [number, number]
}

/** Quarter-note relative pitches: midi + duration in quarter beats */
type SeqNote = { midi: number; beats: number }

const SEQUENCES: Record<string, SeqNote[]> = {
  twinkle: [
    { midi: 60, beats: 1 }, { midi: 60, beats: 1 }, { midi: 67, beats: 1 }, { midi: 67, beats: 1 },
    { midi: 69, beats: 1 }, { midi: 69, beats: 1 }, { midi: 67, beats: 2 },
    { midi: 65, beats: 1 }, { midi: 65, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 1 },
    { midi: 62, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 2 },
    { midi: 67, beats: 1 }, { midi: 67, beats: 1 }, { midi: 65, beats: 1 }, { midi: 65, beats: 1 },
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 62, beats: 2 },
    { midi: 67, beats: 1 }, { midi: 67, beats: 1 }, { midi: 65, beats: 1 }, { midi: 65, beats: 1 },
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 62, beats: 2 },
    { midi: 60, beats: 1 }, { midi: 60, beats: 1 }, { midi: 67, beats: 1 }, { midi: 67, beats: 1 },
    { midi: 69, beats: 1 }, { midi: 69, beats: 1 }, { midi: 67, beats: 2 },
    { midi: 65, beats: 1 }, { midi: 65, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 1 },
    { midi: 62, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 2 },
  ],
  'ode-to-joy': [
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 65, beats: 1 }, { midi: 67, beats: 1 },
    { midi: 67, beats: 1 }, { midi: 65, beats: 1 }, { midi: 64, beats: 1 }, { midi: 62, beats: 1 },
    { midi: 60, beats: 1 }, { midi: 60, beats: 1 }, { midi: 62, beats: 1 }, { midi: 64, beats: 1 },
    { midi: 64, beats: 1.5 }, { midi: 62, beats: 0.5 }, { midi: 62, beats: 2 },
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 65, beats: 1 }, { midi: 67, beats: 1 },
    { midi: 67, beats: 1 }, { midi: 65, beats: 1 }, { midi: 64, beats: 1 }, { midi: 62, beats: 1 },
    { midi: 60, beats: 1 }, { midi: 60, beats: 1 }, { midi: 62, beats: 1 }, { midi: 64, beats: 1 },
    { midi: 62, beats: 1.5 }, { midi: 60, beats: 0.5 }, { midi: 60, beats: 2 },
  ],
  'mary-lamb': [
    { midi: 64, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 1 }, { midi: 62, beats: 1 },
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 2 },
    { midi: 62, beats: 1 }, { midi: 62, beats: 1 }, { midi: 62, beats: 2 },
    { midi: 64, beats: 1 }, { midi: 67, beats: 1 }, { midi: 67, beats: 2 },
    { midi: 64, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 1 }, { midi: 62, beats: 1 },
    { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 1 },
    { midi: 62, beats: 1 }, { midi: 62, beats: 1 }, { midi: 64, beats: 1 }, { midi: 62, beats: 1 },
    { midi: 60, beats: 4 },
  ],
  'hot-cross-buns': [
    { midi: 64, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 2 },
    { midi: 64, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 2 },
    { midi: 60, beats: 0.5 }, { midi: 60, beats: 0.5 }, { midi: 60, beats: 0.5 }, { midi: 60, beats: 0.5 },
    { midi: 62, beats: 0.5 }, { midi: 62, beats: 0.5 }, { midi: 62, beats: 0.5 }, { midi: 62, beats: 0.5 },
    { midi: 64, beats: 1 }, { midi: 62, beats: 1 }, { midi: 60, beats: 2 },
  ],
  'lightly-row': [
    { midi: 67, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 2 },
    { midi: 65, beats: 1 }, { midi: 62, beats: 1 }, { midi: 62, beats: 2 },
    { midi: 60, beats: 1 }, { midi: 62, beats: 1 }, { midi: 64, beats: 1 }, { midi: 65, beats: 1 },
    { midi: 67, beats: 1 }, { midi: 67, beats: 1 }, { midi: 67, beats: 2 },
    { midi: 67, beats: 1 }, { midi: 64, beats: 1 }, { midi: 64, beats: 2 },
    { midi: 65, beats: 1 }, { midi: 62, beats: 1 }, { midi: 62, beats: 2 },
    { midi: 60, beats: 1 }, { midi: 64, beats: 1 }, { midi: 67, beats: 1 }, { midi: 67, beats: 1 },
    { midi: 60, beats: 4 },
  ],
}

function writeMelodyMidi(entry: ManifestEntry, sequence: SeqNote[]) {
  const midi = new Midi()
  midi.header.setTempo(entry.bpm)
  midi.header.timeSignatures = [{
    ticks: 0,
    timeSignature: [...entry.timeSignature],
  }]
  midi.header.update()
  midi.name = entry.title

  const track = midi.addTrack()
  track.name = entry.title

  let time = 0
  for (const note of sequence) {
    track.addNote({
      midi: note.midi,
      time,
      duration: note.beats * (60 / entry.bpm),
      velocity: 0.8,
    })
    time += note.beats * (60 / entry.bpm)
  }

  const outPath = join(midiDir, entry.file)
  writeFileSync(outPath, Buffer.from(midi.toArray()))
  console.log(`wrote ${entry.file} (${sequence.length} notes)`)
}

function main() {
  mkdirSync(midiDir, { recursive: true })
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestEntry[]

  for (const entry of manifest) {
    const sequence = SEQUENCES[entry.id]
    if (!sequence) {
      throw new Error(`No sample sequence defined for melody id "${entry.id}"`)
    }
    writeMelodyMidi(entry, sequence)
  }
}

main()
