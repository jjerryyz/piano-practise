/**
 * Smoke-check melody conversion invariants and random section generation.
 * Run: npx tsx scripts/verify-melody.ts
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getMelodies,
  listPossibleSections,
  sliceMelodySection,
} from '../src/data/melodies'
import { generateMelodySectionQuestion } from '../src/lib/questionGenerator'

const require = createRequire(import.meta.url)
const assert = require('node:assert/strict') as typeof import('node:assert/strict')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function main() {
  const melodies = getMelodies()
  assert.ok(melodies.length >= 1, 'expected bundled melodies')

  for (const melody of melodies) {
    assert.ok(melody.notes.length > 0, `${melody.id} has notes`)
    assert.ok(melody.barCount > 0, `${melody.id} has bars`)

    let prevBeat = -1
    for (const note of melody.notes) {
      assert.ok(note.startBeat >= prevBeat, `${melody.id} notes must be ordered`)
      assert.equal(
        note.barIndex,
        Math.floor(note.startBeat / melody.timeSignature[0] + 1e-6),
        `${melody.id} barIndex mismatch at beat ${note.startBeat}`,
      )
      prevBeat = note.startBeat
    }

    for (const bars of [2, 4]) {
      const sections = listPossibleSections(melody, bars)
      for (const section of sections) {
        assert.ok(section.startBar >= 0)
        assert.ok(section.endBar < melody.barCount)
        assert.ok(section.endBar >= section.startBar)
        assert.equal(section.melodyId, melody.id)
        assert.ok(section.notes.every(n => n.barIndex >= section.startBar && n.barIndex <= section.endBar))

        // Preserve original order
        const original = melody.notes.filter(
          n => n.barIndex >= section.startBar && n.barIndex <= section.endBar,
        )
        assert.deepEqual(
          section.notes.map(n => n.midi),
          original.map(n => n.midi),
        )
      }
    }

    // Never crosses melody: slice at last bars stays inside
    const endSection = sliceMelodySection(melody, melody.barCount, 2)
    assert.ok(endSection)
    assert.ok(endSection!.endBar < melody.barCount)
  }

  // Random generator preserves order and stays in one melody
  for (let i = 0; i < 40; i++) {
    const q = generateMelodySectionQuestion(2)
    assert.ok(q.melody)
    assert.ok(q.targetNotes.length === q.melody!.layoutNotes.length)
    assert.deepEqual(
      q.targetNotes.map(n => n.midi),
      q.melody!.layoutNotes.map(n => n.midi),
    )
    const ids = new Set(q.melody!.layoutNotes.map(() => q.melody!.melodyId))
    assert.equal(ids.size, 1)
  }

  // Exclude previous section when alternatives exist
  const first = generateMelodySectionQuestion(2)
  const second = generateMelodySectionQuestion(2, {
    exclude: { melodyId: first.melody!.melodyId, startBar: first.melody!.startBar },
  })
  const totalSections = melodies.reduce((n, m) => n + listPossibleSections(m, 2).length, 0)
  if (totalSections > 1) {
    assert.ok(
      second.melody!.melodyId !== first.melody!.melodyId
      || second.melody!.startBar !== first.melody!.startBar,
      'should avoid repeating the exact previous section when possible',
    )
  }

  console.log(`ok: ${melodies.length} melodies verified from ${root}`)
}

main()
