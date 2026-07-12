<template>
  <div ref="containerRef" class="staff-note" :class="{ melody: isMelody }"></div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Accidental as VexAccidental,
  BarNote,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow'
import type { Note } from '../lib/musicTheory'
import { noteToVexKey } from '../lib/musicTheory'
import type { MelodyNote } from '../data/melodies'

const props = defineProps<{
  notes: Note[]
  /** Index of the note currently being answered (highlighted) */
  activeIndex?: number
  keySignature?: number
  layoutNotes?: MelodyNote[]
  timeSignature?: [number, number]
}>()

const containerRef = ref<HTMLDivElement>()
const isMelody = computed(() => !!props.layoutNotes && props.layoutNotes.length > 0)

function pickClef(notes: Note[]): string {
  if (notes.length === 0) return 'treble'
  const avgOctave = notes.reduce((s, n) => s + n.octave, 0) / notes.length
  return avgOctave <= 3 ? 'bass' : 'treble'
}

function durationForCount(count: number): string {
  if (count <= 2) return 'h'
  if (count <= 4) return 'q'
  return '8'
}

function beatsForDuration(dur: string, count: number): number {
  const map: Record<string, number> = { h: 2, q: 1, '8': 0.5 }
  return (map[dur] ?? 1) * count
}

function beatsToVexDuration(beats: number): { duration: string; dots: number } {
  const candidates: Array<{ beats: number; duration: string; dots: number }> = [
    { beats: 4, duration: 'w', dots: 0 },
    { beats: 3, duration: 'h', dots: 1 },
    { beats: 2, duration: 'h', dots: 0 },
    { beats: 1.5, duration: 'q', dots: 1 },
    { beats: 1, duration: 'q', dots: 0 },
    { beats: 0.75, duration: '8', dots: 1 },
    { beats: 0.5, duration: '8', dots: 0 },
    { beats: 0.25, duration: '16', dots: 0 },
  ]

  let best = candidates[0]!
  let bestDiff = Infinity
  for (const c of candidates) {
    const diff = Math.abs(c.beats - beats)
    if (diff < bestDiff) {
      best = c
      bestDiff = diff
    }
  }
  return { duration: best.duration, dots: best.dots }
}

function styleNote(sn: StaveNote, index: number) {
  const active = props.activeIndex ?? 0
  if (index < active) {
    sn.setStyle({ fillStyle: '#94a3b8', strokeStyle: '#94a3b8' })
  } else if (index === active) {
    sn.setStyle({ fillStyle: '#6366f1', strokeStyle: '#6366f1' })
  }
}

function applyAccidental(sn: StaveNote, note: Note) {
  if (note.accidental === 'sharp') sn.addModifier(new VexAccidental('#'))
  else if (note.accidental === 'flat') sn.addModifier(new VexAccidental('b'))
  else if (note.accidental === 'natural') sn.addModifier(new VexAccidental('n'))
}

function renderSimple() {
  if (!containerRef.value || props.notes.length === 0) return
  containerRef.value.innerHTML = ''

  const width = containerRef.value.clientWidth || 320
  const height = 180

  const renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const clef = pickClef(props.notes)
  const staveWidth = width - 20
  const stave = new Stave(10, 20, staveWidth)
  stave.addClef(clef)
  if (props.keySignature) stave.addKeySignature(String(props.keySignature))
  stave.setContext(context).draw()

  const dur = durationForCount(props.notes.length)
  const totalBeats = beatsForDuration(dur, props.notes.length)

  const staveNotes: StaveNote[] = props.notes.map((note, i) => {
    const sn = new StaveNote({ clef, keys: [noteToVexKey(note)], duration: dur })
    applyAccidental(sn, note)
    styleNote(sn, i)
    return sn
  })

  const beatValue = dur === '8' ? 8 : 4
  const voice = new Voice({ numBeats: totalBeats, beatValue })
  voice.setStrict(false)
  for (const sn of staveNotes) voice.addTickable(sn)

  new Formatter().joinVoices([voice]).format([voice], staveWidth - 80)
  voice.draw(context, stave)
}

function renderMelody() {
  if (!containerRef.value || !props.layoutNotes || props.notes.length === 0) return
  containerRef.value.innerHTML = ''

  const layout = props.layoutNotes
  const timeSignature = props.timeSignature ?? [4, 4]
  const clef = pickClef(props.notes)

  const tickables: Array<StaveNote | BarNote> = []
  let estimatedSlots = 0

  for (let i = 0; i < layout.length; i++) {
    const prev = layout[i - 1]
    const current = layout[i]!
    if (i > 0 && prev && current.barIndex !== prev.barIndex) {
      tickables.push(new BarNote())
      estimatedSlots += 0.4
    }

    const note = props.notes[i]
    if (!note) continue
    const { duration, dots } = beatsToVexDuration(current.durationBeats)
    const sn = new StaveNote({
      clef,
      keys: [noteToVexKey(note)],
      duration,
    })
    for (let d = 0; d < dots; d++) Dot.buildAndAttach([sn], { all: true })
    applyAccidental(sn, note)
    styleNote(sn, i)
    tickables.push(sn)
    estimatedSlots += 1
  }

  const width = Math.max(
    containerRef.value.clientWidth || 320,
    Math.ceil(estimatedSlots * 40) + 100,
  )
  const height = 200

  const renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const stave = new Stave(10, 30, width - 20)
  stave.addClef(clef)
  stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`)
  if (props.keySignature) stave.addKeySignature(String(props.keySignature))
  stave.setContext(context).draw()

  const totalBeats = layout.reduce((sum, n) => sum + n.durationBeats, 0)
  const voice = new Voice({ numBeats: Math.max(totalBeats, 1), beatValue: 4 })
  voice.setStrict(false)
  for (const tickable of tickables) voice.addTickable(tickable)

  new Formatter().joinVoices([voice]).format([voice], width - 110)
  voice.draw(context, stave)
}

function render() {
  if (isMelody.value) renderMelody()
  else renderSimple()
}

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})

watch(
  () => [props.notes, props.activeIndex, props.layoutNotes, props.timeSignature, props.keySignature],
  render,
  { deep: true },
)
</script>

<style scoped>
.staff-note {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.staff-note.melody {
  max-width: none;
  overflow-x: auto;
  justify-content: flex-start;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.staff-note :deep(svg) {
  width: 100%;
  height: auto;
}

.staff-note.melody :deep(svg) {
  width: auto;
  min-width: 100%;
}
</style>
