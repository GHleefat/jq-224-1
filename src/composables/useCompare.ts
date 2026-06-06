import { ref, computed } from "vue";
import type { Screenshot, DiffResult, CompareMode } from "@/types";
import { compareImages } from "@/utils/diff";

const selectedIds = ref<string[]>([]);
const compareVisible = ref(false);
const compareMode = ref<CompareMode>("side-by-side");
const sensitivity = ref(0.1);
const diffResult = ref<DiffResult | null>(null);
const isComparing = ref(false);
const screenshots = ref<Screenshot[]>([]);

export function useCompare() {
  const selectedCount = computed(() => selectedIds.value.length);
  const canCompare = computed(() => selectedIds.value.length === 2);

  function setSourceScreenshots(list: Screenshot[]) {
    screenshots.value = list;
  }

  const selectedScreenshots = computed(() => {
    return selectedIds.value
      .map((id) => screenshots.value.find((s) => s.id === id))
      .filter((s): s is Screenshot => !!s);
  });

  function toggleSelection(id: string) {
    const idx = selectedIds.value.indexOf(id);
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1);
    } else {
      if (selectedIds.value.length >= 2) {
        selectedIds.value.shift();
      }
      selectedIds.value.push(id);
    }
  }

  function clearSelection() {
    selectedIds.value = [];
    diffResult.value = null;
  }

  function isSelected(id: string) {
    return selectedIds.value.includes(id);
  }

  async function runComparison() {
    if (selectedScreenshots.value.length !== 2) return;
    isComparing.value = true;
    diffResult.value = null;
    try {
      const [a, b] = selectedScreenshots.value;
      diffResult.value = await compareImages(a.dataUrl, b.dataUrl, {
        threshold: sensitivity.value,
      });
    } finally {
      isComparing.value = false;
    }
  }

  function openCompare() {
    compareVisible.value = true;
    runComparison();
  }

  function closeCompare() {
    compareVisible.value = false;
  }

  function setMode(mode: CompareMode) {
    compareMode.value = mode;
  }

  function setSensitivity(value: number) {
    sensitivity.value = value;
    if (compareVisible.value && selectedScreenshots.value.length === 2) {
      runComparison();
    }
  }

  return {
    selectedIds,
    selectedCount,
    canCompare,
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
  };
}
