import type { FramePoint, FrameRect } from "./types";

const FOCUS_BOX_RATIO = 0.42;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const getDefaultAnalysisRect = (width: number, height: number): FrameRect => ({
  x: 0,
  y: 0,
  width,
  height,
});

export const clientToFrame = (
  clientX: number,
  clientY: number,
  viewport: Pick<DOMRect, "left" | "top" | "width" | "height">,
  frameWidth: number,
  frameHeight: number,
): FramePoint => {
  if (!viewport.width || !viewport.height) return { x: 0, y: 0 };
  const relativeX = clamp((clientX - viewport.left) / viewport.width, 0, 1);
  const relativeY = clamp((clientY - viewport.top) / viewport.height, 0, 1);
  return {
    x: (1 - relativeX) * frameWidth,
    y: relativeY * frameHeight,
  };
};

export const clampFocusRect = (
  rect: FrameRect,
  frameWidth: number,
  frameHeight: number,
): FrameRect => {
  const x = clamp(rect.x, 0, frameWidth);
  const y = clamp(rect.y, 0, frameHeight);
  return {
    x,
    y,
    width: clamp(rect.width, 0, frameWidth - x),
    height: clamp(rect.height, 0, frameHeight - y),
  };
};

export const rectAroundPoint = (
  centerX: number,
  centerY: number,
  frameWidth: number,
  frameHeight: number,
): FrameRect => {
  const side = Math.min(frameWidth, frameHeight) * FOCUS_BOX_RATIO;
  const x = clamp(centerX - side / 2, 0, frameWidth - side);
  const y = clamp(centerY - side / 2, 0, frameHeight - side);
  return {
    x,
    y,
    width: Math.min(side, frameWidth - x),
    height: Math.min(side, frameHeight - y),
  };
};

export const rectFromDragCorners = (
  start: FramePoint,
  end: FramePoint,
  frameWidth: number,
  frameHeight: number,
): FrameRect =>
  clampFocusRect(
    {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    },
    frameWidth,
    frameHeight,
  );

export const finalizeFocusRectAfterDrag = (
  rect: FrameRect,
  start: FramePoint,
  end: FramePoint,
  frameWidth: number,
  frameHeight: number,
): FrameRect => {
  const minSide = Math.max(28, Math.min(frameWidth, frameHeight) * 0.06);
  if (rect.width >= minSide && rect.height >= minSide) return rect;
  return rectAroundPoint(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    frameWidth,
    frameHeight,
  );
};

export const focusRectToPercent = (
  rect: FrameRect,
  frameWidth: number,
  frameHeight: number,
) => {
  if (!frameWidth || !frameHeight) return { left: 0, top: 0, width: 0, height: 0 };
  return {
    left: ((frameWidth - rect.x - rect.width) / frameWidth) * 100,
    top: (rect.y / frameHeight) * 100,
    width: (rect.width / frameWidth) * 100,
    height: (rect.height / frameHeight) * 100,
  };
};
