import type { Screenshot, DiffResult } from "@/types";

export interface ReportData {
  batchName: string;
  url: string;
  createdAt: string;
  screenshots: Screenshot[];
  diffResults?: {
    screenshot1: Screenshot;
    screenshot2: Screenshot;
    diff: DiffResult;
  }[];
}

export function generateDiffReport(data: ReportData): string {
  const { batchName, url, createdAt, screenshots, diffResults = [] } = data;

  const screenshotCards = screenshots
    .map(
      (s) => `
    <div class="screenshot-card">
      <div class="device-header">
        <span class="device-name">${escapeHtml(s.deviceName)}</span>
        <span class="device-size">${s.width}×${s.height}</span>
      </div>
      <img src="${s.dataUrl}" alt="${escapeHtml(s.deviceName)}" />
    </div>
  `,
    )
    .join("");

  const diffSections = diffResults
    .map(
      (d, i) => `
    <div class="diff-section">
      <h3>对比 #${i + 1}</h3>
      <div class="diff-info">
        <div>
          <span class="device-label">A:</span> ${escapeHtml(d.screenshot1.deviceName)}
        </div>
        <div>
          <span class="device-label">B:</span> ${escapeHtml(d.screenshot2.deviceName)}
        </div>
        <div class="diff-stats">
          <span class="stat-pill">差异像素: ${d.diff.diffPixels.toLocaleString()}</span>
          <span class="stat-pill stat-pill-red">差异率: ${d.diff.diffPercentage.toFixed(3)}%</span>
          <span class="stat-pill">差异区域: ${d.diff.diffRegions.length}</span>
        </div>
      </div>
      <div class="diff-images">
        <div class="diff-img-wrap">
          <div class="diff-img-label">A</div>
          <img src="${d.screenshot1.dataUrl}" />
        </div>
        <div class="diff-img-wrap">
          <div class="diff-img-label">B</div>
          <img src="${d.screenshot2.dataUrl}" />
        </div>
        <div class="diff-img-wrap">
          <div class="diff-img-label diff">差异图</div>
          <img src="${d.diff.diffDataUrl}" />
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>截图差异报告 - ${escapeHtml(batchName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
      background: #0f172a;
      color: #e2e8f0;
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      padding: 32px;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      border-radius: 16px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 28px; margin-bottom: 12px; color: #fff; }
    .header .meta { font-size: 14px; color: rgba(255,255,255,0.85); }
    .header .meta a { color: rgba(255,255,255,0.95); }
    .section { margin-bottom: 40px; }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #5eead4;
      border-bottom: 1px solid #334155;
      padding-bottom: 12px;
    }
    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .screenshot-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
    }
    .device-header {
      padding: 12px 16px;
      background: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .device-name { font-weight: 600; color: #e2e8f0; }
    .device-size { font-size: 12px; color: #94a3b8; }
    .screenshot-card img {
      width: 100%;
      height: 360px;
      object-fit: cover;
      object-position: top center;
      display: block;
    }
    .diff-section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .diff-section h3 {
      font-size: 18px;
      color: #5eead4;
      margin-bottom: 16px;
    }
    .diff-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .device-label {
      display: inline-block;
      background: #334155;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 8px;
      color: #94a3b8;
    }
    .diff-stats { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
    .stat-pill {
      background: #334155;
      color: #94a3b8;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
    }
    .stat-pill-red {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .diff-images {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .diff-img-wrap { position: relative; background: #0f172a; border-radius: 8px; overflow: hidden; }
    .diff-img-label {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(15, 23, 42, 0.9);
      color: #e2e8f0;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1;
    }
    .diff-img-label.diff {
      background: rgba(239, 68, 68, 0.9);
    }
    .diff-img-wrap img {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      background: #020617;
    }
    @media (max-width: 768px) {
      body { padding: 16px; }
      .diff-images { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📸 截图差异报告</h1>
      <div class="meta">
        <div><strong>批次名称:</strong> ${escapeHtml(batchName)}</div>
        <div><strong>目标网址:</strong> <a href="${url}" target="_blank">${escapeHtml(url)}</a></div>
        <div><strong>生成时间:</strong> ${createdAt}</div>
        <div><strong>截图数量:</strong> ${screenshots.length}</div>
      </div>
    </div>

    <div class="section">
      <h2>全部截图</h2>
      <div class="screenshots-grid">${screenshotCards}</div>
    </div>

    ${
      diffResults.length > 0
        ? `
    <div class="section">
      <h2>差异对比</h2>
      ${diffSections}
    </div>
    `
        : ""
    }
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function downloadReport(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
