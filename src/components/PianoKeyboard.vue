<template>
  <div class="piano-wrapper">
    <div class="octave-tabs">
      <button
        v-for="oct in availableOctaves"
        :key="oct"
        :class="['octave-tab', { active: oct === activeOctave }]"
        @click="activeOctave = oct"
      >
        {{ octaveLabel(oct) }}
      </button>
    </div>
    <div class="keyboard">
      <div
        v-for="key in currentKeys"
        :key="key.midi"
        :class="['key', key.color, { pressed: pressedKey === key.midi }]"
        @pointerdown.prevent="onKeyDown(key.midi)"
        @pointerup.prevent="onKeyUp"
      >
        <span class="key-label">{{ key.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { noteToMidi, noteDisplayName, type NoteLetter } from '../lib/musicTheory'

const emit = defineEmits<{
  (e: 'notePress', midi: number): void
}>()

const props = defineProps<{
  /** Which octaves to show tabs for */
  octaves?: number[]
  /** Whether to show black keys */
  showAccidentals?: boolean
}>()

interface PianoKey {
  midi: number
  label: string
  color: 'white' | 'black'
}

const availableOctaves = computed(() => props.octaves ?? [3, 4, 5])
const activeOctave = ref(availableOctaves.value.includes(4) ? 4 : availableOctaves.value[0])
const pressedKey = ref<number | null>(null)

function octaveLabel(oct: number): string {
  const labels: Record<number, string> = {
    1: 'A₁', 2: 'C', 3: 'c', 4: 'c¹', 5: 'c²', 6: 'c³', 7: 'c⁴',
  }
  return labels[oct] ?? `${oct}`
}

const WHITE_NOTES: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_NOTES: { letter: NoteLetter; acc: 'sharp' }[] = [
  { letter: 'C', acc: 'sharp' },
  { letter: 'D', acc: 'sharp' },
  { letter: 'F', acc: 'sharp' },
  { letter: 'G', acc: 'sharp' },
  { letter: 'A', acc: 'sharp' },
]

const currentKeys = computed<PianoKey[]>(() => {
  const oct = activeOctave.value
  const keys: PianoKey[] = []

  for (const letter of WHITE_NOTES) {
    keys.push({
      midi: noteToMidi(letter, oct, 'none'),
      label: noteDisplayName(letter, oct, 'none'),
      color: 'white',
    })
  }

  if (props.showAccidentals !== false) {
    for (const bn of BLACK_NOTES) {
      keys.push({
        midi: noteToMidi(bn.letter, oct, 'sharp'),
        label: noteDisplayName(bn.letter, oct, 'sharp'),
        color: 'black',
      })
    }
  }

  return keys
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

.octave-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
}

.octave-tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--bg);
  border: 1.5px solid var(--border);
  white-space: nowrap;
  transition: all 0.15s;
}

.octave-tab.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.keyboard {
  position: relative;
  display: flex;
  height: 140px;
  padding: 0 4px;
}

.key {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
  border-radius: 0 0 8px 8px;
  transition: background 0.08s;
  cursor: pointer;
}

.key.white {
  flex: 1;
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 0 1px;
  z-index: 1;
}

.key.white.pressed {
  background: #e0e7ff;
}

.key.black {
  position: absolute;
  width: calc(100% / 7 * 0.58);
  height: 55%;
  background: #1e293b;
  color: #fff;
  z-index: 2;
  border: 1px solid #0f172a;
  font-size: 11px;
}

.key.black.pressed {
  background: #475569;
}

/* Position black keys */
.key.black:nth-child(8) { left: calc(100% / 7 * 1 - 100% / 7 * 0.29 + 4px); }
.key.black:nth-child(9) { left: calc(100% / 7 * 2 - 100% / 7 * 0.29 + 4px); }
.key.black:nth-child(10) { left: calc(100% / 7 * 4 - 100% / 7 * 0.29 + 4px); }
.key.black:nth-child(11) { left: calc(100% / 7 * 5 - 100% / 7 * 0.29 + 4px); }
.key.black:nth-child(12) { left: calc(100% / 7 * 6 - 100% / 7 * 0.29 + 4px); }

.key-label {
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}
</style>
