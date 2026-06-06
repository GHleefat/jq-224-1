import type { Device } from "@/types";
import html2canvas from "html2canvas";

export interface CaptureOptions {
  url: string;
  device: Device;
  timeout?: number;
  onProgress?: (status: string) => void;
}

export async function captureScreenshot(
  options: CaptureOptions,
): Promise<string> {
  const { url, device, timeout = 45000, onProgress } = options;

  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      left: -99999px;
      top: 0;
      width: ${device.width}px;
      height: ${device.height}px;
      overflow: hidden;
      z-index: -1;
      pointer-events: none;
    `;
    document.body.appendChild(container);

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      width: ${device.width}px;
      height: ${device.height}px;
      overflow: hidden;
      background: #fff;
    `;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = `
      width: ${device.width}px;
      height: ${device.height}px;
      border: none;
      display: block;
    `;
    iframe.setAttribute(
      "sandbox",
      "allow-same-origin allow-scripts allow-forms allow-popups allow-presentation",
    );

    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    const cleanup = () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("截图超时"));
    }, timeout);

    iframe.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("页面加载失败"));
    };

    iframe.onload = async () => {
      try {
        onProgress?.("页面加载完成，等待渲染...");
        await new Promise((r) => setTimeout(r, 3000));

        onProgress?.("正在生成截图...");

        const canvas = await html2canvas(wrapper, {
          width: device.width,
          height: device.height,
          windowWidth: device.width,
          windowHeight: device.height,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: (el) =>
            el.tagName === "SCRIPT" || el.tagName === "NOSCRIPT",
        });

        clearTimeout(timer);
        const dataUrl = canvas.toDataURL("image/png");
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        clearTimeout(timer);
        cleanup();
        reject(err instanceof Error ? err : new Error("截图失败"));
      }
    };

    try {
      onProgress?.("正在加载页面...");
      iframe.src = url;
    } catch (err) {
      clearTimeout(timer);
      cleanup();
      reject(err instanceof Error ? err : new Error("加载页面失败"));
    }
  });
}

export async function captureWithFallback(
  device: Device,
  url: string,
  onProgress?: (status: string) => void,
): Promise<string> {
  try {
    return await captureScreenshot({ url, device, onProgress });
  } catch {
    return createPlaceholderImage(device, url);
  }
}

function createPlaceholderImage(device: Device, url: string): string {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 800 / Math.max(device.width, device.height));
  canvas.width = Math.floor(device.width * scale);
  canvas.height = Math.floor(device.height * scale);
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#1e293b");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#64748b";
  ctx.font = `bold ${Math.floor(w / 15)}px JetBrains Mono, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("截图不可用", w / 2, h / 2 - h / 10);

  ctx.fillStyle = "#475569";
  ctx.font = `${Math.floor(w / 28)}px JetBrains Mono, monospace`;
  ctx.fillText(
    `${device.name} · ${device.width}×${device.height}`,
    w / 2,
    h / 2 + h / 30,
  );

  ctx.fillStyle = "#334155";
  ctx.font = `${Math.floor(w / 40)}px JetBrains Mono, monospace`;
  const displayUrl = url.length > 45 ? url.slice(0, 45) + "..." : url;
  ctx.fillText(displayUrl, w / 2, h / 2 + h / 10);

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = Math.max(2, w / 150);
  ctx.setLineDash([Math.max(6, w / 40), Math.max(6, w / 40)]);
  ctx.strokeRect(w / 30, w / 30, w - w / 15, h - w / 15);

  return canvas.toDataURL("image/png");
}
