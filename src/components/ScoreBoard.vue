<template>
  <div class="score-board">
    <div class="score-item">
      <span class="label">{{ isTimerMode ? '剩余' : '进度' }}</span>
      <span class="value">{{ isTimerMode ? formatTime(timerRemaining) : `${questionIndex}/${totalQuestions}` }}</span>
    </div>
    <div class="score-item">
      <span class="label">正确率</span>
      <span class="value">{{ accuracy }}%</span>
    </div>
    <div class="score-item">
      <span class="label">连续</span>
      <span class="value streak">{{ streak }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  questionIndex: number
  totalQuestions: number
  accuracy: number
  streak: number
  isTimerMode: boolean
  timerRemaining: number
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped>
.score-board {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: var(--text-secondary);
}

.value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.streak {
  color: var(--primary);
}
</style>
