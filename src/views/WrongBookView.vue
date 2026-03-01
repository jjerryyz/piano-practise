<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">错题本</span>
      <button v-if="wrongBook.records.length" class="clear-btn" @click="confirmClear">清空</button>
    </header>

    <div class="filter-bar" v-if="groupOptions.length > 1">
      <button
        :class="['filter-tag', { active: selectedGroup === '' }]"
        @click="selectedGroup = ''"
      >全部</button>
      <button
        v-for="opt in groupOptions"
        :key="opt.id"
        :class="['filter-tag', { active: selectedGroup === opt.id }]"
        @click="selectedGroup = opt.id"
      >{{ opt.label }}</button>
    </div>

    <div class="records-container">
      <div v-if="filteredRecords.length === 0" class="empty">
        <p>暂无错题记录</p>
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
        <div class="record-meta">
          <span>{{ record.groupLabel }}</span>
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
import { useWrongBookStore } from '../stores/wrongBook'

const router = useRouter()
const wrongBook = useWrongBookStore()
const selectedGroup = ref('')

const groupOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const r of wrongBook.records) {
    if (!seen.has(r.groupId)) seen.set(r.groupId, r.groupLabel)
  }
  return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
})

const filteredRecords = computed(() => {
  const all = [...wrongBook.records].reverse()
  if (!selectedGroup.value) return all
  return all.filter(r => r.groupId === selectedGroup.value)
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  flex-shrink: 0;
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
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.remove-btn {
  display: block;
  margin: 8px auto 0;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 12px;
}
</style>
