<template>
  <transition name="feedback">
    <div v-if="visible" :class="['feedback-toast', correct ? 'correct' : 'wrong']">
      {{ correct ? '正确!' : '错误' }}
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  correct: boolean
}>()
</script>

<style scoped>
.feedback-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 40px;
  border-radius: 16px;
  font-size: 22px;
  font-weight: 700;
  z-index: 100;
  pointer-events: none;
}

.correct {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
  border: 2px solid var(--success);
}

.wrong {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  border: 2px solid var(--danger);
}

.feedback-enter-active {
  animation: pop 0.3s ease-out;
}
.feedback-leave-active {
  animation: pop 0.2s ease-in reverse;
}

@keyframes pop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
</style>
