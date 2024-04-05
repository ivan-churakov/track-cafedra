import * as React from "react";
import { useState } from "react";
import topics from "../public/topic.json";
import { Topic } from "../Components/Track/Topic";
import Image from "next/image";
import discipline1 from "../image/discipline1.svg";
import discipline2 from "../image/discipline2.svg";
import discipline3 from "../image/discipline3.svg";
import discipline4 from "../image/discipline4.svg";
import cross from "../image/cross.svg";
import trackImg from "../image/trackImg.jpeg";
import logo from "../image/logo.jpg";
import card4 from "../image/card1.png";
import card2 from "../image/card2.png";
import card11 from "../image/card11.png";
import logoKB from "../image/KBSP_white.png";
import {Video} from "../Components/Video/Video";
import videoHolder from "../image/video.jpg";
import profile from "../image/profile.jpg";
import card3 from "../image/logos.png";
import vsetreki from "../image/vsetreki.svg";
import qr from "../image/qr-code.png";

export default function Home() {
  const [show, setShow] = useState("");
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
    <div className={"relative w-[100%] h-full "}>
      <div className="flex flex-col h-full justify-between items-center gap-10 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col bg-white shadow-2xl rounded-xl p-4">
            <p className="font-medium text-center text-xl">
              Образовательные программы, реализуемые кафедрой
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card4}
              alt="Картинка трека предметов"
            />
          </div>
          <div className="flex flex-col bg-white shadow-2xl rounded-xl p-4">
            <p className="font-medium text-center text-xl">
              Профессиональная сфера деятельности выпускника
            </p>
            <Image
              className="w-full h-full object-contain"
              src={card2}
              alt="Картинка трека предметов"
            />
          </div>
          <div
            className="flex flex-col bg-white shadow-2xl rounded-xl p-4"
            onClick={() => setOpenTrack(!openTrack)}
          >
            <p className="font-medium text-center text-xl">
              09.03.02 профиль РКБП
            </p>
            <Image
              className="w-full h-full object-contain"
              src={trackImg}
              alt="Картинка трека предметов"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Image
            className="w-[200px] object-contain brightness-[10000]"
            src={logoKB}
            alt="логотип"
          />
          <div className="flex flex-col">
            <p className="text-white font-semibold text-[32px]">
              Кафедра КБ-9 "Предметно-ориентированные информационные системы"
            </p>
            <p className="text-white font-semibold text-[24px]">
              09.03.02 “Информационные системы и технологии”
            </p>
            <p className="text-white font-semibold text-[24px]">
              Опыт, традиции, инновации
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="flex max-h-[367px] bg-white shadow-2xl rounded-xl p-4">
            <Video src={"/video.mp4"}/>
          </div>
          <div className="flex flex-col max-h-[367px] bg-white shadow-2xl rounded-xl p-4">
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
            <p className="font-medium text-center text-xl">
              Что вы будете знать
            </p>
            <Video src={"/words.mp4"}/>
          </div>
        </div>
      </div>

      <div
        className={`${
          openTrack ? "opacity-100 z-50" : "opacity-0 -z-10"
        } w-full h-full bg-black/30 absolute transition-opacity top-0`}
      >
        <div
          className={`relative mx-auto bg-white overflow-hidden w-[95%] h-[86vh] rounded-2xl shadow-2xl mt-[40px] p-8`}
        >
          <Image
            className="absolute top-6 right-6 cursor-pointer"
            onClick={() => setOpenTrack(!openTrack)}
            src={cross}
            alt="cross"
          />
          <div className="relative flex flex-col w-[500px] gap-2 mb-[-80px] z-20">
            <button
              onClick={() => setCurrentTrack(1)}
              className="flex items-center hover:opacity-60 duration-100 gap-4"
            >
              <Image src={discipline1} alt={""} className={"min-w-[78px]"} />
              <h4 className={"text-sm text-left"}>
                Общеобразовательные дисциплины (для всех профилей 09.03.02)
              </h4>
            </button>
            <button
              onClick={() => setCurrentTrack(2)}
              className="flex items-center hover:opacity-60 duration-100 gap-4"
            >
              <Image src={discipline2} alt={""} className={"min-w-[78px]"} />
              <h4 className={"text-sm text-left"}>
                ИТ-дисциплины (для всех профилей 09.03.02)
              </h4>
            </button>
            <button
              onClick={() => setCurrentTrack(3)}
              className="flex items-center hover:opacity-60 duration-100 gap-4"
            >
              <Image src={discipline3} alt={""} className={"min-w-[78px]"} />
              <h4 className={"text-sm text-left"}>
                Дисциплины цикла “Разработка, внедрение, сопровождение ИС”
                (профиль РКБП)
              </h4>
            </button>
            <button
              onClick={() => setCurrentTrack(4)}
              className="flex items-center hover:opacity-60 duration-100 gap-4"
            >
              <Image src={discipline4} alt={""} className={"min-w-[78px]"} />
              <h4 className={"text-sm text-left"}>
                Дисциплины цикла “Информационные системы и технологии” (профиль
                РКБП)
              </h4>
            </button>
            <button
              onClick={() => setCurrentTrack(0)}
              className="flex items-center hover:opacity-60 duration-100 gap-4"
            >
              <Image
                className={"grayscale min-w-[78px]"}
                src={vsetreki}
                alt={""}
              />
              <h4 className={"text-sm text-left"}>Показать все треки</h4>
            </button>
          </div>
          <div className={"absolute top-[300px] flex flex-col gap-4 mb-16"}>
            <button
              onClick={courseHandler}
              name={"1"}
              className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${
                course == 1 && "bg-gray-300"
              }  duration-200 rounded-full py-2 text-center`}
            >
              1 курс
            </button>
            <button
              onClick={courseHandler}
              name={"2"}
              className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${
                course == 2 && "bg-gray-300"
              } duration-200 rounded-full py-2 text-center`}
            >
              2 курс
            </button>
            <button
              onClick={courseHandler}
              name={"3"}
              className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${
                course == 3 && "bg-gray-300"
              } duration-200 rounded-full py-2 text-center`}
            >
              3 курс
            </button>
            <button
              onClick={courseHandler}
              name={"4"}
              className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${
                course == 4 && "bg-gray-300"
              } duration-200 rounded-full py-2 text-center`}
            >
              4 курс
            </button>
            <button
              onClick={courseHandler}
              name={"0"}
              className="w-[200px] bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center"
            >
              Без фильтра
            </button>
          </div>
          <Image
            className="absolute bottom-[20px] right-[20px] w-[200px] 2xl:w-[200px] h-[200px] 2xl:h-[200px]"
            src={qr}
            alt="qr"
          />
          <div className="absolute flex justify-center items-center rounded-2xl bottom-0 2xl:bottom-[-15px] left-[calc(50%-240px)] w-[680px] h-[80px] bg-white border-[8px] border-red-track text-2xl z-20">
            Образовательный трек
          </div>
          <div className="relative h-full mx-[200px]">
            <div
              className={`${
                currentTrack !== 1 && currentTrack !== 0
                  ? "invisible opacity-0"
                  : "visible opacity-100"
              } duration-200`}
            >
              <div className="absolute top-[60px] left-[300px] 2xl:left-[400px] w-2 min-h-[300px] h-[560px] bg-red-track"></div>
              <div className="absolute top-[620px] left-[300px] 2xl:left-[400px] origin-top-left -rotate-45 w-2 h-[150px] bg-red-track"></div>
              <div className="absolute top-[720px] left-[404px] 2xl:left-[504px] w-2 h-[100px] 2xl:h-[200px] bg-red-track"></div>
              <div
                className={`absolute w-[266px] top-[50px] left-[56px] 2xl:left-[156px] flex flex-col gap-1`}
              >
                {topics.topics.red.map((topic, index) => {
                  return (
                    <Topic
                      key={index}
                      buttonHandler={buttonHandler}
                      show={show}
                      title={topic.title}
                      exam={topic?.exam}
                      test={topic?.test}
                      creditUnit={topic?.creditUnit}
                      lecture={topic?.lecture}
                      practice={topic?.practice}
                      color={"red"}
                      left={true}
                      courseCurrent={course}
                      course={topic.course}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className={`${
                currentTrack !== 2 && currentTrack !== 0
                  ? "invisible opacity-0"
                  : "visible opacity-100"
              } duration-200`}
            >
              <div className="absolute top-[-60px] left-[350px] 2xl:left-[450px] w-2 min-h-[300px] h-[630px] bg-green-track"></div>
              <div className="absolute top-[570px] left-[350px] 2xl:left-[450px] origin-top-left -rotate-45 w-2 h-[150px] bg-green-track"></div>
              <div className="absolute top-[671px] left-[454px] 2xl:left-[554px] w-2 h-[130px] 2xl:h-[230px] bg-green-track"></div>
              <div className="absolute left-[344px] 2xl:left-[444px] top-[-68px] flex flex-col gap-1">
                {topics.topics.green.map((topic, index) => {
                  return (
                    <Topic
                      key={index}
                      buttonHandler={buttonHandler}
                      show={show}
                      title={topic.title}
                      exam={topic?.exam}
                      test={topic?.test}
                      creditUnit={topic?.creditUnit}
                      lecture={topic?.lecture}
                      practice={topic?.practice}
                      color={"green"}
                      left={false}
                      courseCurrent={course}
                      course={topic.course}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className={`${
                currentTrack !== 3 && currentTrack !== 0
                  ? "invisible opacity-0"
                  : "visible opacity-100"
              } duration-200`}
            >
              <div className="absolute top-[-60px] right-[150px] 2xl:right-[250px] w-2 min-h-[300px] h-[600px] bg-blue-track"></div>
              <div className="absolute top-[540px] right-[150px] 2xl:right-[250px] origin-top-right rotate-45 w-2 h-[150px] bg-blue-track"></div>
              <div className="absolute top-[641px] right-[254px] 2xl:right-[354px] w-2 h-[130px] 2xl:h-[230px] bg-blue-track"></div>
              <div className="absolute w-[266px] right-[136px] 2xl:right-[236px] top-[-88px] flex flex-col gap-1">
                {topics.topics.blue.map((topic, index) => {
                  return (
                    <Topic
                      key={index}
                      buttonHandler={buttonHandler}
                      show={show}
                      title={topic.title}
                      exam={topic?.exam}
                      test={topic?.test}
                      creditUnit={topic?.creditUnit}
                      lecture={topic?.lecture}
                      practice={topic?.practice}
                      color={"blue"}
                      left={true}
                      courseCurrent={course}
                      course={topic.course}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className={`${
                currentTrack !== 4 && currentTrack !== 0
                  ? "invisible opacity-0"
                  : "visible opacity-100"
              } duration-200`}
            >
              <div className="absolute top-[60px] right-[100px] 2xl:right-[200px] w-2 min-h-[300px] h-[560px] bg-orange-track"></div>
              <div className="absolute top-[620px] right-[100px] 2xl:right-[200px] origin-top-right rotate-45 w-2 h-[150px] bg-orange-track"></div>
              <div className="absolute top-[721px] right-[204px] 2xl:right-[304px] w-2 h-[100px] 2xl:h-[200px] bg-orange-track"></div>
              <div className="absolute top-[40px] w-[236px] -right-[122px] 2xl:right-[-22px] flex flex-col gap-1">
                {topics.topics.orange.map((topic, index) => {
                  return (
                    <Topic
                      key={index}
                      buttonHandler={buttonHandler}
                      show={show}
                      title={topic.title}
                      exam={topic?.exam}
                      test={topic?.test}
                      creditUnit={topic?.creditUnit}
                      lecture={topic?.lecture}
                      practice={topic?.practice}
                      color={"orange"}
                      left={false}
                      courseCurrent={course}
                      course={topic.course}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
