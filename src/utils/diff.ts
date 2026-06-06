import type { DiffRegion, DiffResult } from "@/types";

export interface DiffOptions {
  threshold?: number;
  highlightColor?: string;
  regionThreshold?: number;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

function imageToCanvas(
  img: HTMLImageElement,
  maxWidth = 2000,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ratio = Math.min(1, maxWidth / Math.max(img.width, img.height));
  canvas.width = Math.floor(img.width * ratio);
  canvas.height = Math.floor(img.height * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(255 * 255 * 3);
}

function findDiffRegions(
  diffMask: Uint8ClampedArray,
  width: number,
  height: number,
  pixelThreshold: number,
): DiffRegion[] {
  const visited = new Set<number>();
  const regions: DiffRegion[] = [];
  const clusterSize = 4;

  for (let y = 0; y < height; y += clusterSize) {
    for (let x = 0; x < width; x += clusterSize) {
      const idx = y * width + x;
      if (visited.has(idx) || diffMask[idx] === 0) continue;

      const stack: [number, number][] = [[x, y]];
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      let count = 0;

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        const cidx = cy * width + cx;
        if (visited.has(cidx)) continue;
        visited.add(cidx);

        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        count++;

        for (let dy = -clusterSize; dy <= clusterSize; dy += clusterSize) {
          for (let dx = -clusterSize; dx <= clusterSize; dx += clusterSize) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (!visited.has(nidx) && diffMask[nidx] === 1) {
                stack.push([nx, ny]);
              }
            }
          }
        }
      }

      if (count >= pixelThreshold) {
        regions.push({
          x: Math.max(0, minX - 5),
          y: Math.max(0, minY - 5),
          width: Math.min(width - 1, maxX + 5) - Math.max(0, minX - 5) + 1,
          height: Math.min(height - 1, maxY + 5) - Math.max(0, minY - 5) + 1,
        });
      }
    }
  }

  return regions;
}

export async function compareImages(
  image1DataUrl: string,
  image2DataUrl: string,
  options: DiffOptions = {},
): Promise<DiffResult> {
  const {
    threshold = 0.1,
    highlightColor = "rgba(239, 68, 68, 0.5)",
    regionThreshold = 10,
  } = options;

  const [img1, img2] = await Promise.all([
    loadImage(image1DataUrl),
    loadImage(image2DataUrl),
  ]);

  const targetWidth = Math.max(img1.width, img2.width);
  const targetHeight = Math.max(img1.height, img2.height);

  const canvas1 = imageToCanvas(img1, targetWidth);
  const canvas2 = imageToCanvas(img2, targetWidth);

  const width = Math.max(canvas1.width, canvas2.width);
  const height = Math.max(canvas1.height, canvas2.height);

  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resultCtx = resultCanvas.getContext("2d")!;

  resultCtx.globalAlpha = 0.5;
  resultCtx.drawImage(canvas1, 0, 0);
  resultCtx.globalAlpha = 1;

  const ctx1 = canvas1.getContext("2d")!;
  const ctx2 = canvas2.getContext("2d")!;

  const data1 = ctx1.getImageData(0, 0, width, height).data;
  const data2 = ctx2.getImageData(0, 0, width, height).data;

  const diffMask = new Uint8ClampedArray(width * height);
  let diffPixels = 0;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const dist = colorDistance(
      data1[idx],
      data1[idx + 1],
      data1[idx + 2],
      data2[idx],
      data2[idx + 1],
      data2[idx + 2],
    );
    if (dist > threshold) {
      diffPixels++;
      diffMask[i] = 1;
    }
  }

  const highlightCanvas = document.createElement("canvas");
  highlightCanvas.width = width;
  highlightCanvas.height = height;
  const hctx = highlightCanvas.getContext("2d")!;

  const imageData = hctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    if (diffMask[i] === 1) {
      imageData.data[idx] = 239;
      imageData.data[idx + 1] = 68;
      imageData.data[idx + 2] = 68;
      imageData.data[idx + 3] = 180;
    }
  }
  hctx.putImageData(imageData, 0, 0);

  resultCtx.drawImage(highlightCanvas, 0, 0);

  const diffRegions = findDiffRegions(diffMask, width, height, regionThreshold);

  resultCtx.strokeStyle = "#ef4444";
  resultCtx.lineWidth = 2;
  resultCtx.setLineDash([6, 4]);
  for (const region of diffRegions) {
    resultCtx.strokeRect(region.x, region.y, region.width, region.height);
  }

  return {
    diffPixels,
    diffPercentage: (diffPixels / (width * height)) * 100,
    diffDataUrl: resultCanvas.toDataURL("image/png"),
    diffRegions,
  };
}
