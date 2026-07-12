<template>
  <div class="page menu-page">
    <header class="page-header">
      <span class="title">识谱练习</span>
      <button class="settings-btn" @click="router.push('/settings')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </header>

    <div class="menu-body">
      <div class="mode-card note-card" @click="router.push('/note-practice')">
        <div class="mode-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <div class="mode-info">
          <h2 class="mode-title">单音练习</h2>
          <p class="mode-desc">识别五线谱上的音符，通过键盘作答</p>
        </div>
        <svg class="mode-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </div>

      <div class="mode-card note-name-card" @click="router.push('/note-name-practice')">
        <div class="mode-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
            <path d="M5 4h14v3H5z" opacity=".35" />
            <path d="M5 10h14v3H5z" opacity=".5" />
            <path d="M5 16h14v3H5z" opacity=".35" />
            <circle cx="10" cy="12" r="2.5" />
          </svg>
        </div>
        <div class="mode-info">
          <h2 class="mode-title">音名识别</h2>
          <p class="mode-desc">看五线谱音符，从 CDEFGAB 中选择音名</p>
        </div>
        <svg class="mode-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </div>

      <div class="mode-card melody-card" @click="router.push('/melody')">
        <div class="mode-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
            <path d="M4 19h16v2H4z" opacity=".35" />
            <path d="M7 8l3 2 4-5 3 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="7" cy="8" r="1.6" />
            <circle cx="10" cy="10" r="1.6" />
            <circle cx="14" cy="5" r="1.6" />
            <circle cx="17" cy="9" r="1.6" />
          </svg>
        </div>
        <div class="mode-info">
          <h2 class="mode-title">旋律章节</h2>
          <p class="mode-desc">随机抽取连续小节，按原旋律顺序逐音练习</p>
        </div>
        <svg class="mode-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </div>

      <div class="mode-card rhythm-card" @click="router.push('/rhythm')">
        <div class="mode-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
            <rect x="3" y="10" width="3" height="10" rx="1" />
            <rect x="8" y="6" width="3" height="14" rx="1" />
            <rect x="13" y="12" width="3" height="8" rx="1" />
            <rect x="18" y="4" width="3" height="16" rx="1" />
          </svg>
        </div>
        <div class="mode-info">
          <h2 class="mode-title">节奏训练</h2>
          <p class="mode-desc">跟随节拍器打出正确的节奏型</p>
        </div>
        <svg class="mode-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </div>

      <div class="mode-card metro-card" @click="router.push('/metronome')">
        <div class="mode-icon">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 1a3 3 0 0 0-3 3v8.1A5 5 0 1 0 14 17V4a3 3 0 0 0-3-3z" opacity=".3"/>
            <path d="M12 2c-1.1 0-2 .9-2 2v7.08A5.48 5.48 0 0 0 7 16a5 5 0 1 0 10 0 5.48 5.48 0 0 0-3-4.92V4c0-1.1-.9-2-2-2zm0 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            <rect x="11" y="3" width="2" height="8" rx="1" fill="#fff"/>
          </svg>
        </div>
        <div class="mode-info">
          <h2 class="mode-title">节拍器</h2>
          <p class="mode-desc">可调 BPM、拍号，支持点击测速</p>
        </div>
        <svg class="mode-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
      </div>

      <div class="quick-links">
        <button class="link-btn" @click="router.push('/wrong-book')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          错题本
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.menu-page {
  overflow-y: auto;
}

.settings-btn {
  position: absolute;
  right: 12px;
  padding: 6px;
  color: var(--text-secondary);
}

.menu-body {
  flex: 1;
  padding: 24px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 18px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.1s;
  color: #fff;
}
.mode-card:active { transform: scale(0.98); }

.note-card {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.note-name-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.35);
}

.melody-card {
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.35);
}

.rhythm-card {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}

.metro-card {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.mode-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-title {
  font-size: 19px;
  font-weight: 700;
}

.mode-desc {
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.4;
}

.mode-arrow {
  flex-shrink: 0;
}

.quick-links {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.link-btn {
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
