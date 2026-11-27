import { CAPTURE_HIGHLIGHT_BAND, getEdgeOpacity, SCAN_BAND } from "./scan";
import type { EdgePixel, FrameRect } from "./types";

const SEGMENT_LENGTH = 5.2;

export const renderContourMask = (
  canvas: HTMLCanvasElement,
  edges: EdgePixel[],
  width: number,
  height: number,
) => {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 1.55;
  context.filter = "blur(0.2px)";
  context.shadowColor = "rgba(34, 211, 238, 0.85)";
  context.shadowBlur = 3;

  [0.52, 0.74, 0.96].forEach((alpha, bucket) => {
    context.beginPath();
    let hasSegments = false;
    edges.forEach((edge) => {
      const edgeBucket = Math.min(2, Math.floor(edge.strength * 3));
      if (edgeBucket !== bucket) return;
      const halfX = edge.tangentX * SEGMENT_LENGTH / 2;
      const halfY = edge.tangentY * SEGMENT_LENGTH / 2;
      context.moveTo(edge.x - halfX, edge.y - halfY);
      context.lineTo(edge.x + halfX, edge.y + halfY);
      hasSegments = true;
    });
    if (!hasSegments) return;
    context.strokeStyle = `rgba(103, 232, 249, ${alpha})`;
    context.stroke();
  });
  context.filter = "none";
  context.shadowBlur = 0;
};

const clampOffset = (value: number) => Math.max(0, Math.min(1, value));

export const drawScanOverlay = (
  canvas: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  rect: FrameRect,
  scanCenter: number,
  mode: "live" | "capture" | "complete",
  width: number,
  height: number,
  pixelRatio = 1,
) => {
  const outputWidth = Math.round(width * pixelRatio);
  const outputHeight = Math.round(height * pixelRatio);
  if (canvas.width !== outputWidth) canvas.width = outputWidth;
  if (canvas.height !== outputHeight) canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.beginPath();
  context.rect(rect.x, rect.y, rect.width, rect.height);
  context.clip();

  if (mode === "complete") {
    context.restore();
    return;
  }

  context.drawImage(mask, 0, 0, width, height);
  context.globalCompositeOperation = "destination-in";
  const maskGradient = context.createLinearGradient(0, rect.y, 0, rect.y + rect.height);
  const center = clampOffset((scanCenter - rect.y) / rect.height);

  const band = mode === "live" ? SCAN_BAND : CAPTURE_HIGHLIGHT_BAND;
  const start = clampOffset((scanCenter - band - rect.y) / rect.height);
  const end = clampOffset((scanCenter + band - rect.y) / rect.height);
  const opacity = getEdgeOpacity(scanCenter, scanCenter, mode);
  maskGradient.addColorStop(0, "rgba(255,255,255,0)");
  maskGradient.addColorStop(start, "rgba(255,255,255,0)");
  maskGradient.addColorStop(center, `rgba(255,255,255,${opacity})`);
  maskGradient.addColorStop(end, "rgba(255,255,255,0)");
  maskGradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = maskGradient;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.globalCompositeOperation = "source-over";

  if (scanCenter >= rect.y - SCAN_BAND && scanCenter <= rect.y + rect.height + SCAN_BAND) {
    const glow = context.createLinearGradient(0, scanCenter - 14, 0, scanCenter + 14);
    glow.addColorStop(0, "rgba(45,212,191,0)");
    glow.addColorStop(0.5, "rgba(45,212,191,0.13)");
    glow.addColorStop(1, "rgba(45,212,191,0)");
    context.fillStyle = glow;
    context.fillRect(rect.x, scanCenter - 14, rect.width, 28);

    const line = context.createLinearGradient(rect.x, 0, rect.x + rect.width, 0);
    line.addColorStop(0, "rgba(165,243,252,0)");
    line.addColorStop(0.18, "rgba(165,243,252,0.8)");
    line.addColorStop(0.5, "rgba(207,250,254,1)");
    line.addColorStop(0.82, "rgba(165,243,252,0.8)");
    line.addColorStop(1, "rgba(165,243,252,0)");
    context.fillStyle = line;
    context.fillRect(rect.x, scanCenter - 0.65, rect.width, 1.3);
  }
  context.restore();
};
