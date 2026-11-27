import type { EdgePixel, FrameRect } from "./types";

const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
const EDGE_STEP = 2;
const EDGE_THRESHOLD = 35;
export const SCAN_BAND = 35;
export const CAPTURE_HIGHLIGHT_BAND = 12;

export const getEdgePixels = (
  data: ArrayLike<number>,
  width: number,
  height: number,
  rect?: FrameRect,
): EdgePixel[] => {
  const edgePixels: EdgePixel[] = [];
  const left = Math.max(1, Math.floor(rect?.x ?? 1));
  const top = Math.max(1, Math.floor(rect?.y ?? 1));
  const right = Math.min(width - 1, Math.ceil(rect ? rect.x + rect.width : width - 1));
  const bottom = Math.min(height - 1, Math.ceil(rect ? rect.y + rect.height : height - 1));

  for (let y = top; y < bottom; y += EDGE_STEP) {
    for (let x = left; x < right; x += EDGE_STEP) {
      let gradientX = 0;
      let gradientY = 0;
      for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
        for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
          const index = ((y + kernelY) * width + (x + kernelX)) * 4;
          const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
          const kernelIndex = (kernelY + 1) * 3 + (kernelX + 1);
          gradientX += gray * SOBEL_X[kernelIndex];
          gradientY += gray * SOBEL_Y[kernelIndex];
        }
      }
      const magnitude = Math.hypot(gradientX, gradientY);
      if (magnitude > EDGE_THRESHOLD) {
        edgePixels.push({
          x,
          y,
          strength: Math.min(1, magnitude / 320),
          tangentX: -gradientY / magnitude,
          tangentY: gradientX / magnitude,
        });
      }
    }
  }
  return edgePixels;
};

export const getEdgeOpacity = (
  pixelY: number,
  scanCenter: number,
  mode: "live" | "capture",
): number => {
  if (mode === "capture") {
    const distance = scanCenter - pixelY;
    if (distance < 0) return 0;
    if (distance >= CAPTURE_HIGHLIGHT_BAND) return 0;
    return 0.45 + (1 - distance / CAPTURE_HIGHLIGHT_BAND) * 0.55;
  }

  const distance = Math.abs(pixelY - scanCenter);
  if (distance >= SCAN_BAND) return 0;
  return 0.3 + (1 - distance / SCAN_BAND) * 0.7;
};
