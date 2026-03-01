<template>
  <div ref="containerRef" class="rhythm-staff"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow'
import type { RhythmBeat } from '../data/rhythmPatterns'

const props = defineProps<{
  beats: RhythmBeat[]
  timeSignature: [number, number]
  /** Flat index of the current beat being played */
  activeIndex: number
}>()

const containerRef = ref<HTMLDivElement>()

function vexDuration(beat: RhythmBeat): string {
  let d = beat.duration
  if (beat.isRest) d += 'r'
  return d
}

function render() {
  if (!containerRef.value || props.beats.length === 0) return
  containerRef.value.innerHTML = ''

  const width = containerRef.value.clientWidth || 340
  const height = 140

  const renderer = new Renderer(containerRef.value, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const staveWidth = width - 20
  const stave = new Stave(10, 15, staveWidth)
  stave.addTimeSignature(`${props.timeSignature[0]}/${props.timeSignature[1]}`)
  stave.setContext(context).draw()

  const totalBeats = props.beats.reduce((s, b) => s + b.beats, 0)

  const staveNotes = props.beats.map((beat, i) => {
    const key = beat.isRest ? 'b/4' : 'b/4'
    const sn = new StaveNote({
      clef: 'percussion',
      keys: [key],
      duration: vexDuration(beat),
    })

    if (i < props.activeIndex) {
      sn.setStyle({ fillStyle: '#94a3b8', strokeStyle: '#94a3b8' })
    } else if (i === props.activeIndex) {
      sn.setStyle({ fillStyle: '#f59e0b', strokeStyle: '#f59e0b' })
    }

    return sn
  })

  const voice = new Voice({ num_beats: totalBeats, beat_value: props.timeSignature[1] })
  voice.setStrict(false)
  for (const sn of staveNotes) voice.addTickable(sn)

  new Formatter().joinVoices([voice]).format([voice], staveWidth - 70)
  voice.draw(context, stave)
}

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})

watch(() => [props.beats, props.activeIndex], render, { deep: true })
</script>

<style scoped>
.rhythm-staff {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rhythm-staff :deep(svg) {
  width: 100%;
  height: auto;
}
</style>
