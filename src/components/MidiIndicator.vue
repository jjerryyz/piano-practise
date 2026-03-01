<template>
  <div v-if="status !== 'unsupported'" class="midi-indicator" :class="status" :title="tooltip">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 2h6v6H9z" />
      <path d="M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
      <circle cx="8" cy="15" r="1.5" fill="currentColor" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      <circle cx="16" cy="15" r="1.5" fill="currentColor" />
    </svg>
    <span v-if="showLabel" class="midi-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MidiStatus } from '../composables/useMidi'

const props = defineProps<{
  status: MidiStatus
  deviceName?: string | null
  showLabel?: boolean
}>()

const label = computed(() => {
  switch (props.status) {
    case 'connected': return props.deviceName ?? 'MIDI'
    case 'disconnected': return '无MIDI'
    case 'pending': return '检测中…'
    case 'denied': return 'MIDI被拒绝'
    default: return ''
  }
})

const tooltip = computed(() => {
  switch (props.status) {
    case 'connected': return `MIDI已连接: ${props.deviceName ?? 'Unknown'}`
    case 'disconnected': return '未检测到MIDI设备'
    case 'pending': return '正在检测MIDI设备…'
    case 'denied': return 'MIDI权限被拒绝'
    default: return ''
  }
})
</script>

<style scoped>
.midi-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  transition: all 0.2s;
}

.midi-indicator.connected {
  background: #dcfce7;
  color: #16a34a;
}

.midi-indicator.disconnected {
  background: #f1f5f9;
  color: #94a3b8;
}

.midi-indicator.pending {
  background: #fef3c7;
  color: #d97706;
}

.midi-indicator.denied {
  background: #fee2e2;
  color: #ef4444;
}

.midi-label {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
