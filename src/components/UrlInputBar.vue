<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Globe, AlertTriangle } from "lucide-vue-next";
import type { Screenshot } from "@/types";

interface Props {
  modelValue: string;
  isCapturing: boolean;
  enabledCount: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "capture"): void;
}>();

const url = computed({
  get: () => props.modelValue,
  set: (v: string) => emit("update:modelValue", v),
});

const exampleUrls = [
  "https://example.com",
  "https://vuejs.org",
  "https://tailwindcss.com",
];

function normalizeUrl(u: string): string {
  let s = u.trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s;
  }
  return s;
}

function submit() {
  url.value = normalizeUrl(url.value);
  if (url.value) {
    emit("capture");
  }
}

function useExample(u: string) {
  url.value = u;
}
</script>

<template>
  <div class="p-4 bg-slate-800/50 border-b border-slate-700/50">
    <div class="flex gap-3">
      <div class="relative flex-1">
        <Globe
          class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
        />
        <input
          v-model="url"
          type="url"
          class="input-field pl-11"
          placeholder="输入要截图的网址，例如 https://example.com"
          :disabled="isCapturing"
          @keydown.enter="submit"
        />
      </div>
      <button
        class="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
        :disabled="isCapturing || !url.trim() || enabledCount === 0"
        @click="submit"
      >
        <span
          v-if="isCapturing"
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        />
        {{ isCapturing ? "截图中..." : "开始截图" }}
      </button>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span class="text-xs text-slate-500">示例:</span>
      <button
        v-for="u in exampleUrls"
        :key="u"
        class="text-xs px-2.5 py-1 bg-slate-700/50 text-slate-400 rounded-md hover:bg-slate-700 hover:text-slate-200 transition"
        :disabled="isCapturing"
        @click="useExample(u)"
      >
        {{ u }}
      </button>
      <div
        v-if="enabledCount === 0"
        class="ml-auto flex items-center gap-1.5 text-xs text-amber-400"
      >
        <AlertTriangle class="w-3.5 h-3.5" />
        请先启用至少一个设备
      </div>
    </div>
  </div>
</template>
