<script setup lang="ts">
import { computed } from "vue";
import { Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-vue-next";
import type { Screenshot } from "@/types";

interface Props {
  screenshot: Screenshot;
  selected: boolean;
  selectIndex?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "toggle"): void;
}>();

const statusConfig = computed(() => {
  switch (props.screenshot.status) {
    case "loading":
      return {
        label: "加载中",
        color: "text-amber",
        icon: Loader2,
        spin: true,
      };
    case "success":
      return {
        label: "成功",
        color: "text-teal",
        icon: CheckCircle2,
        spin: false,
      };
    case "error":
      return {
        label: "失败",
        color: "text-red",
        icon: AlertCircle,
        spin: false,
      };
    default:
      return {
        label: "等待中",
        color: "text-slate",
        icon: Loader2,
        spin: false,
      };
  }
});

const aspectRatio = computed(() => {
  const { width, height } = props.screenshot;
  if (!width || !height) return "9 / 16";
  return `${width} / ${height}`;
});
</script>

<template>
  <div
    class="card card-hover cursor-pointer relative overflow-hidden animate-scale-in group"
    :class="{
      'ring-2 ring-teal-400 shadow-glow-teal': selected,
      'opacity-50':
        screenshot.status !== 'success' && screenshot.status !== 'loading',
    }"
    @click="emit('toggle')"
  >
    <div v-if="selected" class="absolute top-2 right-2 z-10">
      <div
        class="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-slate-900"
      >
        {{ selectIndex }}
      </div>
    </div>

    <div
      class="p-3 border-b border-slate-700/50 flex items-center justify-between"
    >
      <div class="flex items-center gap-2 min-w-0">
        <component
          :is="statusConfig.icon"
          class="w-4 h-4 flex-shrink-0"
          :class="[
            `${statusConfig.color}-400`,
            { 'animate-spin': statusConfig.spin },
          ]"
        />
        <span class="text-sm font-medium text-slate-100 truncate">{{
          screenshot.deviceName
        }}</span>
      </div>
      <span class="text-xs text-slate-500 flex-shrink-0"
        >{{ screenshot.width }}×{{ screenshot.height }}</span
      >
    </div>

    <div
      class="relative bg-slate-950 overflow-hidden"
      :style="{ aspectRatio: aspectRatio }"
    >
      <img
        v-if="screenshot.dataUrl"
        :src="screenshot.dataUrl"
        :alt="screenshot.deviceName"
        class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        loading="lazy"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <Loader2
            v-if="screenshot.status === 'loading'"
            class="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2"
          />
          <AlertCircle v-else class="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p class="text-xs text-slate-500">
            {{
              screenshot.status === "loading"
                ? "正在截图..."
                : screenshot.error || "无截图"
            }}
          </p>
        </div>
      </div>
      <div
        v-if="selected"
        class="absolute inset-0 bg-teal-500/10 pointer-events-none"
      />
    </div>

    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent h-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
    />
    <div
      v-if="selected"
      class="absolute bottom-2 left-2 text-xs font-medium bg-teal-500 text-white px-2 py-0.5 rounded"
    >
      已选中 #{{ selectIndex }}
    </div>
  </div>
</template>
