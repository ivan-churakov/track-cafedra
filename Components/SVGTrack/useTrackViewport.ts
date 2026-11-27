import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';

type Point = { x: number; y: number };
type View = { scale: number; position: Point };

export function useTrackViewport(svgRef: RefObject<SVGSVGElement>, content: unknown, isMobile: boolean, course: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, position: { x: 0, y: 0 } });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState('0 0 1400 1120');
  const pan = useRef<{ point: Point; position: Point } | null>(null);
  const pinch = useRef<{ distance: number; center: Point; view: View } | null>(null);

  const zoomBy = useCallback((factor: number, anchor: Point = { x: 0, y: 0 }) => {
    setView(previous => {
      const scale = Math.min(3, Math.max(0.5, previous.scale * factor));
      const ratio = scale / previous.scale;
      return { scale, position: {
        x: anchor.x - (anchor.x - previous.position.x) * ratio,
        y: anchor.y - (anchor.y - previous.position.y) * ratio,
      } };
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1;
      zoomBy(Math.exp(-event.deltaY * unit * 0.002), {
        x: event.clientX - bounds.left - bounds.width / 2,
        y: event.clientY - bounds.top - bounds.height / 2,
      });
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof svg.getBBox !== 'function') return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      const bounds = svg.getBBox();
      if (bounds.width && bounds.height) {
        setViewBox(`${bounds.x - 24} ${bounds.y - 24} ${bounds.width + 48} ${bounds.height + 48}`);
      }
    };
    const frame = requestAnimationFrame(fit);
    document.fonts?.ready.then(fit);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [svgRef, content, isMobile, course]);

  const startPan = (point: Point) => {
    pan.current = { point, position: viewRef.current.position };
    pinch.current = null;
    setIsDragging(true);
  };
  const movePan = (point: Point) => {
    const start = pan.current;
    if (!start) return;
    setView(previous => ({ ...previous, position: {
      x: start.position.x + point.x - start.point.x,
      y: start.position.y + point.y - start.point.y,
    } }));
  };
  const stop = () => { pan.current = null; pinch.current = null; setIsDragging(false); };
  const touchPair = (event: TouchEvent) => {
    const [first, second] = [event.touches[0], event.touches[1]];
    const bounds = viewportRef.current!.getBoundingClientRect();
    return {
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
      center: { x: (first.clientX + second.clientX) / 2 - bounds.left - bounds.width / 2,
        y: (first.clientY + second.clientY) / 2 - bounds.top - bounds.height / 2 },
    };
  };
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      pinch.current = { ...touchPair(event), view: viewRef.current };
      pan.current = null;
      setIsDragging(true);
    } else if (event.touches.length === 1) {
      startPan({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }
  };
  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2 && pinch.current) {
      const start = pinch.current;
      const current = touchPair(event);
      if (!start.distance) return;
      const scale = Math.min(3, Math.max(0.5, start.view.scale * current.distance / start.distance));
      const ratio = scale / start.view.scale;
      setView({ scale, position: {
        x: current.center.x - (start.center.x - start.view.position.x) * ratio,
        y: current.center.y - (start.center.y - start.view.position.y) * ratio,
      } });
    } else if (event.touches.length === 1) {
      movePan({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }
  };

  return {
    ...view, isDragging, viewportRef, viewBox, zoomBy,
    reset: () => { stop(); setView({ scale: 1, position: { x: 0, y: 0 } }); },
    handlers: {
      onMouseDown: (event: MouseEvent) => { if (event.button === 0) startPan({ x: event.clientX, y: event.clientY }); },
      onMouseMove: (event: MouseEvent) => movePan({ x: event.clientX, y: event.clientY }),
      onMouseUp: stop, onMouseLeave: stop,
      onTouchStart, onTouchMove, onTouchEnd: (event: TouchEvent) => { stop(); if (event.touches.length) onTouchStart(event); },
      onTouchCancel: stop,
    },
  };
}
