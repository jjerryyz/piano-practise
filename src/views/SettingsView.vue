<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/')">&lt;</button>
      <span class="title">设置</span>
    </header>

    <div class="settings-container">
      <section class="settings-group">
        <h3 class="group-title">练习模式</h3>
        <div class="radio-group">
          <label class="radio-item" :class="{ active: settings.practiceMode === 'count' }">
            <input type="radio" v-model="settings.practiceMode" value="count" />
            <span>固定题量</span>
          </label>
          <label class="radio-item" :class="{ active: settings.practiceMode === 'timer' }">
            <input type="radio" v-model="settings.practiceMode" value="timer" />
            <span>倒计时</span>
          </label>
        </div>
      </section>

      <section class="settings-group" v-if="settings.practiceMode === 'count'">
        <h3 class="group-title">每组题量</h3>
        <div class="option-chips">
          <button
            v-for="n in countOptions"
            :key="n"
            :class="['chip', { active: settings.questionCount === n }]"
            @click="settings.questionCount = n"
          >{{ n }}题</button>
        </div>
      </section>

      <section class="settings-group" v-if="settings.practiceMode === 'timer'">
        <h3 class="group-title">倒计时时长</h3>
        <div class="option-chips">
          <button
            v-for="s in timerOptions"
            :key="s"
            :class="['chip', { active: settings.timerSeconds === s }]"
            @click="settings.timerSeconds = s"
          >{{ s }}秒</button>
        </div>
      </section>

      <section class="settings-group">
        <h3 class="group-title">每题音符数</h3>
        <div class="option-chips">
          <button
            v-for="n in notesPerOptions"
            :key="n"
            :class="['chip', { active: settings.notesPerQuestion === n }]"
            @click="settings.notesPerQuestion = n"
          >{{ n }}个</button>
        </div>
        <p class="hint">设为 1 即为单音练习，多个音符会依次显示在五线谱上</p>
      </section>

      <section class="settings-group">
        <h3 class="group-title">调号</h3>
        <div class="option-chips wrap">
          <button
            v-for="ks in keySignatureOptions"
            :key="ks.value"
            :class="['chip', { active: settings.keySignature === ks.value }]"
            @click="settings.keySignature = ks.value"
          >{{ ks.label }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { KEY_SIGNATURES } from '../lib/musicTheory'

const router = useRouter()
const settings = useSettingsStore()

const notesPerOptions = [1, 2, 3, 4, 5]
const countOptions = [5, 7, 10, 15, 20]
const timerOptions = [30, 60, 90, 120]
const keySignatureOptions = KEY_SIGNATURES.filter(ks => Math.abs(ks.value) <= 4)
</script>

<style scoped>
.settings-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 32px;
}

.settings-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.radio-group {
  display: flex;
  gap: 10px;
}

.radio-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.radio-item input {
  display: none;
}

.radio-item.active {
  border-color: var(--primary);
  background: #eef2ff;
  color: var(--primary);
}

.option-chips {
  display: flex;
  gap: 8px;
}

.option-chips.wrap {
  flex-wrap: wrap;
}

.chip {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  transition: all 0.15s;
}

.chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
