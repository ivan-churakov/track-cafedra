import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import qrTVP from "../../image/qr-code-TVP.png";
import qrRKBP from "../../image/qr-code-RKBP.png";
import type { CurriculumEntry } from "../../types";
import { entryToDiscipline } from "../../lib/curriculum";

/** Дисциплина в координатах SVG-трека. Несёт исходную запись плана для редактирования. */
export type Discipline = {
  id: number;
  title: string;
  exam: string;
  test: string;
  creditUnit: string;
  lecture: string;
  practice: string;
  course: string[];
  position: { x: number; y: number };
  track: string;
  entry: CurriculumEntry;
};

export type Topic = {
  red: Discipline[];
  green: Discipline[];
  blue: Discipline[];
  orange: Discipline[];
};

type TrackColor = "red" | "green" | "blue" | "orange";

const lineRedPoints = [
  { x: 170, y: 100 },
  { x: 170, y: 620 },
  { x: 66, y: 724 },
  { x: 66, y: 900 },
];

const lineGreenPoints = [
  { x: 300, y: 40 },
  { x: 300, y: 620 },
  { x: 196, y: 724 },
  { x: 196, y: 900 },
];

const lineBluePoints = [
  { x: 1020, y: 40 },
  { x: 1020, y: 720 },
  { x: 1124, y: 824 },
  { x: 1124, y: 900 },
];

const lineOrangePoints = [
  { x: 1150, y: 100 },
  { x: 1150, y: 620 },
  { x: 1254, y: 724 },
  { x: 1254, y: 900 },
];

const TRACKS: Record<
  TrackColor,
  {
    stroke: string;
    path: string;
    points: { x: number; y: number }[];
    /** Сторона подписи относительно станции. */
    labelSide: "left" | "right";
    start: number;
  }
> = {
  red: { stroke: "#EF4444", path: "M 170 100 L 170 620 L 66 724 L 66 900", points: lineRedPoints, labelSide: "left", start: 0 },
  green: { stroke: "#22C55E", path: "M 300 40 L 300 620 L 196 724 L 196 900", points: lineGreenPoints, labelSide: "right", start: 12 },
  blue: { stroke: "#3B82F6", path: "M 1020 40 L 1020 720 L 1124 824 L 1124 900", points: lineBluePoints, labelSide: "left", start: 12 },
  orange: { stroke: "#F97316", path: "M 1150 100 L 1150 620 L 1254 724 L 1254 900", points: lineOrangePoints, labelSide: "right", start: 0 },
};

const TRACK_ORDER: TrackColor[] = ["red", "green", "blue", "orange"];
const STATION_GAP = 50;

/** Точка на ломаной на заданной длине дуги от начала (для раскладки станций по порядку). */
function pointAtDistance(points: { x: number; y: number }[], dist: number) {
  let remaining = dist;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= segLen || i === points.length - 2) {
      const t = segLen === 0 ? 0 : remaining / segLen;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= segLen;
  }
  return points[0];
}

/** Длина дуги до проекции точки на ломаную — параметр порядка станции вдоль трека. */
function lineProgress(px: number, py: number, points: { x: number; y: number }[]) {
  let acc = 0;
  let best = Infinity;
  let bestProgress = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const distSq = (px - projX) ** 2 + (py - projY) ** 2;
    const segLen = Math.sqrt(lenSq);
    if (distSq < best) {
      best = distSq;
      bestProgress = acc + t * segLen;
    }
    acc += segLen;
  }
  return bestProgress;
}

/** Группировка записей плана по цвету трека и раскладка станций по track_position. */
function buildTopics(entries: CurriculumEntry[]): Topic {
  const topics: Topic = { red: [], green: [], blue: [], orange: [] };
  for (const color of TRACK_ORDER) {
    const list = entries
      .filter((e) => e.track_color === color)
      .sort((a, b) => (a.track_position ?? 0) - (b.track_position ?? 0));
    topics[color] = list.map((e, i) => ({
      id: e.id,
      ...entryToDiscipline({ ...e, title: e.name }),
      position: pointAtDistance(TRACKS[color].points, TRACKS[color].start + i * STATION_GAP),
      track: color,
      entry: e,
    }));
  }
  return topics;
}

export const Track = ({
  variant,
  entries,
  isAdmin = false,
  onAdd,
  onEdit,
  onReorder,
}: {
  variant: string;
  entries: CurriculumEntry[];
  isAdmin?: boolean;
  onAdd?: () => void;
  onEdit?: (entry: CurriculumEntry) => void;
  onReorder?: (color: TrackColor, orderedIds: number[]) => void;
}) => {
  const [course, setCourse] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTopic, setHoveredTopic] = useState<Discipline | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState<"all" | TrackColor>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [isDraggingTopic, setIsDraggingTopic] = useState(false);

  // Локальная копия раскладки: переупорядочивание тащим оптимистично, затем
  // родитель перечитывает данные с backend и снова прокидывает entries.
  const initialTopics = useMemo(() => buildTopics(entries), [entries]);
  const [topics, setTopics] = useState<Topic>(initialTopics);
  useEffect(() => setTopics(initialTopics), [initialTopics]);

  const topicPosition = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function projectPointToSegment(
    px: number,
    py: number,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return a;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * dx, y: a.y + t * dy };
  }

  function projectToLine(px: number, py: number, points: { x: number; y: number }[]) {
    let closestPoint = points[0];
    let minDistSq = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const proj = projectPointToSegment(px, py, points[i], points[i + 1]);
      const distSq = (px - proj.x) ** 2 + (py - proj.y) ** 2;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestPoint = proj;
      }
    }
    return closestPoint;
  }

  function startDragging(topic: Discipline, e: React.MouseEvent) {
    if (!isAdmin) return;
    setIsDraggingTopic(true);
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = topic.position.x;
    const initY = topic.position.y;
    const color = topic.track as TrackColor;
    const linePoints = TRACKS[color].points;
    // Стартовая позиция — на случай клика без движения, чтобы станция не прыгала
    // на устаревшее значение ref от прошлого перетаскивания.
    topicPosition.current = { x: initX, y: initY };

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const rawPos = { x: initX + dx, y: initY + dy };
      topicPosition.current = projectToLine(rawPos.x, rawPos.y, linePoints);
      setTopics((prev) => applyPosition(prev, topic.id, topicPosition.current));
    }

    function onUp() {
      setIsDraggingTopic(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      // Новый порядок станций этого трека по их положению вдоль линии.
      setTopics((prev) => {
        const updated = applyPosition(prev, topic.id, topicPosition.current);
        const orderedIds = [...updated[color]]
          .sort(
            (a, b) =>
              lineProgress(a.position.x, a.position.y, linePoints) -
              lineProgress(b.position.x, b.position.y, linePoints)
          )
          .map((t) => t.id);
        onReorder?.(color, orderedIds);
        return updated;
      });
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function applyPosition(prev: Topic, id: number, pos: { x: number; y: number }): Topic {
    const updated = { ...prev };
    (Object.keys(prev) as TrackColor[]).forEach((branch) => {
      updated[branch] = prev[branch].map((t) => (t.id === id ? { ...t, position: pos } : t));
    });
    return updated;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingTopic) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isDraggingTopic) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTopicHover = (topic: Discipline, x: number, y: number) => {
    if (!isDragging) {
      setHoveredTopic(topic);
      setHoverPosition({ x, y });
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (hoveredTopic && !isDragging) setHoverPosition({ x: e.clientX, y: e.clientY });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") setScale((p) => Math.min(p * 1.1, 3));
      else if (e.key === "-") setScale((p) => Math.max(p * 0.9, 0.5));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [hoveredTopic, isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((p) => Math.min(Math.max(0.5, p * delta), 3));
    } else {
      setPosition((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const formatText = (topic: { title: string }) => {
    const maxCharsPerLine = 36;
    const words = topic.title.split(" ");
    const lines: string[] = [];
    let i = 0;
    while (i < words.length) {
      let lineWords = [words[i]];
      let totalLength = words[i].length;
      for (let j = 1; j < 3 && i + j < words.length; j++) {
        const nextWord = words[i + j];
        if (totalLength + 1 + nextWord.length <= maxCharsPerLine) {
          lineWords.push(nextWord);
          totalLength += 1 + nextWord.length;
        } else {
          break;
        }
      }
      lines.push(lineWords.join(" "));
      i += lineWords.length;
    }
    return lines;
  };

  useEffect(() => {
    const preventDefault = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) e.preventDefault();
    };
    document.addEventListener("wheel", preventDefault, { passive: false });
    return () => document.removeEventListener("wheel", preventDefault);
  }, []);

  const renderBranch = (color: TrackColor) => {
    const cfg = TRACKS[color];
    const labelX = cfg.labelSide === "left" ? -30 : 30;
    const anchor = cfg.labelSide === "left" ? "end" : "start";
    // Рисуем в стабильном порядке по id, а не по позиции на треке. Иначе при
    // смене порядка React переставляет DOM-узлы <g>, и у перемещённых узлов
    // сбрасывается CSS-transition — станции «проскакивают» без анимации.
    // Реальное положение задаёт transform, поэтому порядок отрисовки не важен.
    return [...topics[color]].sort((a, b) => a.id - b.id).map((topic) => {
      const point = topic.position;
      const isActive = course === 0 || topic.course.includes(course.toString());
      const isTrackVisible = selectedTrack === "all" || selectedTrack === color;
      const lines = formatText(topic);
      return (
        <g
          key={topic.id}
          onMouseEnter={(e) => handleTopicHover(topic, e.clientX, e.clientY)}
          onTouchStart={(e) => handleTopicHover(topic, e.touches[0].clientX, e.touches[0].clientY)}
          onMouseLeave={() => setHoveredTopic(null)}
          onTouchEnd={() => setHoveredTopic(null)}
          onDoubleClick={() => isAdmin && onEdit?.(topic.entry)}
          style={{
            cursor: isAdmin ? (isDraggingTopic ? "grabbing" : "grab") : "pointer",
            opacity: isActive && isTrackVisible ? 1 : 0.2,
            // Станция позиционируется трансформом группы — это даёт плавный переход
            // к новому порядку после перетаскивания. Во время drag переход выключен,
            // чтобы перетаскиваемая станция шла за курсором без задержки.
            transform: `translate(${point.x}px, ${point.y}px)`,
            transition: isDraggingTopic ? "none" : "transform 0.4s ease",
          }}
        >
          <circle
            cx={0}
            cy={0}
            r={isActive ? 14 : 12}
            fill="white"
            stroke={cfg.stroke}
            strokeWidth={isActive ? 8 : 6}
            onMouseDown={(e) => startDragging(topic, e)}
          />
          {lines.map((line, idx) => (
            <text
              key={idx}
              x={labelX}
              y={5 + idx * 15}
              textAnchor={anchor}
              className={`${isActive ? "font-bold text-base" : "text-sm"} ${isMobile ? "text-xs" : ""}`}
            >
              {line}
            </text>
          ))}
        </g>
      );
    });
  };

  return (
    <>
      <div className={`fixed z-10 flex flex-col gap-4 p-4 rounded-md ${isMobile ? "w-full" : ""}`}>
        <div className={`flex gap-2 ${isMobile ? "flex-wrap" : ""}`}>
          <Link href="/" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => {
              setPosition({ x: 0, y: 0 });
              setScale(1);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className={`px-4 py-2 rounded ${course === 0 ? "bg-gray-800 text-white" : "bg-gray-200"}`}
            onClick={() => setCourse(0)}
          >
            Все курсы
          </button>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              className={`px-4 py-2 rounded ${course === num ? "bg-gray-800 text-white" : "bg-gray-200"}`}
              onClick={() => setCourse(num)}
            >
              {num} курс
            </button>
          ))}
          {isAdmin && (
            <button
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              onClick={() => onAdd?.()}
            >
              + Дисциплина
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <button
              className={`flex items-center gap-2 p-4 rounded-full hover:opacity-80 bg-gray-100 ${selectedTrack === "all" ? "bg-gray-200" : ""}`}
              onClick={() => setSelectedTrack("all")}
            >
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full border-4 border-red-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-green-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-blue-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-orange-500"></div>
              </div>
            </button>
          </div>

          {(
            [
              ["red", "border-red-500"],
              ["green", "border-green-500"],
              ["blue", "border-blue-500"],
              ["orange", "border-orange-500"],
            ] as [TrackColor, string][]
          ).map(([color, borderClass]) => (
            <div key={color} className="relative group">
              <button
                className={`p-4 rounded-full hover:opacity-80 bg-gray-100 ${selectedTrack === color ? "bg-gray-200" : ""}`}
                onClick={() => setSelectedTrack(color)}
              >
                <div className={`w-5 h-5 rounded-full border-4 ${borderClass}`}></div>
              </button>
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="text-sm text-gray-500">
            Тащите станцию вдоль линии — поменять порядок. Двойной клик — редактировать.
          </div>
        )}
      </div>

      <div
        className="relative w-full h-full overflow-visible"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ userSelect: "none" }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={isMobile ? "0 0 800 1120" : "0 0 1200 1120"}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? "grabbing" : "grab",
            overflow: "visible",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoveredTopic(null);
          }}
        >
          {TRACK_ORDER.map((color) => (
            <path
              key={color}
              d={TRACKS[color].path}
              stroke={TRACKS[color].stroke}
              strokeWidth="8"
              fill="none"
              style={{ opacity: selectedTrack === "all" || selectedTrack === color ? 1 : 0.2 }}
            />
          ))}

          {TRACK_ORDER.map((color) => (
            <React.Fragment key={`stations-${color}`}>{renderBranch(color)}</React.Fragment>
          ))}

          <rect
            x={isMobile ? "30" : "60"}
            y="900"
            width={isMobile ? "740" : "1200"}
            height="60"
            rx="10"
            ry="10"
            fill="none"
            stroke="#d4d4d4"
            strokeWidth="6"
          />
          <text
            x={isMobile ? "400" : "675"}
            y="937"
            textAnchor="middle"
            className={`text-xl font-bold ${isMobile ? "text-base" : ""}`}
            fill="#000000"
          >
            Образовательный трек. Профиль {variant == "2" ? "ТВП" : "РКБП"}
          </text>
        </svg>
      </div>

      <Image
        src={variant == "2" ? qrTVP : qrRKBP}
        width={isMobile ? 100 : 200}
        height={isMobile ? 100 : 200}
        className="absolute bottom-0 right-0 z-10"
        alt="QR Code"
      />

      {hoveredTopic && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg transition-transform z-20"
          style={{
            left: isMobile ? "50%" : hoverPosition.x + 20,
            top: isMobile ? "50%" : hoverPosition.y,
            maxWidth: isMobile ? "90%" : `${(300 * scale) / 1.3}px`,
            minWidth: isMobile ? "auto" : "300px",
            transform: isMobile ? "translate(-50%, -50%)" : `scale(${scale > 1 ? scale / 1.3 : scale / 1.1})`,
            transformOrigin: isMobile ? "center" : "top left",
          }}
        >
          <h3 className="text-lg font-bold mb-2">{hoveredTopic.title}</h3>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {hoveredTopic.exam && <span>Экзамен: {hoveredTopic.exam}</span>}
            {hoveredTopic.test && <span>Зачет: {hoveredTopic.test}</span>}
            {hoveredTopic.creditUnit && <span>Зачетные единицы: {hoveredTopic.creditUnit}</span>}
            {hoveredTopic.lecture && <span>Лекции: {hoveredTopic.lecture}</span>}
            {hoveredTopic.practice && <span>Практики: {hoveredTopic.practice}</span>}
          </div>
        </div>
      )}
    </>
  );
};
