<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Camera, Sidebar, SidebarOpen } from "lucide-vue-next";
import DeviceConfig from "@/components/DeviceConfig.vue";
import UrlInputBar from "@/components/UrlInputBar.vue";
import ScreenshotGrid from "@/components/ScreenshotGrid.vue";
import ComparisonView from "@/components/ComparisonView.vue";
import BatchManager from "@/components/BatchManager.vue";
import type { ScreenshotBatch } from "@/types";
import { useDevices } from "@/composables/useDevices";
import { useScreenshots } from "@/composables/useScreenshots";
import { useCompare } from "@/composables/useCompare";

const { enabledDevices } = useDevices();
const {
  screenshots,
  isCapturing,
  currentProgress,
  progressPercent,
  currentUrl,
  captureAll,
  setScreenshots,
  clearScreenshots,
} = useScreenshots();
const {
  selectedIds,
  selectedScreenshots,
  compareVisible,
  compareMode,
  sensitivity,
  diffResult,
  isComparing,
  setSourceScreenshots,
  toggleSelection,
  clearSelection,
  isSelected,
  openCompare,
  closeCompare,
  setMode,
  setSensitivity,
  runComparison,
} = useCompare();

const url = ref("https://example.com");
const sidebarOpen = ref(true);

watch(
  screenshots,
  (newVal) => {
    setSourceScreenshots(newVal);
  },
  { immediate: true, deep: true },
);

const enabledCount = computed(() => enabledDevices.value.length);

async function handleCapture() {
  clearSelection();
  await captureAll(url.value, enabledDevices.value);
}

function handleLoadBatch(batch: ScreenshotBatch) {
  url.value = batch.url;
  setScreenshots(batch.screenshots);
  clearSelection();
}
</script>

<template>
  <div
    class="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
  >
    <header
      class="flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-glow-teal"
        >
          <Camera class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-100 tracking-tight">
            多分辨率截图对比器
          </h1>
          <p class="text-xs text-slate-500">Screenshot Comparison Tool</p>
        </div>
      </div>
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
        @click="sidebarOpen = !sidebarOpen"
        title="切换侧栏"
      >
        <Sidebar v-if="sidebarOpen" class="w-5 h-5" />
        <SidebarOpen v-else class="w-5 h-5" />
      </button>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      <aside
        class="flex-shrink-0 transition-all duration-300 overflow-hidden"
        :class="sidebarOpen ? 'w-72' : 'w-0'"
      >
        <DeviceConfig />
      </aside>

      <main class="flex-1 flex flex-col min-w-0 relative">
        <UrlInputBar
          v-model="url"
          :is-capturing="isCapturing"
          :enabled-count="enabledCount"
          @capture="handleCapture"
        />
        <BatchManager
          :current-url="currentUrl || url"
          :screenshots="screenshots"
          :selected-ids="selectedIds"
          :diff-result="diffResult"
          @load-batch="handleLoadBatch"
        />
        <ScreenshotGrid
          :screenshots="screenshots"
          :selected-ids="selectedIds"
          :is-capturing="isCapturing"
          :current-progress="currentProgress"
          :progress-percent="progressPercent"
          @toggle-select="toggleSelection"
          @open-compare="openCompare"
          @clear-selection="clearSelection"
        />
      </main>
    </div>

    <ComparisonView
      :visible="compareVisible"
      :screenshots="screenshots"
      :selected-ids="selectedIds"
      @close="closeCompare"
      @clear-selection="clearSelection"
    />
  </div>
</template>
