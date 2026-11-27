import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { analyzeImageData, normalizeAnalysisRect } from "../../lib/career-camera/analysis";
import { CAMERA_VIDEO_CONSTRAINTS, captureVideoFrame, lockCameraZoom } from "../../lib/career-camera/camera";
import { clientToFrame, finalizeFocusRectAfterDrag, focusRectToPercent, getDefaultAnalysisRect, rectFromDragCorners } from "../../lib/career-camera/geometry";
import { drawScanOverlay, renderContourMask } from "../../lib/career-camera/renderer";
import { getEdgePixels, SCAN_BAND } from "../../lib/career-camera/scan";
import type { AnalysisResult, EdgePixel, FramePoint, FrameRect } from "../../lib/career-camera/types";
import { CareerResults } from "./CareerResults";

type CameraPhase = "idle" | "requesting" | "live" | "selection" | "scanning" | "result";

interface DragState {
  start: FramePoint;
  pointerId: number;
  width: number;
  height: number;
}

interface ScanRequest {
  rect: FrameRect;
  edges: EdgePixel[];
  result: AnalysisResult;
}

const primaryButton = "rounded-xl bg-slate-800 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";

const getCameraError = (error: unknown) => {
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Разрешите доступ к камере в настройках браузера.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Камера не найдена.";
  if (name === "NotReadableError" || name === "AbortError") {
    return "Не удалось получить видео. Закройте другие приложения с камерой и повторите.";
  }
  return "Не удалось включить камеру. Проверьте доступ и повторите.";
};

export const CareerCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selectionFrozenRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const focusRectRef = useRef<FrameRect | null>(null);
  const scanDirtyRef = useRef(true);
  const scanRequestRef = useRef<ScanRequest | null>(null);
  const cameraRequestRef = useRef(0);

  const [phase, setPhase] = useState<CameraPhase>("idle");
  const [frameSize, setFrameSize] = useState({ width: 640, height: 480 });
  const [focusRect, setFocusRect] = useState<FrameRect | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const updateFocusRect = useCallback((rect: FrameRect | null) => {
    focusRectRef.current = rect;
    setFocusRect(rect);
    scanDirtyRef.current = true;
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => {
    cameraRequestRef.current += 1;
    stopCamera();
  }, [stopCamera]);

  const syncFrameSize = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    setFrameSize((current) =>
      current.width === video.videoWidth && current.height === video.videoHeight
        ? current
        : { width: video.videoWidth, height: video.videoHeight },
    );
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++cameraRequestRef.current;
    stopCamera();
    scanRequestRef.current = null;
    selectionFrozenRef.current = false;
    dragRef.current = null;
    updateFocusRect(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setPhase("requesting");

    const contour = contourCanvasRef.current;
    contour?.getContext("2d")?.clearRect(0, 0, contour.width, contour.height);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("Camera API is unavailable", "NotSupportedError");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: CAMERA_VIDEO_CONSTRAINTS,
        audio: false,
      });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const video = videoRef.current;
      if (!video) throw new Error("Video element is unavailable");
      video.srcObject = stream;
      await video.play();
      if (track) void lockCameraZoom(track);
      if (requestId !== cameraRequestRef.current) return;
      syncFrameSize();
      setPhase("live");
    } catch (cameraError) {
      if (requestId !== cameraRequestRef.current) return;
      stopCamera();
      setPhase("idle");
      setError(getCameraError(cameraError));
    }
  }, [stopCamera, syncFrameSize, updateFocusRect]);

  const resumeLive = useCallback(() => {
    if (!streamRef.current) {
      void startCamera();
      return;
    }
    selectionFrozenRef.current = false;
    dragRef.current = null;
    updateFocusRect(null);
    setProgress(0);
    setPhase("live");
    const contour = contourCanvasRef.current;
    contour?.getContext("2d")?.clearRect(0, 0, contour.width, contour.height);
    void videoRef.current?.play().catch(() => undefined);
  }, [startCamera, updateFocusRect]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "live" && phase !== "selection") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    if (!video || !captureCanvas) return;
    event.preventDefault();

    try {
      let size = { width: captureCanvas.width, height: captureCanvas.height };
      if (!selectionFrozenRef.current) {
        size = captureVideoFrame(video, captureCanvas);
        selectionFrozenRef.current = true;
        setFrameSize(size);
        setPhase("selection");
        const track = streamRef.current?.getVideoTracks()[0];
        if (track) void lockCameraZoom(track);
      }
      const start = clientToFrame(
        event.clientX,
        event.clientY,
        event.currentTarget.getBoundingClientRect(),
        size.width,
        size.height,
      );
      dragRef.current = { start, pointerId: event.pointerId, ...size };
      updateFocusRect(rectFromDragCorners(start, start, size.width, size.height));
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional on older mobile browsers.
      }
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Не удалось зафиксировать кадр");
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = clientToFrame(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      drag.width,
      drag.height,
    );
    updateFocusRect(rectFromDragCorners(drag.start, current, drag.width, drag.height));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const end = clientToFrame(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      drag.width,
      drag.height,
    );
    const rect = rectFromDragCorners(drag.start, end, drag.width, drag.height);
    updateFocusRect(finalizeFocusRectAfterDrag(rect, drag.start, end, drag.width, drag.height));
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already have released the pointer.
    }
  };

  const cancelPointer = () => {
    dragRef.current = null;
  };

  const analyze = useCallback(() => {
    if (phase !== "live" && phase !== "selection") return;
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    if (!video || !captureCanvas) return;

    try {
      let size = { width: captureCanvas.width, height: captureCanvas.height };
      if (!selectionFrozenRef.current) {
        size = captureVideoFrame(video, captureCanvas);
        selectionFrozenRef.current = true;
        setFrameSize(size);
      }
      const context = captureCanvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Браузер не поддерживает обработку кадра");
      const rect = normalizeAnalysisRect(focusRectRef.current, size.width, size.height);
      const fullFrame = context.getImageData(0, 0, size.width, size.height);
      const selectedFrame = context.getImageData(rect.x, rect.y, rect.width, rect.height);
      const analysisResult = analyzeImageData(selectedFrame.data);
      const edges = getEdgePixels(fullFrame.data, size.width, size.height, rect);
      scanRequestRef.current = { rect, edges, result: analysisResult };
      setProgress(0);
      setError(null);
      stopCamera();
      setPhase("scanning");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Не удалось обработать кадр");
    }
  }, [phase, stopCamera]);

  useEffect(() => {
    if (phase !== "live" && phase !== "selection" && phase !== "scanning") return;
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const contourCanvas = contourCanvasRef.current;
    if (!video || !captureCanvas || !contourCanvas) return;

    const captureRequest = phase === "scanning" ? scanRequestRef.current : null;
    if (phase === "scanning" && !captureRequest) return;
    const source = phase === "live" ? video : captureCanvas;
    const frameCanvas = document.createElement("canvas");
    const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });
    const maskCanvas = document.createElement("canvas");
    if (!frameContext) return;

    let animationId = 0;
    let stopped = false;
    let hasSample = false;
    let lastSample = 0;
    let lastProgress = -1;
    let edges: EdgePixel[] = [];
    const startedAt = performance.now();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);

    const renderFrame = (timestamp: number) => {
      if (stopped) return;
      const width = phase === "live" ? video.videoWidth : captureCanvas.width;
      const height = phase === "live" ? video.videoHeight : captureCanvas.height;
      if (!width || !height) {
        animationId = requestAnimationFrame(renderFrame);
        return;
      }
      setFrameSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
      const activeRect: FrameRect = captureRequest
        ? captureRequest.rect
        : focusRectRef.current ?? getDefaultAnalysisRect(width, height);
      const shouldSample = phase === "live"
        ? timestamp - lastSample >= 90
        : !hasSample || scanDirtyRef.current;

      if (captureRequest && !hasSample) {
        edges = captureRequest.edges;
        renderContourMask(maskCanvas, edges, width, height);
        hasSample = true;
      } else if (!captureRequest && shouldSample) {
        if (frameCanvas.width !== width) frameCanvas.width = width;
        if (frameCanvas.height !== height) frameCanvas.height = height;
        frameContext.drawImage(source, 0, 0, width, height);
        const image = frameContext.getImageData(0, 0, width, height);
        edges = getEdgePixels(image.data, width, height, activeRect);
        renderContourMask(maskCanvas, edges, width, height);
        scanDirtyRef.current = false;
        hasSample = true;
        lastSample = timestamp;
      }

      if (captureRequest) {
        const duration = reducedMotion ? 1 : 1600;
        const currentProgress = Math.min(1, Math.max(0, (timestamp - startedAt) / duration));
        const percent = Math.round(currentProgress * 100);
        if (percent !== lastProgress) {
          lastProgress = percent;
          setProgress(percent);
        }
        const scanCenter = captureRequest.rect.y - SCAN_BAND
          + currentProgress * (captureRequest.rect.height + SCAN_BAND * 2);
        if (currentProgress >= 1) {
          drawScanOverlay(contourCanvas, maskCanvas, captureRequest.rect, scanCenter, "complete", width, height, pixelRatio);
          scanRequestRef.current = null;
          setResult(captureRequest.result);
          setPhase("result");
          return;
        }
        drawScanOverlay(contourCanvas, maskCanvas, captureRequest.rect, scanCenter, "capture", width, height, pixelRatio);
      } else {
        const scanCenter = reducedMotion
          ? activeRect.y + activeRect.height / 2
          : activeRect.y - SCAN_BAND + ((timestamp - startedAt) / 14 % (activeRect.height + SCAN_BAND * 2));
        drawScanOverlay(contourCanvas, maskCanvas, activeRect, scanCenter, "live", width, height, pixelRatio);
      }
      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);
    return () => {
      stopped = true;
      cancelAnimationFrame(animationId);
    };
  }, [phase]);

  const activeRect = focusRect ?? getDefaultAnalysisRect(frameSize.width, frameSize.height);
  const overlayRect = focusRectToPercent(activeRect, frameSize.width, frameSize.height);
  const showVideo = phase === "requesting" || phase === "live";
  const showCapture = phase === "selection" || phase === "scanning" || phase === "result";
  const showContours = phase === "live" || phase === "selection" || phase === "scanning";
  const canSelect = phase === "live" || phase === "selection";

  return (
    <div className="min-h-screen bg-[#eef3f5] px-4 py-5 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 4 6.5 10l6 6M7 10h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              На главную
            </Link>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">Определение профессии</h1>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)]" aria-label="Сканер профессии">
          <div
            data-testid="camera-viewport"
            className={`relative mx-auto w-full overflow-hidden bg-slate-900 ${canSelect ? "cursor-crosshair touch-none select-none" : ""}`}
            style={{
              aspectRatio: `${frameSize.width} / ${frameSize.height}`,
              maxWidth: `max(280px, calc(${frameSize.width / frameSize.height * 100}vh - ${frameSize.width / frameSize.height * 240}px))`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={cancelPointer}
            onLostPointerCapture={cancelPointer}
          >
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full -scale-x-100 object-fill ${showVideo ? "block" : "hidden"}`}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={syncFrameSize}
              onResize={syncFrameSize}
              aria-label="Видео с камеры"
            />
            <canvas
              ref={captureCanvasRef}
              data-testid="selection-canvas"
              className={`absolute inset-0 h-full w-full -scale-x-100 ${showCapture ? "block" : "hidden"}`}
              aria-label="Зафиксированный кадр"
            />
            <canvas
              ref={contourCanvasRef}
              className={`pointer-events-none absolute inset-0 z-10 h-full w-full -scale-x-100 ${showContours ? "block" : "hidden"}`}
              aria-hidden="true"
            />

            {canSelect && (
              <div
                className="pointer-events-none absolute z-20 shadow-[0_0_0_9999px_rgba(2,6,23,0.30)] ring-1 ring-teal-300/60"
                style={{
                  left: `${overlayRect.left}%`,
                  top: `${overlayRect.top}%`,
                  width: `${overlayRect.width}%`,
                  height: `${overlayRect.height}%`,
                }}
                aria-hidden="true"
              >
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-teal-200" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-teal-200" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-teal-200" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-teal-200" />
              </div>
            )}

            {(phase === "idle" || phase === "requesting") && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                {phase === "requesting" ? (
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-teal-300 motion-reduce:animate-none" aria-label="Включение камеры" />
                ) : (
                  <svg className="h-12 w-12" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <rect x="3.5" y="8.5" width="25" height="18" rx="4" stroke="currentColor" />
                    <circle cx="16" cy="17.5" r="5.5" stroke="currentColor" />
                    <path d="M11 8.5 13 5h6l2 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            )}
          </div>

          <div className="p-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(phase === "idle" || phase === "requesting") && (
                <button type="button" className={primaryButton} onClick={() => void startCamera()} disabled={phase === "requesting"}>
                  {phase === "requesting" ? "Включение…" : "Включить камеру"}
                </button>
              )}
              {canSelect && (
                <button type="button" className={primaryButton} onClick={analyze}>Сканировать</button>
              )}
              {phase === "selection" && (
                <button type="button" className={secondaryButton} onClick={resumeLive}>Обновить кадр</button>
              )}
              {phase === "scanning" && (
                <button type="button" className={primaryButton} disabled>Сканирование {progress}%</button>
              )}
              {phase === "result" && (
                <button type="button" className={primaryButton} onClick={() => void startCamera()}>Сканировать ещё раз</button>
              )}
            </div>

            {phase === "scanning" && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Сканирование кадра" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <div className="h-full rounded-full bg-teal-400" style={{ width: `${progress}%` }} />
              </div>
            )}
            {error && <p className="mt-4 text-center text-sm text-red-600" role="alert">{error}</p>}
          </div>
        </section>

        {result && <CareerResults result={result} />}
      </div>
    </div>
  );
};
