import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import cross from "../image/cross.svg";
import trackImg from "../image/track.svg";
import card4 from "../image/cardSoty.svg";
import card2 from "../image/card123.svg";
import card11 from "../image/card11.png";
import logoKB from "../image/KBSP_white.png";
import { Video } from "../Components/Video/Video";
import Link from "next/link";

export default function Home() {
  const [show, setShow] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [course, setCourse] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [openTrack, setOpenTrack] = useState(false);

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
            className="w-full h-full object-cover"
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
            src={card11}
            alt="Картинка трека предметов"
          />
        </div>
      </div>
      <div className="h-full flex flex-col justify-between items-center gap-10 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-8">
          {/* <div
            onClick={() => setShow1(true)}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <p className="font-medium text-center text-xl">
              Образовательные программы, реализуемые кафедрой
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card4}
              alt="Картинка трека предметов"
            />
          </div> */}
          <Link
            href={"/track2"}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4"
          >
            <p className="font-medium text-center text-xl">
              09.03.02 профиль ТВрП
            </p>
            <Image
              className="w-full h-full object-contain"
              src={trackImg}
              alt="Картинка трека предметов"
            />
          </Link>
          <div
            onClick={() => setShow2(true)}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
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
            href={"/track"}
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4"
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

        <div className="grid grid-cols-3 gap-8">
          <div className="flex max-h-[367px] bg-white shadow-2xl rounded-xl p-4">
            <Video src={"/video.mp4"} />
          </div>
          <div
            onClick={() => setShow3(true)}
            className="flex flex-col max-h-[367px] bg-white shadow-2xl rounded-xl p-4 cursor-pointer"
          >
            <p className="font-medium text-center text-xl">
              Разработка кроссплатформенных бизнес-приложений
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card11}
              alt="Картинка трека предметов"
            />
          </div>
          <div className="flex flex-col max-h-[367px] bg-white shadow-2xl rounded-xl gap-4 p-4">
            <Video src={"/words.mp4"} />
          </div>
        </div>
      </div>

    </div>
  );
}
