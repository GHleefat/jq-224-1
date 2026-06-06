import { ref, computed, watch } from "vue";
import type { Device, DeviceCategory } from "@/types";
import defaultDevices from "@/data/devices.json";

const STORAGE_KEY = "screenshot-compare:devices";

const devices = ref<Device[]>([]);
const isLoaded = ref(false);

function loadFromStorage(): Device[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [...defaultDevices] as Device[];
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices.value));
  } catch {
    // ignore
  }
}

export function useDevices() {
  if (!isLoaded.value) {
    devices.value = loadFromStorage();
    isLoaded.value = true;
  }

  watch(devices, saveToStorage, { deep: true });

  const enabledDevices = computed(() => devices.value.filter((d) => d.enabled));
  const categories: DeviceCategory[] = ["mobile", "tablet", "desktop"];

  const devicesByCategory = computed(() => {
    const map: Record<DeviceCategory, Device[]> = {
      mobile: [],
      tablet: [],
      desktop: [],
    };
    for (const d of devices.value) {
      map[d.category].push(d);
    }
    return map;
  });

  function toggleDevice(id: string) {
    const d = devices.value.find((x) => x.id === id);
    if (d) d.enabled = !d.enabled;
  }

  function addDevice(device: Omit<Device, "id">) {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    devices.value.push({ ...device, id });
  }

  function removeDevice(id: string) {
    const idx = devices.value.findIndex((x) => x.id === id);
    if (idx >= 0) devices.value.splice(idx, 1);
  }

  function updateDevice(id: string, updates: Partial<Device>) {
    const d = devices.value.find((x) => x.id === id);
    if (d) Object.assign(d, updates);
  }

  function enableAll() {
    devices.value.forEach((d) => (d.enabled = true));
  }

  function disableAll() {
    devices.value.forEach((d) => (d.enabled = false));
  }

  function resetDefaults() {
    devices.value = [...defaultDevices] as Device[];
  }

  return {
    devices,
    enabledDevices,
    categories,
    devicesByCategory,
    toggleDevice,
    addDevice,
    removeDevice,
    updateDevice,
    enableAll,
    disableAll,
    resetDefaults,
  };
}
