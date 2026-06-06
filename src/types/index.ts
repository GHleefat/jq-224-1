export type DeviceCategory = "mobile" | "tablet" | "desktop";

export interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
  category: DeviceCategory;
}

export interface Screenshot {
  id: string;
  deviceId: string;
  deviceName: string;
  url: string;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: string;
  status: "pending" | "loading" | "success" | "error";
  error?: string;
}

export interface ScreenshotBatch {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  screenshots: Screenshot[];
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  diffPixels: number;
  diffPercentage: number;
  diffDataUrl: string;
  diffRegions: DiffRegion[];
}

export type CompareMode = "side-by-side" | "overlay";
