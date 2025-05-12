import React, { useState, useRef, useEffect } from "react";
import topics from "../../public/topic.json";
import Link from "next/link";
import Image from "next/image";
import qr from "../../image/qr-code.gif";

export const Track = () => {
  const [course, setCourse] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTopic, setHoveredTopic] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState<
    "all" | "red" | "green" | "blue" | "orange"
  >("all");
  const [isMobile, setIsMobile] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTopicHover = (topic: any, x: number, y: number) => {
    if (!isDragging) {
      setHoveredTopic(topic);
      setHoverPosition({ x, y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredTopic && !isDragging) {
        setHoverPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        setScale((prev) => Math.min(prev * 1.1, 3));
      } else if (e.key === "-") {
        setScale((prev) => Math.max(prev * 0.9, 0.5));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [hoveredTopic, isDragging]);

  const getPointOnLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    t: number
  ) => {
    return {
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => Math.min(Math.max(0.5, prev * delta), 3));
    } else {
      setPosition((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
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

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatText = (topic: {
    title: string;
    exam: string;
    test: string;
    creditUnit: string;
    lecture: string;
    practice: string;
    course: string[];
  }) => {
    const maxCharsPerLine = 40;
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
          totalLength += 1 + nextWord.length; // +1 for space
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

  return (
    <>
      <div
        className={`fixed z-10 flex flex-col gap-4 bg-white p-4 rounded-md ${
          isMobile ? "w-full" : ""
        }`}
      >
        <div className={`flex gap-2 ${isMobile ? "flex-wrap" : ""}`}>
          <Link
            href="/"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className={`px-4 py-2 rounded ${
              course === 0 ? "bg-gray-800 text-white" : "bg-gray-200"
            }`}
            onClick={() => setCourse(0)}
          >
            Все курсы
          </button>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              className={`px-4 py-2 rounded ${
                course === num ? "bg-gray-800 text-white" : "bg-gray-200"
              }`}
              onClick={() => setCourse(num)}
            >
              {num} курс
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <button
              className={`flex items-center gap-2 p-4 rounded-full hover:opacity-80 bg-gray-100 ${
                selectedTrack === "all" ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedTrack("all")}
            >
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full border-4 border-red-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-green-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-blue-500"></div>
                <div className="w-5 h-5 rounded-full border-4 border-orange-500"></div>
              </div>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mb-1 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Все ветки
            </div>
          </div>

          <div className="relative group">
            <button
              className={`p-4 rounded-full hover:opacity-80 bg-gray-100 ${
                selectedTrack === "red" ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedTrack("red")}
            >
              <div className="w-5 h-5 rounded-full border-4 border-red-500"></div>
            </button>
            <div className="absolute left-1/3 -translate-x-1/3 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Общеобразовательные дисциплины (для всех профилей 09.03.02)
            </div>
          </div>

          <div className="relative group">
            <button
              className={`p-4 rounded-full hover:opacity-80 bg-gray-100 ${
                selectedTrack === "green" ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedTrack("green")}
            >
              <div className="w-5 h-5 rounded-full border-4 border-green-500"></div>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              ИТ-дисциплины (для всех профилей 09.03.02)
            </div>
          </div>

          <div className="relative group">
            <button
              className={`p-4 rounded-full hover:opacity-80 bg-gray-100 ${
                selectedTrack === "blue" ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedTrack("blue")}
            >
              <div className="w-5 h-5 rounded-full border-4 border-blue-500"></div>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Дисциплины цикла &quot;Разработка, внедрение, сопровождение
              ИС&quot; (профиль РКБП)
            </div>
          </div>

          <div className="relative group">
            <button
              className={`p-4 rounded-full hover:opacity-80 bg-gray-100 ${
                selectedTrack === "orange" ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedTrack("orange")}
            >
              <div className="w-5 h-5 rounded-full border-4 border-orange-500"></div>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Дисциплины цикла &quot;Информационные системы и технологии&quot;
              (профиль РКБП)
            </div>
          </div>
        </div>
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
          {/* Красная линия */}
          <path
            d={
              isMobile
                ? "M 100 40 L 100 620 L 50 724 L 50 900"
                : "M 170 100 L 170 620 L 66 724 L 66 900"
            }
            stroke="#EF4444"
            strokeWidth="8"
            fill="none"
            id="redPath"
            style={{
              opacity:
                selectedTrack === "all" || selectedTrack === "red" ? 1 : 0.2,
            }}
          />
          {topics.topics.red.map((topic, index) => {
            let point;
            if (index < 10) {
              point = { x: isMobile ? 100 : 170, y: 100 + index * 50 };
            } else {
              const t = (index - 10) / 2;
              if (t <= 1) {
                point = getPointOnLine(
                  isMobile ? 100 : 170,
                  620,
                  isMobile ? 50 : 66,
                  724,
                  t
                );
              } else {
                point = { x: isMobile ? 50 : 66, y: 782 + (index - 13) * 50 };
              }
            }
            const isActive =
              course === 0 || topic.course.includes(course.toString());
            const isTrackVisible =
              selectedTrack === "all" || selectedTrack === "red";
            const lines = formatText(topic);
            return (
              <g
                key={index}
                onMouseEnter={(e) => {
                  handleTopicHover(topic, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  handleTopicHover(
                    topic,
                    e.touches[0].clientX,
                    e.touches[0].clientY
                  );
                }}
                onMouseLeave={() => setHoveredTopic(null)}
                onTouchEnd={() => setHoveredTopic(null)}
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                  opacity: isActive && isTrackVisible ? 1 : 0.2,
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 14 : 12}
                  fill="white"
                  stroke="#EF4444"
                  strokeWidth={isActive ? 8 : 6}
                />
                {lines.map((line, idx) => (
                  <text
                    key={idx}
                    x={point.x - 30}
                    y={point.y + 5 + idx * 15}
                    textAnchor="end"
                    className={`${isActive ? "font-bold text-base" : "text-sm"} ${
                      isMobile ? "text-xs" : ""
                    }`}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Зеленая линия */}
          <path
            d={
              isMobile
                ? "M 170 40 L 170 620 L 120 724 L 120 900"
                : "M 300 40 L 300 620 L 196 724 L 196 900"
            }
            stroke="#22C55E"
            strokeWidth="8"
            fill="none"
            style={{
              opacity:
                selectedTrack === "all" || selectedTrack === "green" ? 1 : 0.2,
            }}
          />
          {topics.topics.green.map((topic, index) => {
            let point;
            if (index < 11) {
              point = { x: isMobile ? 170 : 300, y: 52 + index * 50 };
            } else {
              const t = (index - 11) / 2;
              if (t <= 1) {
                point = getPointOnLine(
                  isMobile ? 170 : 300,
                  620,
                  isMobile ? 120 : 196,
                  724,
                  t
                );
              } else {
                point = { x: isMobile ? 120 : 196, y: 724 + (index - 13) * 50 };
              }
            }
            const isActive =
              course === 0 || topic.course.includes(course.toString());
            const isTrackVisible =
              selectedTrack === "all" || selectedTrack === "green";
            const lines = formatText(topic)
            return (
              <g
                key={index}
                onMouseEnter={(e) => {
                  handleTopicHover(topic, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  handleTopicHover(
                    topic,
                    e.touches[0].clientX,
                    e.touches[0].clientY
                  );
                }}
                onMouseLeave={() => setHoveredTopic(null)}
                onTouchEnd={() => setHoveredTopic(null)}
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                  opacity: isActive && isTrackVisible ? 1 : 0.2,
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 14 : 12}
                  fill="white"
                  stroke="#22C55E"
                  strokeWidth={isActive ? 8 : 6}
                />
                {lines.map((line, idx) => (
                  <text
                    key={idx}
                    x={point.x + 30}
                    y={point.y + 5 + idx * 15}
                    textAnchor="start"
                    className={`${isActive ? "font-bold text-base" : "text-sm"} ${
                      isMobile ? "text-xs" : ""
                    }`}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Синяя линия */}
          <path
            d={
              isMobile
                ? "M 630 40 L 630 720 L 700 824 L 700 900"
                : "M 1020 40 L 1020 720 L 1124 824 L 1124 900"
            }
            stroke="#3B82F6"
            strokeWidth="8"
            fill="none"
            style={{
              opacity:
                selectedTrack === "all" || selectedTrack === "blue" ? 1 : 0.2,
            }}
          />
          {topics.topics.blue.map((topic, index) => {
            let point;
            const maxPointsOnVertical = 11;
            const maxPointsOnCurve = 1;

            if (index < maxPointsOnVertical) {
              point = { x: isMobile ? 630 : 1020, y: 52 + index * 60 };
            } else if (index < maxPointsOnVertical + maxPointsOnCurve) {
              const t = (index - maxPointsOnVertical) / maxPointsOnCurve;
              point = getPointOnLine(
                isMobile ? 630 : 1020,
                720,
                isMobile ? 700 : 1124,
                824,
                t
              );
            } else {
              const remainingPoints =
                index - (maxPointsOnVertical + maxPointsOnCurve);
              point = {
                x: isMobile ? 700 : 1124,
                y: 824 + remainingPoints * 50,
              };
            }

            const isActive =
              course === 0 || topic.course.includes(course.toString());
            const isTrackVisible =
              selectedTrack === "all" || selectedTrack === "blue";
            const lines = formatText(topic);
            return (
              <g
                key={index}
                onMouseEnter={(e) => {
                  handleTopicHover(topic, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  handleTopicHover(
                    topic,
                    e.touches[0].clientX,
                    e.touches[0].clientY
                  );
                }}
                onMouseLeave={() => setHoveredTopic(null)}
                onTouchEnd={() => setHoveredTopic(null)}
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                  opacity: isActive && isTrackVisible ? 1 : 0.2,
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 14 : 12}
                  fill="white"
                  stroke="#3B82F6"
                  strokeWidth={isActive ? 8 : 6}
                />
                {lines.map((line, idx) => (
                  <text
                    key={idx}
                    x={point.x - 30}
                    y={point.y + 5 + idx * 15}
                    textAnchor="end"
                    className={`${
                      isActive ? "font-bold text-base" : "text-sm"
                    } text-end ${isMobile ? "text-xs" : ""}`}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Оранжевая линия */}
          <path
            d={
              isMobile
                ? "M 700 40 L 700 620 L 750 724 L 750 900"
                : "M 1150 100 L 1150 620 L 1254 724 L 1254 900"
            }
            stroke="#F97316"
            strokeWidth="8"
            fill="none"
            style={{
              opacity:
                selectedTrack === "all" || selectedTrack === "orange" ? 1 : 0.2,
            }}
          />
          {topics.topics.orange.map((topic, index) => {
            let point;
            if (index < 11) {
              point = { x: isMobile ? 700 : 1150, y: 102 + index * 50 };
            } else {
              const t = (index - 10) / 2;
              if (t <= 1) {
                point = getPointOnLine(
                  isMobile ? 700 : 1150,
                  620,
                  isMobile ? 750 : 1254,
                  724,
                  t
                );
              } else {
                point = {
                  x: isMobile ? 750 : 1254,
                  y: 724 + (index - 13) * 50,
                };
              }
            }
            const isActive =
              course === 0 || topic.course.includes(course.toString());
            const isTrackVisible =
              selectedTrack === "all" || selectedTrack === "orange";
            const lines = formatText(topic)
            return (
              <g
                key={index}
                onMouseEnter={(e) => {
                  handleTopicHover(topic, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  handleTopicHover(
                    topic,
                    e.touches[0].clientX,
                    e.touches[0].clientY
                  );
                }}
                onMouseLeave={() => setHoveredTopic(null)}
                onTouchEnd={() => setHoveredTopic(null)}
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                  opacity: isActive && isTrackVisible ? 1 : 0.2,
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 14 : 12}
                  fill="white"
                  stroke="#F97316"
                  strokeWidth={isActive ? 8 : 6}
                />
                {lines.map((line, idx) => (
                  <text
                    key={idx}
                    x={point.x + 30}
                    y={point.y + 5 + idx * 15}
                    textAnchor="start"
                    className={`${
                      isActive ? "font-bold text-base" : "text-sm"
                    } text-end ${isMobile ? "text-xs" : ""}`}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Подпись "Образовательный трек" */}
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
            Образовательный трек
          </text>
        </svg>
      </div>

      {/* QR Code */}
      <Image
        src={qr}
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
            transform: isMobile
              ? "translate(-50%, -50%)"
              : `scale(${scale > 1 ? scale / 1.3 : scale / 1.1})`,
            transformOrigin: isMobile ? "center" : "top left",
          }}
        >
          <h3 className="text-lg font-bold mb-2">{hoveredTopic.title}</h3>
          <p className="text-sm mb-2">{hoveredTopic.description}</p>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {hoveredTopic.exam && <span>Экзамен: {hoveredTopic.exam}</span>}
            {hoveredTopic.test && <span>Тест: {hoveredTopic.test}</span>}
            {hoveredTopic.creditUnit && (
              <span>Зачетные единицы: {hoveredTopic.creditUnit}</span>
            )}
            {hoveredTopic.lecture && (
              <span>Лекции: {hoveredTopic.lecture}</span>
            )}
            {hoveredTopic.practice && (
              <span>Практики: {hoveredTopic.practice}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
