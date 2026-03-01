<template>
  <div ref="containerRef" class="staff-note"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental as VexAccidental } from 'vexflow'
import type { Note } from '../lib/musicTheory'
import { noteToVexKey } from '../lib/musicTheory'

const props = defineProps<{
  note: Note | null
  keySignature?: number
}>()

const containerRef = ref<HTMLDivElement>()
let renderer: InstanceType<typeof Renderer> | null = null

function getClef(note: Note): string {
  return note.octave <= 3 ? 'bass' : 'treble'
}

function render() {
  if (!containerRef.value || !props.note) return

  containerRef.value.innerHTML = ''

  const width = containerRef.value.clientWidth || 320
  const height = 180

  renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const clef = getClef(props.note)
  const staveX = 10
  const staveWidth = width - 20
  const stave = new Stave(staveX, 20, staveWidth)
  stave.addClef(clef)
  stave.setContext(context).draw()

  const vexKey = noteToVexKey(props.note)
  const staveNote = new StaveNote({
    clef,
    keys: [vexKey],
    duration: 'h',
  })

  if (props.note.accidental === 'sharp') {
    staveNote.addModifier(new VexAccidental('#'))
  } else if (props.note.accidental === 'flat') {
    staveNote.addModifier(new VexAccidental('b'))
  } else if (props.note.accidental === 'natural') {
    staveNote.addModifier(new VexAccidental('n'))
  }

  const voice = new Voice({ num_beats: 2, beat_value: 4 })
  voice.setStrict(false)
  voice.addTickable(staveNote)

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

watch(() => props.note, render, { deep: true })
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
