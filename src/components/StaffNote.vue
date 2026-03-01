<template>
  <div ref="containerRef" class="staff-note"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental as VexAccidental } from 'vexflow'
import type { Note } from '../lib/musicTheory'
import { noteToVexKey } from '../lib/musicTheory'

const props = defineProps<{
  notes: Note[]
  /** Index of the note currently being answered (highlighted) */
  activeIndex?: number
  keySignature?: number
}>()

const containerRef = ref<HTMLDivElement>()

function pickClef(notes: Note[]): string {
  if (notes.length === 0) return 'treble'
  const avgOctave = notes.reduce((s, n) => s + n.octave, 0) / notes.length
  return avgOctave <= 3 ? 'bass' : 'treble'
}

function durationForCount(count: number): string {
  if (count <= 1) return 'h'
  if (count <= 2) return 'h'
  if (count <= 4) return 'q'
  return '8'
}

function beatsForDuration(dur: string, count: number): number {
  const map: Record<string, number> = { 'h': 2, 'q': 1, '8': 0.5 }
  return (map[dur] ?? 1) * count
}

function render() {
  if (!containerRef.value || props.notes.length === 0) return
  containerRef.value.innerHTML = ''

  const width = containerRef.value.clientWidth || 320
  const height = 180

  const renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const clef = pickClef(props.notes)
  const staveX = 10
  const staveWidth = width - 20
  const stave = new Stave(staveX, 20, staveWidth)
  stave.addClef(clef)
  stave.setContext(context).draw()

  const dur = durationForCount(props.notes.length)
  const totalBeats = beatsForDuration(dur, props.notes.length)

  const staveNotes: StaveNote[] = props.notes.map((note, i) => {
    const vexKey = noteToVexKey(note)
    const sn = new StaveNote({ clef, keys: [vexKey], duration: dur })

    if (note.accidental === 'sharp') sn.addModifier(new VexAccidental('#'))
    else if (note.accidental === 'flat') sn.addModifier(new VexAccidental('b'))
    else if (note.accidental === 'natural') sn.addModifier(new VexAccidental('n'))

    const active = props.activeIndex ?? 0
    if (i < active) {
      sn.setStyle({ fillStyle: '#94a3b8', strokeStyle: '#94a3b8' })
    } else if (i === active) {
      sn.setStyle({ fillStyle: '#6366f1', strokeStyle: '#6366f1' })
    }

    return sn
  })

  const beatValue = dur === '8' ? 8 : dur === 'q' ? 4 : 4
  const voice = new Voice({ num_beats: totalBeats, beat_value: beatValue })
  voice.setStrict(false)
  for (const sn of staveNotes) voice.addTickable(sn)

  new Formatter().joinVoices([voice]).format([voice], staveWidth - 80)
  voice.draw(context, stave)
}

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})

watch(() => [props.notes, props.activeIndex], render, { deep: true })
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

.staff-note :deep(svg) {
  width: 100%;
  height: auto;
}
</style>
