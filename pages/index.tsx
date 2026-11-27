import * as React from "react";
import { useRef, useState, useEffect } from "react";
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

// Карусель карточек: сколько копий ленты держим для бесшовной бесконечной
// прокрутки (видно 3 за раз).
const CAROUSEL_COPIES = 3;
// Количество реальных карточек в ленте (длина baseSlides ниже).
const CAROUSEL_BASE = 4;

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
  // Старт в средней копии ленты, чтобы можно было крутить в обе стороны.
  const [carouselIndex, setCarouselIndex] = useState(CAROUSEL_BASE);
  const [carouselAnim, setCarouselAnim] = useState(true);

  const carouselNext = () => setCarouselIndex((i) => i + 1);
  const carouselPrev = () => setCarouselIndex((i) => i - 1);

  // По завершении анимации, если ушли в крайнюю копию — бесшовно возвращаемся
  // в среднюю (без анимации). Окна визуально идентичны, прыжок незаметен.
  const onCarouselTransitionEnd = () => {
    setCarouselIndex((i) => {
      if (i >= 2 * CAROUSEL_BASE) {
        setCarouselAnim(false);
        return i - CAROUSEL_BASE;
      }
      if (i < CAROUSEL_BASE) {
        setCarouselAnim(false);
        return i + CAROUSEL_BASE;
      }
      return i;
    });
  };

  // После бесшовного прыжка (anim выключен) снова включаем анимацию.
  useEffect(() => {
    if (!carouselAnim) {
      const id = requestAnimationFrame(() => setCarouselAnim(true));
      return () => cancelAnimationFrame(id);
    }
  }, [carouselAnim]);

  const tracks = [
    {
      href: "/track",
      title: "09.03.02 профиль РКБП",
      short: "РКБП",
      img: trackRKBP,
      alt: "Картинка трека РКБП",
    },
    {
      href: "/track2",
      title: "09.03.02 профиль ТВП",
      short: "ТВП",
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

  // Картинки для 4-й карточки карусели. Пока те же — позже заменить.
  const presentationImages2 = [
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

  // Реальные карточки карусели (длина = CAROUSEL_BASE).
  const baseSlides = [
    <div key="track" className="flex h-full w-full flex-col bg-white shadow-2xl rounded-xl p-4 gap-3 overflow-hidden">
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

      <div className="flex items-center justify-center gap-2 bg-black/5 rounded-full p-1">
        {tracks.map((t, idx) => (
            <button
                key={t.href}
                type="button"
                onClick={() => setCurrentTrack(idx)}
                aria-label={`Перейти к: ${t.title}`}
                aria-pressed={currentTrack === idx}
                className={`flex-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    currentTrack === idx
                        ? "bg-black/80 text-white shadow"
                        : "text-black/50 hover:text-black/80"
                }`}
            >
              {t.short}
            </button>
        ))}
      </div>
    </div>,

    <div
        key="presentation"
        onClick={() => {
          setPresentationIndex(0);
          setShowPresentation(true);
        }}
        className="flex h-full w-full flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
    >
      <PresentationSlider images={presentationImages} />
    </div>,

    <Link
        key="camera"
        href={"/camera"}
        className="group flex h-full w-full flex-col bg-white shadow-2xl rounded-xl p-4 gap-4 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] transition-shadow"
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
    </Link>,

    <div key="placeholder" className="flex h-full w-full flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer">
      <PresentationSlider images={presentationImages2} />
    </div>,
  ];

  // Лента из нескольких копий для бесшовной бесконечной прокрутки.
  const carouselSlides = Array.from({ length: CAROUSEL_COPIES }).flatMap((_, copy) =>
    baseSlides.map((node, i) => ({ node, key: `${copy}-${i}` })),
  );

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
      <div className="h-full flex flex-col gap-10">
        <div className="hidden sm:flex h-[100vh] flex-col p-4 sm:p-6">
          <div className="relative flex-1 min-h-0 w-full pb-2">
            {/* Бесконечная карусель: видно 3 карточки, бесшовная прокрутка по кругу */}
            <div className="overflow-hidden w-full h-full">
              <div
                  className={`flex w-full h-full gap-8 ${carouselAnim ? "transition-transform duration-500 ease-out" : ""}`}
                  style={{
                    transform: `translateX(calc(-1 * ${carouselIndex} * ((100% - 4rem) / 3 + 2rem)))`,
                  }}
                  onTransitionEnd={onCarouselTransitionEnd}
              >
                {carouselSlides.map(({ node, key }) => (
                    <div key={key} className="flex-shrink-0 h-full" style={{ width: "calc((100% - 4rem) / 3)" }}>
                      {node}
                    </div>
                ))}
              </div>
            </div>

            {/* Стрелки переключения (overlay, не влияют на внешнюю вёрстку) */}
            <button
                type="button"
                onClick={carouselPrev}
                aria-label="Назад"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg text-2xl text-gray-700 hover:bg-gray-100 transition"
            >
              ‹
            </button>
            <button
                type="button"
                onClick={carouselNext}
                aria-label="Вперёд"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg text-2xl text-gray-700 hover:bg-gray-100 transition"
            >
              ›
            </button>
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

          <div className="flex-1 min-h-0 w-full grid grid-cols-3 grid-rows-1 gap-8 overflow-hidden">
            <div className="flex h-full bg-white shadow-2xl rounded-xl p-4">
              <Video src={"/video.mp4"} />
            </div>
            <div
                onClick={() => setShow3(true)}
                className="h-full flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
            >
              <Image
                  className="w-full min-h-0 flex-1 object-contain"
                  src={lesenka}
                  alt="Картинка трека предметов"
              />
            </div>

            <div className="flex h-full flex-col bg-white shadow-2xl rounded-xl gap-4 p-4">
              <Video src={"/TVP.MP4"} />
            </div>
          </div>
        </div>


        {/* Portal navigation */}
        <div className="shrink-0 p-4 sm:p-6 min-h-screen sm:min-h-0 flex flex-col justify-center sm:block">
          <div className="hidden sm:block mb-3">
            <h2 className="text-white font-semibold text-2xl mb-1">Перейти в систему</h2>
            <p className="text-gray-400 text-sm">
              Расписание преподавателей, контакты и кабинеты — для студентов. Редактирование расписания и курсов — для преподавателей.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/students"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition-colors hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19M15 5.5a3 3 0 0 1 0 5.8M17 13.5a4.5 4.5 0 0 1 3.5 4.4V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium leading-tight tracking-tight text-slate-900">Для студентов</h3>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    без входа
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Список преподавателей кафедры, расписание присутствия в вузе, номера кабинетов, контакты.
                </p>
              </div>
              <svg className="h-5 w-5 flex-shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              href="/teacher/login"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition-colors hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium leading-tight tracking-tight text-slate-900">Для преподавателей</h3>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    вход
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Редактирование расписания, добавление курсов повышения квалификации, график пересдач.
                </p>
              </div>
              <svg className="h-5 w-5 flex-shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              href="/track"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition-colors hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 sm:col-span-2 xl:col-span-1"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8.5 6H14a4 4 0 0 1 4 4v2M18 12v3.5M6 8.5V18h9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium leading-tight tracking-tight text-slate-900">Образовательные треки</h3>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    учебный план
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Дисциплины по семестрам и профилям подготовки — РКБП и ТВП.
                </p>
              </div>
              <svg className="h-5 w-5 flex-shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
