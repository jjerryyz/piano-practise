<template>
  <div class="piano-wrapper">
    <div class="octave-strip">
      <div
        v-for="oct in ALL_OCTAVES"
        :key="oct"
        :class="['oct-cell', { active: oct === activeOctave }]"
        @click="activeOctave = oct"
      >
        <div class="mini-piano">
          <span class="mini-w" v-for="i in 7" :key="i"></span>
        </div>
        <span class="oct-name">{{ octaveLabel(oct) }}</span>
      </div>
    </div>

    <div class="keyboard" ref="kbRef">
      <div
        v-for="wk in whiteKeys"
        :key="wk.midi"
        :class="['key white', { pressed: activePressedMidi === wk.midi }]"
        @pointerdown.prevent="onKeyDown(wk.midi)"
        @pointerup.prevent="onKeyUp"
        @pointerleave="onKeyUp"
      >
        <span class="key-label">{{ wk.label }}</span>
      </div>

      <div
        v-for="bk in blackKeys"
        :key="bk.midi"
        :class="['key black', { pressed: activePressedMidi === bk.midi }]"
        :style="{ left: bk.left }"
        @pointerdown.prevent="onKeyDown(bk.midi)"
        @pointerup.prevent="onKeyUp"
        @pointerleave="onKeyUp"
      >
        <span class="key-label">{{ bk.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { noteToMidi, noteDisplayName, type NoteLetter } from '../lib/musicTheory'

const emit = defineEmits<{
  (e: 'notePress', midi: number): void
}>()

const props = defineProps<{
  /** Octave to select initially */
  initialOctave?: number
  /** External pressed midi (e.g. from MIDI keyboard) */
  activeMidi?: number | null
}>()

const ALL_OCTAVES = [2, 3, 4, 5, 6]
const activeOctave = ref(props.initialOctave ?? 4)
const pressedKey = ref<number | null>(null)
const activePressedMidi = computed(() => pressedKey.value ?? props.activeMidi ?? null)

watch(() => props.initialOctave, (v) => {
  if (v !== undefined) activeOctave.value = v
})

interface WhiteKey { midi: number; label: string }
interface BlackKey { midi: number; label: string; left: string }

function octaveLabel(oct: number): string {
  const labels: Record<number, string> = {
    1: 'A₁', 2: 'C', 3: 'c', 4: 'c¹', 5: 'c²', 6: 'c³', 7: 'c⁴',
  }
  return labels[oct] ?? `${oct}`
}

const WHITE_LETTERS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const BLACK_DEFS: { letter: NoteLetter; whiteIndex: number }[] = [
  { letter: 'C', whiteIndex: 0 },
  { letter: 'D', whiteIndex: 1 },
  { letter: 'F', whiteIndex: 3 },
  { letter: 'G', whiteIndex: 4 },
  { letter: 'A', whiteIndex: 5 },
]

const whiteKeys = computed<WhiteKey[]>(() => {
  const oct = activeOctave.value
  return WHITE_LETTERS.map(l => ({
    midi: noteToMidi(l, oct, 'none'),
    label: noteDisplayName(l, oct, 'none'),
  }))
})

const blackKeys = computed<BlackKey[]>(() => {
  const oct = activeOctave.value
  const bkWidth = 8.5
  return BLACK_DEFS.map(def => {
    const boundary = ((def.whiteIndex + 1) / 7) * 100
    return {
      midi: noteToMidi(def.letter, oct, 'sharp'),
      label: noteDisplayName(def.letter, oct, 'sharp'),
      left: `${boundary - bkWidth / 2}%`,
    }
  })
})

function onKeyDown(midi: number) {
  pressedKey.value = midi
  emit('notePress', midi)
}

function onKeyUp() {
  pressedKey.value = null
}
</script>

<style scoped>
.piano-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  user-select: none;
  touch-action: manipulation;
}

/* ---- octave overview strip ---- */
.octave-strip {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.octave-strip::-webkit-scrollbar { display: none; }

.oct-cell {
  flex: 1 0 0;
  min-width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 4px 4px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  transition: all 0.15s;
}
.oct-cell.active {
  background: var(--primary);
  border-color: var(--primary);
}
.oct-cell.active .oct-name { color: #fff; }
.oct-cell.active .mini-w { background: rgba(255,255,255,.6); }

.mini-piano {
  display: flex;
  gap: 1px;
  height: 10px;
}
.mini-w {
  width: 5px;
  background: #cbd5e1;
  border-radius: 1px;
}

.oct-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1;
}

/* ---- main keyboard ---- */
.keyboard {
  position: relative;
  display: flex;
  height: 130px;
  padding: 0 2px;
}

.key {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  border-radius: 0 0 7px 7px;
  transition: background 0.06s;
  cursor: pointer;
}

.key.white {
  flex: 1;
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 0 1px;
  z-index: 1;
}
.key.white.pressed { background: #e0e7ff; }

.key.black {
  position: absolute;
  width: 8.5%;
  height: 55%;
  background: #1e293b;
  color: #fff;
  z-index: 2;
  border: 1px solid #0f172a;
}
.key.black .key-label { font-size: 10px; }
.key.black.pressed { background: #475569; }

.key-label {
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}
</style>
