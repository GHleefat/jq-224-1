<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Save,
  FolderOpen,
  Trash2,
  History,
  FileDown,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  X,
} from "lucide-vue-next";
import type { Screenshot, ScreenshotBatch, DiffResult } from "@/types";
import { useBatchStorage } from "@/composables/useBatchStorage";
import { generateDiffReport, downloadReport } from "@/utils/report";

interface Props {
  currentUrl: string;
  screenshots: Screenshot[];
  selectedIds: string[];
  diffResult: DiffResult | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "load-batch", batch: ScreenshotBatch): void;
}>();

const {
  batches,
  saveBatch,
  loadBatch: _loadBatch,
  deleteBatch,
  renameBatch,
  clearAll,
} = useBatchStorage();

const showHistory = ref(false);
const editingId = ref<string | null>(null);
const editName = ref("");

const hasScreenshots = computed(() => props.screenshots.length > 0);

function handleSave() {
  if (!hasScreenshots.value) return;
  saveBatch(props.currentUrl, props.screenshots);
}

function handleLoad(id: string) {
  const batch = _loadBatch(id);
  if (batch) {
    emit("load-batch", batch);
  }
}

function handleDelete(id: string) {
  if (confirm("确定删除此批次？")) {
    deleteBatch(id);
  }
}

function startRename(b: ScreenshotBatch) {
  editingId.value = b.id;
  editName.value = b.name;
}

function saveRename(id: string) {
  if (editName.value.trim()) {
    renameBatch(id, editName.value.trim());
  }
  editingId.value = null;
}

function handleExportReport() {
  if (props.screenshots.length === 0) return;

  const selectedScreenshots = props.selectedIds
    .map((id) => props.screenshots.find((s) => s.id === id))
    .filter((s): s is Screenshot => !!s);

  const diffResults = [];
  if (selectedScreenshots.length === 2 && props.diffResult) {
    diffResults.push({
      screenshot1: selectedScreenshots[0],
      screenshot2: selectedScreenshots[1],
      diff: props.diffResult,
    });
  }

  const html = generateDiffReport({
    batchName: `报告 ${new Date().toLocaleString("zh-CN")}`,
    url: props.currentUrl,
    createdAt: new Date().toLocaleString("zh-CN"),
    screenshots: props.screenshots.filter((s) => s.status === "success"),
    diffResults,
  });
  const filename = `diff-report-${Date.now()}.html`;
  downloadReport(html, filename);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN");
}
</script>

<template>
  <div
    class="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2"
  >
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-lg text-sm hover:bg-teal-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="!hasScreenshots"
      @click="handleSave"
    >
      <Save class="w-4 h-4" />
      保存批次
    </button>

    <button
      class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition"
      @click="showHistory = !showHistory"
    >
      <History class="w-4 h-4" />
      历史批次
      <ChevronDown v-if="!showHistory" class="w-3.5 h-3.5" />
      <ChevronUp v-else class="w-3.5 h-3.5" />
    </button>

    <button
      class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
      :disabled="!hasScreenshots"
      @click="handleExportReport"
    >
      <FileDown class="w-4 h-4" />
      导出报告
    </button>

    <div
      v-if="showHistory"
      class="absolute top-full left-0 right-0 z-20 bg-slate-900 border-b border-slate-800 shadow-xl max-h-80 overflow-y-auto"
    >
      <div
        v-if="batches.length === 0"
        class="p-8 text-center text-slate-500 text-sm"
      >
        暂无保存的批次
      </div>
      <div v-else class="divide-y divide-slate-800">
        <div
          v-for="batch in batches"
          :key="batch.id"
          class="p-3 hover:bg-slate-800/50 transition group"
        >
          <div class="flex items-center gap-3">
            <FolderOpen class="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div
                v-if="editingId !== batch.id"
                class="flex items-center gap-2"
              >
                <span class="text-sm font-medium text-slate-100 truncate">{{
                  batch.name
                }}</span>
                <span class="text-xs text-slate-500">
                  {{
                    batch.screenshots.filter((s) => s.status === "success")
                      .length
                  }}
                  张
                </span>
              </div>
              <input
                v-else
                v-model="editName"
                type="text"
                class="w-full px-2 py-1 bg-slate-800 text-slate-100 rounded border border-teal-500/50 text-sm focus:outline-none"
                @keydown.enter="saveRename(batch.id)"
                @keydown.escape="editingId = null"
              />
              <div
                class="text-xs text-slate-500 flex items-center gap-2 mt-0.5"
              >
                <span>{{ formatDate(batch.createdAt) }}</span>
                <span>·</span>
                <span class="truncate max-w-xs">{{ batch.url }}</span>
              </div>
            </div>
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
            >
              <template v-if="editingId !== batch.id">
                <button
                  class="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-teal-400"
                  title="加载"
                  @click="handleLoad(batch.id)"
                >
                  <FolderOpen class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                  title="重命名"
                  @click="startRename(batch)"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                  title="删除"
                  @click="handleDelete(batch.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </template>
              <template v-else>
                <button
                  class="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                  @click="editingId = null"
                >
                  <X class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 bg-teal-600 rounded text-white hover:bg-teal-500"
                  @click="saveRename(batch.id)"
                >
                  <Check class="w-4 h-4" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
