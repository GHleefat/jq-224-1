<script setup lang="ts">
import { computed } from "vue";
import { ImageOff, GitCompare, X } from "lucide-vue-next";
import ScreenshotCard from "./ScreenshotCard.vue";
import type { Screenshot } from "@/types";

interface Props {
  screenshots: Screenshot[];
  selectedIds: string[];
  isCapturing: boolean;
  currentProgress: string;
  progressPercent: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "toggle-select", id: string): void;
  (e: "open-compare"): void;
  (e: "clear-selection"): void;
}>();

const selectedWithIndex = computed(() => {
  const map = new Map<string, number>();
  props.selectedIds.forEach((id, idx) => map.set(id, idx + 1));
  return map;
});

const canCompare = computed(() => props.selectedIds.length === 2);
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      v-if="screenshots.length > 0"
      class="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50"
    >
      <div class="flex items-center gap-4">
        <div class="text-sm text-slate-400">
          共
          <span class="text-teal-400 font-semibold">{{
            screenshots.length
          }}</span>
          张截图
        </div>
        <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-slate-400"
            >已选 {{ selectedIds.length }}/2</span
          >
          <button
            class="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
            @click="emit('clear-selection')"
          >
            <X class="w-3 h-3" /> 清空
          </button>
        </div>
      </div>
      <button
        v-if="canCompare"
        class="btn-primary flex items-center gap-2 text-sm py-1.5"
        @click="emit('open-compare')"
      >
        <GitCompare class="w-4 h-4" />
        开始对比
      </button>
    </div>

    <div
      v-if="isCapturing"
      class="px-4 py-3 bg-teal-500/10 border-b border-teal-500/30"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-teal-300">{{ currentProgress }}</span>
        <span class="text-sm text-teal-400 font-mono"
          >{{ Math.round(progressPercent) }}%</span
        >
      </div>
      <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <div
      v-if="screenshots.length === 0 && !isCapturing"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center py-20">
        <ImageOff class="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h3 class="text-xl text-slate-400 mb-2">暂无截图</h3>
        <p class="text-sm text-slate-600">输入网址并点击开始截图</p>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-4">
      <div
        class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        <ScreenshotCard
          v-for="s in screenshots"
          :key="s.id"
          :screenshot="s"
          :selected="selectedIds.includes(s.id)"
          :select-index="selectedWithIndex.get(s.id)"
          @toggle="emit('toggle-select', s.id)"
        />
      </div>
    </div>
  </div>
</template>
