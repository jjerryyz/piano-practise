<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">错题本</span>
      <button v-if="wrongBook.records.length" class="clear-btn" @click="confirmClear">清空</button>
    </header>

    <section class="review-hero">
      <div>
        <p class="eyebrow">单音练习</p>
        <h2>遗忘曲线复习</h2>
        <p class="hero-desc">答错会进入错题本；复习答对后间隔逐步拉长，答错则回到立即复习。</p>
      </div>
      <button class="btn-primary review-btn" :disabled="wrongBook.dueRecords.length === 0" @click="startReview">
        复习 {{ wrongBook.dueRecords.length }} 题
      </button>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ wrongBook.reviewStats.due }}</span>
        <span class="stat-label">今日待复习</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ wrongBook.reviewStats.learning }}</span>
        <span class="stat-label">学习中</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ wrongBook.reviewStats.mastered }}</span>
        <span class="stat-label">已掌握</span>
      </div>
    </div>

    <div class="filter-row">
      <button
        v-for="status in statusOptions"
        :key="status.id"
        :class="['filter-tag', { active: selectedStatus === status.id }]"
        @click="selectedStatus = status.id"
      >{{ status.label }}</button>
    </div>

    <div class="filter-bar" v-if="groupOptions.length > 1">
      <button :class="['filter-tag', { active: selectedGroup === '' }]" @click="selectedGroup = ''">全部分组</button>
      <button
        v-for="opt in groupOptions"
        :key="opt.id"
        :class="['filter-tag', { active: selectedGroup === opt.id }]"
        @click="selectedGroup = opt.id"
      >{{ opt.label }}</button>
    </div>

    <div class="records-container">
      <div v-if="filteredRecords.length === 0" class="empty">
        <p>{{ emptyText }}</p>
      </div>

      <div
        v-for="record in filteredRecords"
        :key="record.id"
        class="record-card"
      >
        <div class="record-main">
          <div class="record-target">
            <span class="record-label">正确答案</span>
            <span class="record-note">{{ record.targetNote.displayName }}</span>
          </div>
          <div class="record-divider"></div>
          <div class="record-user">
            <span class="record-label">你的答案</span>
            <span class="record-note wrong">{{ record.userAnswerName }}</span>
          </div>
        </div>
        <div class="review-progress">
          <div class="progress-top">
            <span>{{ stageLabel(record.reviewLevel) }}</span>
            <span :class="['due-label', { due: isDue(record.dueAt) }]">{{ formatDue(record.dueAt) }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${progressPercent(record.reviewLevel)}%` }"></div>
          </div>
        </div>
        <div class="record-meta">
          <span>{{ practiceTypeLabel(record.practiceType) }} · {{ record.groupLabel }}</span>
          <span>错 {{ record.reviewWrongCount }} 次 / 对 {{ record.reviewCorrectCount }} 次</span>
          <span>{{ formatTime(record.timestamp) }}</span>
        </div>
        <button class="remove-btn" @click="wrongBook.removeRecord(record.id)">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import { useWrongBookStore, type PracticeType } from '../stores/wrongBook'

const router = useRouter()
const wrongBook = useWrongBookStore()
const practice = usePracticeStore()
const selectedGroup = ref('')
const selectedStatus = ref<'due' | 'all' | 'upcoming'>('due')

const statusOptions = [
  { id: 'due' as const, label: '待复习' },
  { id: 'all' as const, label: '全部错题' },
  { id: 'upcoming' as const, label: '未到期' },
]

const groupOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const r of wrongBook.records) {
    if (!seen.has(r.groupId)) seen.set(r.groupId, r.groupLabel)
  }
  return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
})

const filteredRecords = computed(() => {
  const now = Date.now()
  const byStatus = wrongBook.records.filter(record => {
    if (selectedStatus.value === 'due') return record.dueAt <= now
    if (selectedStatus.value === 'upcoming') return record.dueAt > now
    return true
  })
  const byGroup = selectedGroup.value
    ? byStatus.filter(r => r.groupId === selectedGroup.value)
    : byStatus
  return byGroup.sort((a, b) => a.dueAt - b.dueAt || b.timestamp - a.timestamp)
})

const emptyText = computed(() => {
  if (wrongBook.records.length === 0) return '暂无错题'
  if (selectedStatus.value === 'due') return '当前没有到期错题'
  if (selectedStatus.value === 'upcoming') return '暂无未到期错题'
  return '暂无错题记录'
})

function practiceTypeLabel(type: PracticeType): string {
  return type === 'melody-section' ? '旋律章节' : '单音练习'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isDue(ts: number): boolean {
  return ts <= Date.now()
}

function formatDue(ts: number): string {
  const diff = ts - Date.now()
  if (diff <= 0) return '现在复习'
  const minutes = Math.ceil(diff / 60000)
  if (minutes < 60) return `${minutes} 分钟后`
  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `${hours} 小时后`
  return `${Math.ceil(hours / 24)} 天后`
}

function stageLabel(level: number): string {
  if (level <= 0) return '新错题'
  if (level <= 2) return `第 ${level} 阶复习`
  if (level <= 5) return `巩固中 ${level}/6`
  return '已掌握'
}

function progressPercent(level: number): number {
  return Math.min(100, Math.round((level / 6) * 100))
}

function startReview() {
  if (practice.startWrongBookReview()) {
    router.push('/practice')
  }
}

function confirmClear() {
  if (confirm('确定清空所有错题记录？')) {
    wrongBook.clearAll()
  }
}
</script>

<style scoped>
.clear-btn {
  position: absolute;
  right: 12px;
  font-size: 14px;
  color: var(--danger);
  padding: 6px;
}

.review-hero {
  margin: 16px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.28);
}

.eyebrow {
  font-size: 12px;
  opacity: 0.78;
  margin-bottom: 4px;
}

.review-hero h2 {
  font-size: 22px;
  line-height: 1.2;
  margin-bottom: 8px;
}

.hero-desc {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.88;
}

.review-btn {
  width: 100%;
  margin-top: 16px;
  background: #fff;
  color: var(--primary);
}

.review-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: var(--radius);
  background: var(--bg-card);
  box-shadow: var(--shadow);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.filter-row,
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
  flex-shrink: 0;
}

.filter-bar {
  padding-top: 0;
}

.filter-tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  white-space: nowrap;
}

.filter-tag.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.records-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 32px;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px 0;
  font-size: 15px;
}

.record-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
  margin-bottom: 10px;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-target, .record-user {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.record-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-note {
  font-size: 22px;
  font-weight: 700;
  color: var(--success);
}

.record-note.wrong {
  color: var(--danger);
}

.record-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
}

.record-meta {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.review-progress {
  margin-top: 14px;
}

.progress-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.due-label.due {
  color: var(--warning);
  font-weight: 600;
}

.progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef2ff;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), var(--success));
}

.remove-btn {
  display: block;
  margin: 8px auto 0;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 12px;
}
</style>
