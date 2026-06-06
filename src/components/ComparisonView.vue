<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  X,
  GitCompare,
  Columns,
  Layers,
  Sliders,
  Loader2,
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-vue-next";
import type { Screenshot, DiffResult, CompareMode } from "@/types";
import { compareImages } from "@/utils/diff";

interface Props {
  visible: boolean;
  screenshots: Screenshot[];
  selectedIds: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "clear-selection"): void;
}>();

const mode = ref<CompareMode>("side-by-side");
const sensitivity = ref(0.1);
const overlayOpacity = ref(50);
const diffResult = ref<DiffResult | null>(null);
const isComparing = ref(false);
const errorMessage = ref("");

const selectedScreenshots = computed(() => {
  return props.selectedIds
    .map((id) => props.screenshots.find((s) => s.id === id))
    .filter((s): s is Screenshot => !!s);
});

watch(
  () => [props.visible, props.selectedIds, sensitivity.value],
  async () => {
    if (props.visible && selectedScreenshots.value.length === 2) {
      await runComparison();
    }
  },
  { immediate: true },
);

async function runComparison() {
  if (selectedScreenshots.value.length !== 2) return;
  isComparing.value = true;
  errorMessage.value = "";
  diffResult.value = null;
  try {
    const [a, b] = selectedScreenshots.value;
    diffResult.value = await compareImages(a.dataUrl, b.dataUrl, {
      threshold: sensitivity.value,
    });
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "对比失败";
  } finally {
    isComparing.value = false;
  }
}

function handleClose() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm animate-fade-in flex flex-col"
    >
      <div
        class="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800"
      >
        <div class="flex items-center gap-3">
          <GitCompare class="w-6 h-6 text-teal-400" />
          <h2 class="text-lg font-semibold text-slate-100">截图对比</h2>
          <div
            v-if="selectedScreenshots.length === 2"
            class="flex items-center gap-2 text-sm text-slate-400 ml-4"
          >
            <span class="px-2 py-0.5 bg-slate-800 rounded">{{
              selectedScreenshots[0].deviceName
            }}</span>
            <span class="text-slate-600">vs</span>
            <span class="px-2 py-0.5 bg-slate-800 rounded">{{
              selectedScreenshots[1].deviceName
            }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition"
              :class="
                mode === 'side-by-side'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="mode = 'side-by-side'"
            >
              <Columns class="w-4 h-4" />
              并排
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition"
              :class="
                mode === 'overlay'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              "
              @click="mode = 'overlay'"
            >
              <Layers class="w-4 h-4" />
              重叠
            </button>
          </div>

          <div class="flex items-center gap-3">
            <Sliders class="w-4 h-4 text-slate-500" />
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">敏感度</span>
              <input
                v-model.number="sensitivity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-32 accent-teal-500"
              />
              <span class="text-xs text-slate-400 font-mono w-10"
                >{{ (sensitivity * 100).toFixed(0) }}%</span
              >
            </div>
          </div>

          <button
            class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            @click="handleClose"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        v-if="diffResult"
        class="flex items-center gap-6 px-6 py-3 bg-slate-900/50 border-b border-slate-800"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">差异像素</span>
          <span class="text-sm font-semibold text-red-400 font-mono">
            {{ diffResult.diffPixels.toLocaleString() }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">差异率</span>
          <span
            class="text-sm font-semibold font-mono"
            :class="
              diffResult.diffPercentage > 5
                ? 'text-red-400'
                : diffResult.diffPercentage > 1
                  ? 'text-amber-400'
                  : 'text-teal-400'
            "
          >
            {{ diffResult.diffPercentage.toFixed(3) }}%
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">差异区域</span>
          <span class="text-sm font-semibold text-slate-200 font-mono">
            {{ diffResult.diffRegions.length }}
          </span>
        </div>
        <a
          v-if="diffResult.diffDataUrl"
          :href="diffResult.diffDataUrl"
          download="diff.png"
          class="ml-auto flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition"
        >
          <Download class="w-4 h-4" />
          下载差异图
        </a>
      </div>

      <div class="flex-1 overflow-auto p-6">
        <div
          v-if="selectedScreenshots.length !== 2"
          class="h-full flex items-center justify-center"
        >
          <div class="text-center">
            <AlertCircle class="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p class="text-slate-400">请选择两张截图进行对比</p>
          </div>
        </div>

        <div
          v-else-if="isComparing"
          class="h-full flex items-center justify-center"
        >
          <div class="text-center">
            <Loader2
              class="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4"
            />
            <p class="text-slate-400">正在分析像素差异...</p>
          </div>
        </div>

        <div
          v-else-if="errorMessage"
          class="h-full flex items-center justify-center"
        >
          <div class="text-center">
            <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p class="text-red-400">{{ errorMessage }}</p>
          </div>
        </div>

        <template v-else>
          <div v-if="mode === 'side-by-side'" class="h-full">
            <div class="grid grid-cols-2 gap-6 h-full">
              <div class="flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-slate-300">
                    A · {{ selectedScreenshots[0].deviceName }}
                  </span>
                  <span class="text-xs text-slate-500">
                    {{ selectedScreenshots[0].width }}×{{
                      selectedScreenshots[0].height
                    }}
                  </span>
                </div>
                <div
                  class="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-auto p-4 flex items-start justify-center"
                >
                  <img
                    :src="selectedScreenshots[0].dataUrl"
                    class="max-w-full h-auto rounded shadow-2xl"
                  />
                </div>
              </div>

              <div class="flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-slate-300">
                    B · {{ selectedScreenshots[1].deviceName }}
                  </span>
                  <span class="text-xs text-slate-500">
                    {{ selectedScreenshots[1].width }}×{{
                      selectedScreenshots[1].height
                    }}
                  </span>
                </div>
                <div
                  class="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-auto p-4 flex items-start justify-center"
                >
                  <img
                    :src="selectedScreenshots[1].dataUrl"
                    class="max-w-full h-auto rounded shadow-2xl"
                  />
                </div>
              </div>
            </div>

            <div v-if="diffResult?.diffDataUrl" class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <span
                  class="text-sm font-medium text-red-400 flex items-center gap-2"
                >
                  <span class="w-2 h-2 rounded-full bg-red-500" />
                  差异高亮图
                </span>
              </div>
              <div
                class="bg-slate-950 rounded-xl border border-red-500/30 overflow-auto p-4 flex items-start justify-center"
              >
                <img
                  :src="diffResult.diffDataUrl"
                  class="max-w-full h-auto rounded shadow-2xl"
                />
              </div>
            </div>
          </div>

          <div v-else class="h-full">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-slate-300">
                  重叠模式
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">叠加透明度</span>
                  <input
                    v-model.number="overlayOpacity"
                    type="range"
                    min="0"
                    max="100"
                    class="w-32 accent-teal-500"
                  />
                  <span class="text-xs text-slate-400 font-mono w-8"
                    >{{ overlayOpacity }}%</span
                  >
                </div>
              </div>
            </div>
            <div
              class="bg-slate-950 rounded-xl border border-slate-800 overflow-auto p-4"
            >
              <div
                v-if="diffResult?.diffDataUrl"
                class="relative inline-block mx-auto max-w-full"
              >
                <img
                  :src="selectedScreenshots[0].dataUrl"
                  class="max-w-full h-auto rounded shadow-2xl block"
                />
                <img
                  :src="selectedScreenshots[1].dataUrl"
                  class="absolute inset-0 max-w-full h-auto rounded shadow-2xl block pointer-events-none"
                  :style="{ opacity: overlayOpacity / 100 }"
                />
              </div>
              <div
                v-else-if="diffResult"
                class="flex items-start justify-center"
              >
                <img
                  :src="diffResult.diffDataUrl"
                  class="max-w-full h-auto rounded shadow-2xl"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
