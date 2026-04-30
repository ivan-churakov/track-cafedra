import * as React from "react";
import { useRef, useState } from "react";
import Image from "next/image";
import cross from "../image/cross.svg";
import trackTVP from "../image/trackTVP.png";
import trackRKBP from "../image/trackRKBP.png";
import card4 from "../image/cardSoty.svg";
import card2 from "../image/card123.svg";
import lesenka from "../image/cardSoty.svg";
import card11 from "../image/card11.png";
import logoKB from "../image/KBSP_white.png";
import scannerPreview from "../image/scaneer preview.png";
import { Video } from "../Components/Video/Video";
import { PresentationSlider } from "../Components/PresentationSlider/PresentationSlider";
import Link from "next/link";

export default function Home() {
  const [show, setShow] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [course, setCourse] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [openTrack, setOpenTrack] = useState(false);

  const tracks = [
    {
      href: "/track",
      title: "09.03.02 профиль РКБП",
      img: trackRKBP,
      alt: "Картинка трека РКБП",
    },
    {
      href: "/track2",
      title: "09.03.02 профиль ТВП",
      img: trackTVP,
      alt: "Картинка трека ТВП",
    },
  ];

  const goPrevTrack = () =>
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
  const goNextTrack = () =>
    setCurrentTrack((prev) => (prev + 1) % tracks.length);

  const trackTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const trackDidSwipeRef = useRef(false);

  const onTrackTouchStart: React.TouchEventHandler = (e) => {
    const t = e.touches[0];
    if (!t) return;
    trackTouchStartRef.current = { x: t.clientX, y: t.clientY };
    trackDidSwipeRef.current = false;
  };

  const onTrackTouchMove: React.TouchEventHandler = (e) => {
    if (!trackTouchStartRef.current) return;
    const t = e.touches[0];
    if (!t) return;

    const dx = t.clientX - trackTouchStartRef.current.x;
    const dy = t.clientY - trackTouchStartRef.current.y;

    // Если жест больше похож на горизонтальный — считаем его свайпом.
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      trackDidSwipeRef.current = true;
    }
  };

  const onTrackTouchEnd: React.TouchEventHandler = (e) => {
    if (!trackTouchStartRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - trackTouchStartRef.current.x;
    const dy = t.clientY - trackTouchStartRef.current.y;

    trackTouchStartRef.current = null;

    // Порог: достаточно уверенный горизонтальный свайп.
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;

    if (dx < 0) goNextTrack();
    else goPrevTrack();
  };

  const presentationImages = [
    "/презентация для дод_page-0001.jpg",
    "/презентация для дод_page-0002.jpg",
    "/презентация для дод_page-0003.jpg",
  ];

  const buttonHandler = (e: any) => {
    if (show === e.currentTarget.id) {
      setShow("");
    } else {
      setShow(e.currentTarget.id);
    }
  };

  const courseHandler = (e: any) => {
    setCourse(e.target.name);
  };

  return (
    <div className={"relative w-[100%] h-full"}>
      <div
        className={`${
          show1 ? "opacity-100 z-50" : "opacity-0 -z-10"
        } w-full h-full bg-black/30 absolute transition-opacity top-0`}
      >
        <div
          className={`relative mx-auto bg-white overflow-hidden w-[95%] h-[86vh] rounded-2xl shadow-2xl mt-[40px] p-8`}
        >
          <Image
            className="absolute top-6 right-6 cursor-pointer"
            onClick={() => setShow1(!show1)}
            src={cross}
            alt="cross"
          />
          <Image
            className="w-full h-full object-contain"
            src={card4}
            alt="Картинка трека предметов"
          />
        </div>
      </div>
      <div
        className={`${
          show2 ? "opacity-100 z-50" : "opacity-0 -z-10"
        } w-full h-full bg-black/30 absolute transition-opacity top-0`}
      >
        <div
          className={`relative mx-auto bg-white overflow-hidden w-[95%] h-[86vh] rounded-2xl shadow-2xl mt-[40px] p-8`}
        >
          <Image
            className="absolute top-6 right-6 cursor-pointer"
            onClick={() => setShow2(!show2)}
            src={cross}
            alt="cross"
          />
          <Image
            className="w-full h-full object-contain"
            src={card2}
            alt="Картинка трека предметов"
          />
        </div>
      </div>
      <div
        className={`${
          show3 ? "opacity-100 z-50" : "opacity-0 -z-10"
        } w-full h-full bg-black/30 absolute transition-opacity top-0`}
      >
        <div
          className={`relative w-[95%] h-[86vh] mx-auto bg-white overflow-hidden rounded-2xl shadow-2xl mt-[40px] p-8`}
        >
          <Image
            className="absolute top-6 right-6 cursor-pointer"
            onClick={() => setShow3(!show3)}
            src={cross}
            alt="cross"
          />
          <Image
            className="w-full h-full object-contain"
            src={lesenka}
            alt="Картинка трека предметов"
          />
        </div>
      </div>
      <div className="h-full flex flex-col gap-10 p-4 sm:p-6">
        <div className="flex-1 w-full overflow-x-auto pb-2">
        <div className="flex h-full gap-8">
          {/* <div
            onClick={() => setShow1(true)}
            className="flex-shrink-0 w-1/3 flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <p className="font-medium text-center text-xl">
              Практическая деятельность кафедры
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card4}
              alt="Картинка трека предметов"
            />
          </div> */}
          <div className="flex-shrink-0 w-1/3 flex flex-col bg-white shadow-2xl rounded-xl p-4 gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-center text-xl leading-tight">
                {tracks[currentTrack]?.title}
              </p>
            </div>

            <Link
              href={tracks[currentTrack]?.href ?? "/track"}
              className="relative flex-1 rounded-xl overflow-hidden ring-1 ring-black/5 hover:ring-black/10 transition-shadow touch-pan-y"
              aria-label={`Открыть: ${tracks[currentTrack]?.title ?? "трек"}`}
              onTouchStart={onTrackTouchStart}
              onTouchMove={onTrackTouchMove}
              onTouchEnd={onTrackTouchEnd}
              onClick={(e) => {
                // Если пользователь сделал свайп, не открываем ссылку.
                if (trackDidSwipeRef.current) {
                  e.preventDefault();
                  trackDidSwipeRef.current = false;
                }
              }}
            >
              <Image
                className="w-full h-full object-contain"
                src={tracks[currentTrack]?.img ?? trackRKBP}
                alt={tracks[currentTrack]?.alt ?? "Картинка трека"}
              />
            </Link>

            <div className="flex items-center justify-center gap-2">
              {tracks.map((t, idx) => (
                <button
                  key={t.href}
                  type="button"
                  onClick={() => setCurrentTrack(idx)}
                  aria-label={`Перейти к: ${t.title}`}
                  aria-pressed={currentTrack === idx}
                  className={`h-2.5 rounded-full transition-all ${
                    currentTrack === idx
                      ? "w-6 bg-black/60"
                      : "w-2.5 bg-black/20 hover:bg-black/30"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* <div
            onClick={() => setShow2(true)}
            className="flex-shrink-0 w-1/3 flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <p className="font-medium text-center text-xl">
              Профессиональная сфера деятельности выпускника
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card2}
              alt="Профессиональная сфера деятельности выпускника"
            />
          </div> */}
          <div
            onClick={() => {
              setPresentationIndex(0);
              setShowPresentation(true);
            }}
            className="flex-shrink-0 w-1/3 flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <PresentationSlider
              images={presentationImages}
              // title="Практическая деятельность кафедры"
            />
          </div>
          <Link
            href={"/camera"}
            className="group flex-shrink-0 w-1/3 flex flex-col bg-white shadow-2xl rounded-xl p-4 gap-4 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] transition-shadow"
          >
            <p className="font-medium text-center text-xl">Определение профессии</p>
            <div className="relative w-full flex-1 min-h-[210px] rounded-xl overflow-hidden bg-gradient-to-br from-[#e8f7f3] via-white to-[#f3f6ff] ring-1 ring-black/5">
              <Image
                src={scannerPreview}
                alt="Превью сканера профессии"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                priority
              />
            </div>
          </Link>
        </div>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <Image
            className="w-[200px] object-contain brightness-[10000]"
            src={logoKB}
            alt="логотип"
          />
          <div className="flex flex-col">
            <p className="text-white font-semibold text-[36px]">
              Кафедра КБ-9 “Предметно-ориентированные информационные системы”
            </p>
            <p className="text-white font-medium text-[28px]">
              09.03.02 “Информационные системы и технологии”
            </p>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-3 gap-8">
          <div className="flex bg-white shadow-2xl rounded-xl p-4">
            <Video src={"/video.mp4"} />
          </div>
          <div
            onClick={() => setShow3(true)}
            className="h-full flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <Image
              className="w-full h-full object-contain"
              src={lesenka}
              alt="Картинка трека предметов"
            />
          </div>

          <div className="flex flex-col bg-white shadow-2xl rounded-xl gap-4 p-4">
            <Video src={"/TVP.MP4"} />
          </div>
        </div>

        {/* Portal navigation */}
        <div className="shrink-0">
          <div className="mb-3">
            <h2 className="text-white font-semibold text-2xl mb-1">Перейти в систему</h2>
            <p className="text-gray-400 text-sm">
              Расписание преподавателей, контакты и кабинеты — для студентов. Редактирование расписания и курсов — для преподавателей.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/students"
              className="group flex items-center gap-4 bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">Для студентов</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    без входа
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-snug">
                  Список преподавателей кафедры, расписание присутствия в вузе, номера кабинетов, контакты.
                </p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 text-2xl transition-colors flex-shrink-0">→</span>
            </Link>

            <Link
              href="/teacher/login"
              className="group flex items-center gap-4 bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">
                🎓
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">Для преподавателей</h3>
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    вход
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-snug">
                  Редактирование расписания, добавление курсов повышения квалификации, график пересдач.
                </p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 text-2xl transition-colors flex-shrink-0">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Модальное окно для презентации */}
      <div
        className={`${
          showPresentation ? "opacity-100 z-50" : "opacity-0 -z-10"
        } w-full h-full bg-black/80 fixed inset-0 transition-opacity flex items-center justify-center`}
        onClick={() => setShowPresentation(false)}
      >
        <div
          className="relative w-[95%] h-[95%] bg-white rounded-2xl shadow-2xl p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            className="absolute top-6 right-6 cursor-pointer z-20"
            onClick={() => setShowPresentation(false)}
            src={cross}
            alt="close"
          />
          <PresentationSlider
            images={presentationImages}
            // title="Практическая деятельность кафедры"
            autoPlay={false}
            showArrows={true}
            showCounter={true}
            initialIndex={presentationIndex}
          />
        </div>
      </div>
    </div>
  );
}
