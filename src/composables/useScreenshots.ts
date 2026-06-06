import { ref, computed } from "vue";
import type { Device, Screenshot } from "@/types";
import { captureWithFallback } from "@/utils/capture";

const screenshots = ref<Screenshot[]>([]);
const isCapturing = ref(false);
const currentProgress = ref("");
const progressPercent = ref(0);
const currentUrl = ref("");

export function useScreenshots() {
  const completedCount = computed(
    () =>
      screenshots.value.filter(
        (s) => s.status === "success" || s.status === "error",
      ).length,
  );
  const totalCount = computed(() => screenshots.value.length);
  const isEmpty = computed(() => screenshots.value.length === 0);

  async function captureAll(url: string, devices: Device[]) {
    if (!url || devices.length === 0) return;

    currentUrl.value = url;
    isCapturing.value = true;
    progressPercent.value = 0;
    screenshots.value = devices.map((d) => ({
      id: `${d.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deviceId: d.id,
      deviceName: d.name,
      url,
      dataUrl: "",
      width: d.width,
      height: d.height,
      timestamp: new Date().toISOString(),
      status: "pending",
    }));

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const screenshot = screenshots.value[i];
      screenshot.status = "loading";

      try {
        currentProgress.value = `正在截取 ${device.name} (${i + 1}/${devices.length})`;
        const dataUrl = await captureWithFallback(device, url, (msg) => {
          currentProgress.value = `${device.name}: ${msg}`;
        });
        screenshot.dataUrl = dataUrl;
        screenshot.status = "success";
      } catch (err) {
        screenshot.status = "error";
        screenshot.error = err instanceof Error ? err.message : "未知错误";
      }
      progressPercent.value = ((i + 1) / devices.length) * 100;
    }

    currentProgress.value = "全部完成";
    isCapturing.value = false;
  }

  function setScreenshots(list: Screenshot[]) {
    screenshots.value = list;
  }

  function clearScreenshots() {
    screenshots.value = [];
    currentUrl.value = "";
    progressPercent.value = 0;
  }

  function getScreenshots() {
    return screenshots.value;
  }

  return {
    screenshots,
    isCapturing,
    currentProgress,
    progressPercent,
    currentUrl,
    completedCount,
    totalCount,
    isEmpty,
    captureAll,
    setScreenshots,
    clearScreenshots,
    getScreenshots,
  };
}
