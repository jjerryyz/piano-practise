<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">节奏训练</span>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeDifficulty === tab.id }]"
        @click="activeDifficulty = tab.id"
      >{{ tab.label }}</button>
    </div>

    <div class="groups-container">
      <section v-for="sec in sections" :key="sec.title" class="group-section">
        <h3 class="section-title">{{ sec.title }}</h3>
        <div
          v-for="pattern in sec.patterns"
          :key="pattern.id"
          class="group-card"
          @click="startPattern(pattern)"
        >
          <div class="group-icon rhythm-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#f59e0b">
              <rect x="4" y="10" width="3" height="10" rx="1" />
              <rect x="9" y="6" width="3" height="14" rx="1" />
              <rect x="14" y="12" width="3" height="8" rx="1" />
            </svg>
          </div>
          <div class="group-info">
            <span class="group-label">{{ pattern.label }}</span>
            <span class="group-sublabel">{{ pattern.sublabel }} | BPM {{ pattern.bpm }}</span>
          </div>
          <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getRhythmByDifficulty, type RhythmDifficulty, type RhythmPattern } from '../data/rhythmPatterns'
import { useRhythmStore } from '../stores/rhythm'

const router = useRouter()
const rhythm = useRhythmStore()

const tabs = [
  { id: 'beginner' as RhythmDifficulty, label: '初级' },
  { id: 'intermediate' as RhythmDifficulty, label: '中级' },
  { id: 'advanced' as RhythmDifficulty, label: '高级' },
]

const activeDifficulty = ref<RhythmDifficulty>('beginner')

interface Section { title: string; patterns: RhythmPattern[] }

const sections = computed<Section[]>(() => {
  const patterns = getRhythmByDifficulty(activeDifficulty.value)
  const map = new Map<string, RhythmPattern[]>()
  for (const p of patterns) {
    const arr = map.get(p.section) ?? []
    arr.push(p)
    map.set(p.section, arr)
  }
  return Array.from(map.entries()).map(([title, patterns]) => ({ title, patterns }))
})

function startPattern(pattern: RhythmPattern) {
  rhythm.preparePattern(pattern)
  router.push('/rhythm/practice')
}
</script>

<style scoped>
.tabs {
  display: flex;
  padding: 16px 20px 0;
  gap: 0;
  background: var(--bg-card);
}

.tab {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: var(--text);
  border-bottom-color: #f59e0b;
  font-weight: 600;
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 16px 0 8px 4px;
}

.group-section:first-child .section-title {
  margin-top: 0;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius);
  margin-bottom: 8px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.1s;
}

.group-card:active {
  transform: scale(0.98);
}

.group-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rhythm-icon {
  background: #fef3c7;
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.group-label {
  font-size: 16px;
  font-weight: 600;
}

.group-sublabel {
  font-size: 13px;
  color: var(--text-secondary);
}

.arrow {
  flex-shrink: 0;
}
</style>
