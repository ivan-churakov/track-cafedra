import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import cross from "../image/cross.svg";
import trackImg from "../image/track.svg";
import card4 from "../image/cardSoty.svg";
import card2 from "../image/card123.svg";
import lesenka from "../image/lesenka.svg";
import card11 from "../image/card11.png";
import logoKB from "../image/KBSP_white.png";
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
      <div className="h-full flex flex-col justify-between items-center gap-10 p-4 sm:p-6">
        <div className="h-full grid grid-cols-3 gap-8">
          {/* <div
            onClick={() => setShow1(true)}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
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
          <Link
            href={"/track"}
            className="h-full flex flex-col bg-white shadow-2xl rounded-xl p-4"
          >
            <p className="font-medium text-center text-xl">
              09.03.02 профиль РКБП
            </p>
            <Image
              className="w-full h-full object-contain"
              src={trackImg}
              alt="Картинка трека предметов"
            />
          </Link>
          <div
            onClick={() => setShow2(true)}
            className="h-full flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <p className="font-medium text-center text-xl">
              Профессиональная сфера деятельности выпускника
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card2}
              alt="Профессиональная сфера деятельности выпускника"
            />
          </div>
          <Link
            href={"/track2"}
            className="h-full flex flex-col bg-white shadow-2xl rounded-xl p-4"
          >
            <p className="font-medium text-center text-xl">
              09.03.02 профиль ТВП
            </p>
            <Image
              className="w-full h-full object-contain"
              src={trackImg}
              alt="Картинка трека предметов"
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
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

        <div className="w-full h-full grid grid-cols-3 gap-8">
          <div className="flex bg-white shadow-2xl rounded-xl p-4">
            <Video src={"/video.mp4"} />
          </div>
          <div
            onClick={() => {
              setPresentationIndex(0);
              setShowPresentation(true);
            }}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <PresentationSlider
              images={presentationImages}
              title="Практическая деятельность кафедры"
            />
          </div>
          <div className="flex flex-col bg-white shadow-2xl rounded-xl gap-4 p-4">
            <Video src={"/TVP.MP4"} />
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
            title="Практическая деятельность кафедры"
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
