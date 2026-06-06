<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  Trash2,
  Settings2,
  Power,
  PowerOff,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X,
} from "lucide-vue-next";
import type { Device, DeviceCategory } from "@/types";
import { useDevices } from "@/composables/useDevices";

const {
  devices,
  categories,
  devicesByCategory,
  toggleDevice,
  addDevice,
  removeDevice,
  updateDevice,
  enableAll,
  disableAll,
  resetDefaults,
} = useDevices();

const expandedCategories = ref<Set<DeviceCategory>>(
  new Set(["mobile", "tablet", "desktop"]),
);
const showAddForm = ref(false);
const editingId = ref<string | null>(null);

const newDevice = ref({
  name: "",
  width: 375,
  height: 667,
  category: "mobile" as DeviceCategory,
  enabled: true,
});

const editingDevice = ref<{ name: string; width: number; height: number }>({
  name: "",
  width: 0,
  height: 0,
});

const categoryIcons: Record<DeviceCategory, any> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const categoryLabels: Record<DeviceCategory, string> = {
  mobile: "手机",
  tablet: "平板",
  desktop: "桌面",
};

const categoryCounts = computed(() => {
  const counts: Record<DeviceCategory, { total: number; enabled: number }> = {
    mobile: { total: 0, enabled: 0 },
    tablet: { total: 0, enabled: 0 },
    desktop: { total: 0, enabled: 0 },
  };
  for (const d of devices.value) {
    counts[d.category].total++;
    if (d.enabled) counts[d.category].enabled++;
  }
  return counts;
});

function toggleCategory(cat: DeviceCategory) {
  if (expandedCategories.value.has(cat)) {
    expandedCategories.value.delete(cat);
  } else {
    expandedCategories.value.add(cat);
  }
}

function startEdit(d: Device) {
  editingId.value = d.id;
  editingDevice.value = { name: d.name, width: d.width, height: d.height };
}

function saveEdit(d: Device) {
  if (editingDevice.value.name.trim()) {
    updateDevice(d.id, editingDevice.value);
  }
  editingId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

function submitAdd() {
  if (
    newDevice.value.name.trim() &&
    newDevice.value.width > 0 &&
    newDevice.value.height > 0
  ) {
    addDevice({ ...newDevice.value });
    newDevice.value = {
      name: "",
      width: 375,
      height: 667,
      category: "mobile",
      enabled: true,
    };
    showAddForm.value = false;
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-slate-900/50 border-r border-slate-800">
    <div
      class="p-4 border-b border-slate-800 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Settings2 class="w-5 h-5 text-teal-400" />
        <span class="font-semibold text-slate-100">设备配置</span>
      </div>
      <div class="flex gap-1">
        <button
          class="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-teal-400 transition"
          title="全部启用"
          @click="enableAll"
        >
          <Power class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition"
          title="全部禁用"
          @click="disableAll"
        >
          <PowerOff class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-teal-400 transition"
          title="恢复默认"
          @click="resetDefaults"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div v-for="cat in categories" :key="cat" class="space-y-1">
        <button
          class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition"
          @click="toggleCategory(cat)"
        >
          <div class="flex items-center gap-2">
            <component :is="categoryIcons[cat]" class="w-4 h-4 text-teal-400" />
            <span class="text-sm font-medium text-slate-200">{{
              categoryLabels[cat]
            }}</span>
            <span class="text-xs text-slate-500">
              {{ categoryCounts[cat].enabled }}/{{ categoryCounts[cat].total }}
            </span>
          </div>
          <ChevronDown
            v-if="expandedCategories.has(cat)"
            class="w-4 h-4 text-slate-500"
          />
          <ChevronRight v-else class="w-4 h-4 text-slate-500" />
        </button>

        <div v-if="expandedCategories.has(cat)" class="ml-2 space-y-1">
          <div
            v-for="device in devicesByCategory[cat]"
            :key="device.id"
            class="group relative"
          >
            <div
              v-if="editingId !== device.id"
              class="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition cursor-pointer"
              @click="toggleDevice(device.id)"
            >
              <div
                class="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold transition"
                :class="
                  device.enabled
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-700/50 text-slate-500 border border-slate-700'
                "
              >
                {{ device.width }}×{{ device.height }}
              </div>
              <div class="flex-1 min-w-0">
                <div
                  class="text-sm truncate"
                  :class="device.enabled ? 'text-slate-100' : 'text-slate-500'"
                >
                  {{ device.name }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ device.width }} × {{ device.height }}
                </div>
              </div>
              <div
                class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
              >
                <button
                  class="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-teal-400"
                  title="编辑"
                  @click.stop="startEdit(device)"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="device.id.startsWith('custom-')"
                  class="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                  title="删除"
                  @click.stop="removeDevice(device.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <div
                class="w-10 h-6 rounded-full p-0.5 transition"
                :class="device.enabled ? 'bg-teal-500' : 'bg-slate-700'"
              >
                <div
                  class="w-5 h-5 rounded-full bg-white shadow transition-transform"
                  :class="device.enabled ? 'translate-x-4' : ''"
                />
              </div>
            </div>

            <div
              v-else
              class="p-2 rounded-lg bg-slate-800/80 border border-teal-500/40 space-y-2"
            >
              <input
                v-model="editingDevice.name"
                type="text"
                class="w-full px-2 py-1.5 bg-slate-900 text-slate-100 rounded border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
                placeholder="设备名称"
                @keydown.enter="saveEdit(device)"
                @keydown.escape="cancelEdit"
              />
              <div class="flex gap-2">
                <input
                  v-model.number="editingDevice.width"
                  type="number"
                  min="100"
                  class="flex-1 px-2 py-1.5 bg-slate-900 text-slate-100 rounded border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="宽度"
                />
                <span class="text-slate-500 self-center">×</span>
                <input
                  v-model.number="editingDevice.height"
                  type="number"
                  min="100"
                  class="flex-1 px-2 py-1.5 bg-slate-900 text-slate-100 rounded border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="高度"
                />
              </div>
              <div class="flex justify-end gap-1">
                <button
                  class="p-1.5 bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                  @click="cancelEdit"
                >
                  <X class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 bg-teal-600 rounded text-white hover:bg-teal-500"
                  @click="saveEdit(device)"
                >
                  <Check class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-slate-800">
      <button
        v-if="!showAddForm"
        class="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-teal-400 hover:text-teal-300 text-sm transition"
        @click="showAddForm = true"
      >
        <Plus class="w-4 h-4" />
        添加自定义设备
      </button>

      <div v-else class="space-y-2">
        <input
          v-model="newDevice.name"
          type="text"
          class="w-full px-3 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
          placeholder="设备名称"
        />
        <div class="flex gap-2">
          <input
            v-model.number="newDevice.width"
            type="number"
            min="100"
            class="flex-1 px-3 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
            placeholder="宽"
          />
          <input
            v-model.number="newDevice.height"
            type="number"
            min="100"
            class="flex-1 px-3 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
            placeholder="高"
          />
        </div>
        <select
          v-model="newDevice.category"
          class="w-full px-3 py-2 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="mobile">手机</option>
          <option value="tablet">平板</option>
          <option value="desktop">桌面</option>
        </select>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition"
            @click="showAddForm = false"
          >
            取消
          </button>
          <button
            class="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-500 transition"
            @click="submitAdd"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
