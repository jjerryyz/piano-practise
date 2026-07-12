<template>
  <div class="piano-wrapper">
    <div class="octave-strip">
      <div
        v-for="oct in ALL_OCTAVES"
        :key="oct"
        :class="['oct-cell', { active: oct === activeOctave }]"
        @click="scrollToOctave(oct, true)"
      >
        <div class="mini-piano">
          <span class="mini-w" v-for="i in 7" :key="`m-${oct}-${i}`"></span>
        </div>
        <span class="oct-name">{{ octaveLabel(oct) }}</span>
      </div>
    </div>

    <div ref="scrollRef" class="keyboard-scroll" @scroll="onScroll">
      <div
        class="keyboard-track"
        :style="{ width: `${trackWidth}px`, marginLeft: `${trackOffset}px` }"
      >
        <div class="white-row">
          <div
            v-for="wk in whiteKeys"
            :key="wk.midi"
            :class="['key white', { pressed: activePressedMidi === wk.midi }]"
            @pointerdown.prevent="onPointerDown($event, wk.midi)"
            @pointermove.prevent="onPointerMove"
            @pointerup.prevent="onPointerUp"
            @pointercancel.prevent="onPointerCancel"
            @pointerleave="onPointerCancel"
          >
            <span class="key-label">{{ wk.label }}</span>
          </div>
        </div>

        <div
          v-for="bk in blackKeys"
          :key="bk.midi"
          :class="['key black', { pressed: activePressedMidi === bk.midi }]"
          :style="{ left: `${bk.leftPx}px` }"
          @pointerdown.prevent="onPointerDown($event, bk.midi)"
          @pointermove.prevent="onPointerMove"
          @pointerup.prevent="onPointerUp"
          @pointercancel.prevent="onPointerCancel"
          @pointerleave="onPointerCancel"
        >
          <span class="key-label">{{ bk.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
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

const ALL_OCTAVES = [2, 3, 4, 5, 6] as const
const WHITE_KEY_WIDTH = 44
const BLACK_KEY_WIDTH = 26
const KEYS_PER_OCTAVE = 7

const activeOctave = ref(props.initialOctave ?? 4)
const pressedKey = ref<number | null>(null)
const activePressedMidi = computed(() => pressedKey.value ?? props.activeMidi ?? null)
const scrollRef = ref<HTMLDivElement>()
/** Extra left inset used only when the full keyboard fits in the viewport. */
const trackOffset = ref(0)

interface WhiteKey { midi: number; label: string }
interface BlackKey { midi: number; label: string; leftPx: number }

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
  const result: WhiteKey[] = []
  for (const oct of ALL_OCTAVES) {
    for (const l of WHITE_LETTERS) {
      result.push({
        midi: noteToMidi(l, oct, 'none'),
        // Match the octave-strip labels so C / c / c¹ line up visually.
        label: l === 'C' ? octaveLabel(oct) : '',
      })
    }
  }
  return result
})

const blackKeys = computed<BlackKey[]>(() => {
  const result: BlackKey[] = []
  for (let octIdx = 0; octIdx < ALL_OCTAVES.length; octIdx++) {
    const oct = ALL_OCTAVES[octIdx]
    if (oct === undefined) continue
    for (const def of BLACK_DEFS) {
      const globalWhiteIdx = octIdx * KEYS_PER_OCTAVE + def.whiteIndex
      const boundaryX = (globalWhiteIdx + 1) * WHITE_KEY_WIDTH
      result.push({
        midi: noteToMidi(def.letter, oct, 'sharp'),
        label: noteDisplayName(def.letter, oct, 'sharp'),
        leftPx: boundaryX - BLACK_KEY_WIDTH / 2,
      })
    }
  }
  return result
})

const trackWidth = computed(() => whiteKeys.value.length * WHITE_KEY_WIDTH)

function clampOctave(oct: number): number {
  const first = ALL_OCTAVES[0] ?? 2
  const last = ALL_OCTAVES[ALL_OCTAVES.length - 1] ?? 6
  return Math.min(last, Math.max(first, oct))
}

function updateTrackOffset() {
  const scroller = scrollRef.value
  if (!scroller) return
  const extra = scroller.clientWidth - trackWidth.value
  trackOffset.value = extra > 0 ? Math.floor(extra / 2) : 0
}

function octaveStartLeft(oct: number): number {
  const base = ALL_OCTAVES[0] ?? 2
  return (clampOctave(oct) - base) * KEYS_PER_OCTAVE * WHITE_KEY_WIDTH
}

function scrollToOctave(oct: number, smooth = false) {
  const target = clampOctave(oct)
  activeOctave.value = target
  const scroller = scrollRef.value
  if (!scroller) return
  updateTrackOffset()
  // When the full keyboard fits, centering already shows every octave.
  if (trackOffset.value > 0) return
  scroller.scrollTo({
    left: octaveStartLeft(target),
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function syncActiveFromScroll() {
  const scroller = scrollRef.value
  if (!scroller || trackOffset.value > 0) return
  // Use the left edge of the viewport so the highlighted octave matches
  // the C-label that just entered from the left (and strip clicks).
  const leftIdx = Math.max(0, Math.floor((scroller.scrollLeft + 2) / WHITE_KEY_WIDTH))
  const base = ALL_OCTAVES[0] ?? 2
  activeOctave.value = clampOctave(base + Math.floor(leftIdx / KEYS_PER_OCTAVE))
}

function onScroll() {
  syncActiveFromScroll()
}

const DRAG_THRESHOLD = 8
let downX = 0
let downY = 0
let pendingMidi: number | null = null
let dragged = false

function onPointerDown(e: PointerEvent, midi: number) {
  downX = e.clientX
  downY = e.clientY
  pendingMidi = midi
  dragged = false
  pressedKey.value = midi
}

function onPointerMove(e: PointerEvent) {
  if (pendingMidi === null) return
  const dx = e.clientX - downX
  const dy = e.clientY - downY
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
    dragged = true
    pressedKey.value = null
  }
}

function onPointerUp() {
  if (pendingMidi !== null && !dragged) {
    emit('notePress', pendingMidi)
  }
  pressedKey.value = null
  pendingMidi = null
  dragged = false
}

function onPointerCancel() {
  pressedKey.value = null
  pendingMidi = null
  dragged = false
}

watch(() => props.initialOctave, (v) => {
  if (v !== undefined) {
    nextTick(() => scrollToOctave(v))
  }
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateTrackOffset()
    scrollToOctave(props.initialOctave ?? 4)
  })

  const scroller = scrollRef.value
  if (scroller && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateTrackOffset()
      scrollToOctave(activeOctave.value)
    })
    resizeObserver.observe(scroller)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.piano-wrapper {
  width: 100%;
  max-width: 100%;
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
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 2px 4px;
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
  width: 4px;
  background: #cbd5e1;
  border-radius: 1px;
}

.oct-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1;
  white-space: nowrap;
}

/* ---- full keyboard ---- */
.keyboard-scroll {
  /* Left-aligned scroll container: avoid flex centering, which breaks
     scrollLeft math and black-key alignment on varying phone widths. */
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  padding-bottom: 2px;
  width: 100%;
}

.keyboard-track {
  position: relative;
  height: 130px;
  flex: 0 0 auto;
  /* Prevent subpixel layout from shrinking keys on narrow screens */
  min-width: max-content;
}

.white-row {
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  position: relative;
  z-index: 1;
  width: max-content;
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
  position: relative;
  box-sizing: border-box;
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  flex: 0 0 44px;
  background: #fff;
  border: 1px solid #d1d5db;
  z-index: 1;
}
.key.white.pressed { background: #e0e7ff; }

.key.black {
  position: absolute;
  top: 0;
  box-sizing: border-box;
  width: 26px;
  height: 55%;
  background: #1e293b;
  color: #fff;
  z-index: 5;
  border: 1px solid #0f172a;
  /* Black keys are labels for accidentals; keep text readable but light */
  padding-bottom: 4px;
}
.key.black .key-label {
  font-size: 9px;
  opacity: 0.85;
  white-space: nowrap;
}
.key.black.pressed { background: #475569; }

.key-label {
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  line-height: 1.1;
}
</style>
