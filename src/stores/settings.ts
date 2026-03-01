import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type PracticeMode = 'count' | 'timer'

export const useSettingsStore = defineStore('settings', () => {
  const questionCount = ref(loadNum('questionCount', 7))
  const timerSeconds = ref(loadNum('timerSeconds', 60))
  const practiceMode = ref<PracticeMode>(loadStr('practiceMode', 'count') as PracticeMode)
  const keySignature = ref(loadNum('keySignature', 0))
  const includeAccidentals = ref(loadBool('includeAccidentals', false))

  function loadNum(key: string, fallback: number): number {
    const v = localStorage.getItem(`settings.${key}`)
    return v !== null ? Number(v) : fallback
  }
  function loadStr(key: string, fallback: string): string {
    return localStorage.getItem(`settings.${key}`) ?? fallback
  }
  function loadBool(key: string, fallback: boolean): boolean {
    const v = localStorage.getItem(`settings.${key}`)
    return v !== null ? v === 'true' : fallback
  }

  function persist(key: string, val: unknown) {
    localStorage.setItem(`settings.${key}`, String(val))
  }

  watch(questionCount, v => persist('questionCount', v))
  watch(timerSeconds, v => persist('timerSeconds', v))
  watch(practiceMode, v => persist('practiceMode', v))
  watch(keySignature, v => persist('keySignature', v))
  watch(includeAccidentals, v => persist('includeAccidentals', v))

  return { questionCount, timerSeconds, practiceMode, keySignature, includeAccidentals }
})
