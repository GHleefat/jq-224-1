import { ref } from "vue";
import type { ScreenshotBatch, Screenshot } from "@/types";

const STORAGE_KEY = "screenshot-compare:batches";

const batches = ref<ScreenshotBatch[]>([]);
const isLoaded = ref(false);

function loadFromStorage(): ScreenshotBatch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches.value));
  } catch (err) {
    console.error("保存失败，可能超出存储限制", err);
  }
}

export function useBatchStorage() {
  if (!isLoaded.value) {
    batches.value = loadFromStorage();
    isLoaded.value = true;
  }

  function saveBatch(
    url: string,
    screenshotList: Screenshot[],
    name?: string,
  ): ScreenshotBatch {
    const batch: ScreenshotBatch = {
      id: `batch-${Date.now()}`,
      name: name || `批次 ${new Date().toLocaleString("zh-CN")}`,
      url,
      createdAt: new Date().toISOString(),
      screenshots: JSON.parse(JSON.stringify(screenshotList)),
    };
    batches.value.unshift(batch);
    saveToStorage();
    return batch;
  }

  function loadBatch(id: string): ScreenshotBatch | undefined {
    return batches.value.find((b) => b.id === id);
  }

  function deleteBatch(id: string) {
    const idx = batches.value.findIndex((b) => b.id === id);
    if (idx >= 0) {
      batches.value.splice(idx, 1);
      saveToStorage();
    }
  }

  function renameBatch(id: string, name: string) {
    const b = batches.value.find((x) => x.id === id);
    if (b) {
      b.name = name;
      saveToStorage();
    }
  }

  function clearAll() {
    batches.value = [];
    saveToStorage();
  }

  return {
    batches,
    saveBatch,
    loadBatch,
    deleteBatch,
    renameBatch,
    clearAll,
  };
}
