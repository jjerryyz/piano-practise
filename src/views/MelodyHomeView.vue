<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">旋律章节</span>
    </header>

    <div class="body">
      <section class="hero-card">
        <h2>随机章节练习</h2>
        <p>从内置旋律中随机抽取连续小节，按原顺序逐音弹奏。暂不判定节奏。</p>

        <div class="bars-row">
          <span class="bars-label">每次小节数</span>
          <div class="bars-options">
            <button
              v-for="n in barsOptions"
              :key="n"
              :class="['bars-btn', { active: barsPerSection === n }]"
              @click="barsPerSection = n"
            >{{ n }}</button>
          </div>
        </div>

        <button class="btn-primary start-btn" @click="start">开始随机章节</button>
      </section>

      <section class="list-section">
        <h3 class="section-title">曲目库</h3>
        <div v-for="melody in melodies" :key="melody.id" class="melody-card">
          <div class="melody-info">
            <span class="melody-title">{{ melody.title }}</span>
            <span class="melody-meta">
              {{ melody.barCount }} 小节 · {{ melody.timeSignature[0] }}/{{ melody.timeSignature[1] }} · {{ melody.notes.length }} 音
            </span>
            <span class="melody-source">{{ melody.source }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BARS_PER_SECTION_OPTIONS,
  DEFAULT_BARS_PER_SECTION,
  getMelodies,
} from '../data/melodies'
import { usePracticeStore } from '../stores/practice'

const router = useRouter()
const practice = usePracticeStore()
const melodies = getMelodies()
const barsOptions = BARS_PER_SECTION_OPTIONS
const barsPerSection = ref<number>(DEFAULT_BARS_PER_SECTION)

function start() {
  practice.startMelodyPractice(barsPerSection.value)
  router.push('/melody/practice')
}
</script>

<style scoped>
.body {
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-card h2 {
  font-size: 20px;
  font-weight: 700;
}

.hero-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.bars-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.bars-label {
  font-size: 14px;
  font-weight: 600;
}

.bars-options {
  display: flex;
  gap: 8px;
}

.bars-btn {
  min-width: 44px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  font-weight: 600;
  color: var(--text-secondary);
}

.bars-btn.active {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(99, 102, 241, 0.08);
}

.start-btn {
  margin-top: 8px;
  width: 100%;
  height: 44px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.melody-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin-bottom: 10px;
}

.melody-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.melody-title {
  font-size: 16px;
  font-weight: 600;
}

.melody-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.melody-source {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.85;
}
</style>
