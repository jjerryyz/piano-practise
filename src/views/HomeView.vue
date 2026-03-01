<template>
  <div class="page">
    <header class="page-header">
      <span class="title">单音练习</span>
      <button class="settings-btn" @click="router.push('/settings')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
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
      <section v-if="commonGroups.length" class="group-section">
        <h3 class="section-title">常用音符</h3>
        <div
          v-for="group in commonGroups"
          :key="group.id"
          class="group-card"
          @click="startGroup(group)"
        >
          <div class="group-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--primary)">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <div class="group-info">
            <span class="group-label">{{ group.label }}</span>
            <span class="group-sublabel">{{ group.sublabel }}</span>
          </div>
          <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </section>

      <section v-if="otherGroups.length" class="group-section">
        <h3 class="section-title">其他音符</h3>
        <div
          v-for="group in otherGroups"
          :key="group.id"
          class="group-card"
          @click="startGroup(group)"
        >
          <div class="group-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--primary-light)">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <div class="group-info">
            <span class="group-label">{{ group.label }}</span>
            <span class="group-sublabel">{{ group.sublabel }}</span>
          </div>
          <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </section>

      <div class="bottom-actions">
        <button class="action-btn" @click="router.push('/wrong-book')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          错题本
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getGroupsByDifficulty, type Difficulty, type NoteGroup } from '../data/noteRanges'
import { usePracticeStore } from '../stores/practice'

const router = useRouter()
const practice = usePracticeStore()

const tabs = [
  { id: 'beginner' as Difficulty, label: '初级' },
  { id: 'intermediate' as Difficulty, label: '中级' },
  { id: 'advanced' as Difficulty, label: '高级' },
]

const activeDifficulty = ref<Difficulty>('beginner')

const allGroups = computed(() => getGroupsByDifficulty(activeDifficulty.value))

const commonGroups = computed(() => {
  const commonOctaves = [2, 3, 4, 5, 6]
  return allGroups.value.filter(g => commonOctaves.includes(g.octave))
})

const otherGroups = computed(() => {
  const commonOctaves = [2, 3, 4, 5, 6]
  return allGroups.value.filter(g => !commonOctaves.includes(g.octave))
})

function startGroup(group: NoteGroup) {
  practice.startPractice(group)
  router.push('/practice')
}
</script>

<style scoped>
.settings-btn {
  position: absolute;
  right: 12px;
  padding: 6px;
  color: var(--text-secondary);
}

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
  border-bottom-color: var(--primary);
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

.section-title:first-child {
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
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.bottom-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
</style>
