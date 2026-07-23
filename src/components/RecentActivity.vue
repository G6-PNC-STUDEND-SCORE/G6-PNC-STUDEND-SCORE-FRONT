<template>
  <div :class="['act-card', { 'act-dark': dark }]">
    <div class="act-header">
      <div class="act-header-left">
        <div v-if="iconName" class="act-header-icon">
          <component :is="iconComponent" :size="14" />
        </div>
        <div>
          <h3 class="act-title">{{ title }}</h3>
          <p class="act-count" v-if="items.length">{{ items.length }} activities</p>
        </div>
      </div>
      <button v-if="items.length" class="act-view-btn" @click="$emit('viewAll')">
        View all
        <ChevronRight :size="13" />
      </button>
    </div>

    <div class="act-divider"></div>

    <div v-if="items.length === 0" class="act-empty">
      <div class="act-empty-icon">
        <Inbox :size="20" />
      </div>
      <p class="act-empty-text">{{ emptyText }}</p>
    </div>

    <TransitionGroup v-else name="act-item" tag="div" class="act-list">
      <div
        v-for="(item, i) in visibleItems"
        :key="item.id"
        :class="['act-item', { 'act-item-last': i === visibleItems.length - 1 }]"
      >
        <div class="act-dot-wrap">
          <div class="act-dot" :style="{ background: item.dotColor }">
            <component :is="iconMap[item.icon as string]" :size="10" class="act-dot-icon" />
          </div>
          <div v-if="i < visibleItems.length - 1" class="act-line"></div>
        </div>

        <span class="act-text">{{ item.label }}</span>

        <span class="act-time">{{ item.time }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Inbox, PenLine, UserPlus, FileText, Award, Plus, Pencil, Trash2, LogIn, LogOut, Activity, GraduationCap } from '@lucide/vue'

export interface ActivityItem {
  id: string | number
  label: string
  meta?: string
  time: string
  icon?: string
  dotColor: string
}

const props = withDefaults(defineProps<{
  title: string
  items: ActivityItem[]
  maxItems?: number
  iconName?: string
  emptyText?: string
  dark?: boolean
}>(), {
  maxItems: 5,
  emptyText: 'No recent activities',
  dark: false,
  iconName: '',
})

defineEmits<{
  viewAll: []
}>()

const iconMap: Record<string, any> = {
  PenLine, UserPlus, FileText, Award, Plus, Pencil, Trash2, LogIn, LogOut, Activity, GraduationCap,
}

const iconComponent = computed(() => {
  if (!props.iconName) return null
  return iconMap[props.iconName] || Activity
})

const visibleItems = computed(() =>
  props.items.slice(0, props.maxItems)
)
</script>

<style scoped>
.act-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  padding: 1.25rem 1.25rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(15,23,42,0.03);
  transition: all 0.3s ease;
}

.act-card:hover {
  box-shadow: 0 4px 16px rgba(59,130,246,0.08), 0 12px 40px rgba(15,23,42,0.06);
  border-color: rgba(59,130,246,0.15);
}

.act-dark {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.4);
}

.act-dark:hover {
  border-color: rgba(96, 165, 250, 0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.act-dark .act-title { color: #f1f5f9; }
.act-dark .act-count { color: #64748b; }
.act-dark .act-text { color: #e2e8f0; }
.act-dark .act-time { background: rgba(71,85,105,0.4); color: #94a3b8; }
.act-dark .act-divider { background: rgba(71,85,105,0.4); }
.act-dark .act-line { background: rgba(71,85,105,0.3); }
.act-dark .act-empty-text { color: #64748b; }
.act-dark .act-empty-icon { color: #475569; }

.act-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.15rem;
}

.act-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.act-header-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.act-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.act-count {
  font-size: 0.68rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.3;
}

.act-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.act-view-btn:hover {
  background: rgba(59,130,246,0.08);
}

.act-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.6rem 0 0.5rem;
}

.act-empty {
  padding: 1.5rem 0;
  text-align: center;
}

.act-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(148,163,184,0.08);
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.act-empty-text {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
}

.act-list {
  display: flex;
  flex-direction: column;
}

.act-item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.55rem 0;
  transition: background 0.2s;
  border-radius: 8px;
  margin: 0 -0.5rem;
  padding: 0.55rem 0.5rem;
}

.act-item:hover {
  background: rgba(0,0,0,0.02);
}

.act-dark .act-item:hover {
  background: rgba(255,255,255,0.03);
}

.act-item-last {
  padding-bottom: 0;
}

.act-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 24px;
}

.act-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  color: #fff;
}

.act-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: #e2e8f0;
  border-radius: 1px;
  margin-top: 2px;
}

.act-text {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.act-time {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Transition animations */
.act-item-enter-active {
  transition: all 0.3s ease;
}

.act-item-leave-active {
  transition: all 0.25s ease;
}

.act-item-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.act-item-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.act-item-move {
  transition: transform 0.3s ease;
}
</style>
