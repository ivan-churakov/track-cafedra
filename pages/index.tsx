import * as React from "react";
import { useState } from "react";
import topics from "../public/topic.json";
import { Topic } from "../Components/Track/Topic";
import Image from "next/image";
import discipline1 from "../image/discipline1.svg";
import discipline2 from "../image/discipline2.svg";
import discipline3 from "../image/discipline3.svg";
import discipline4 from "../image/discipline4.svg";
import vsetreki from "../image/vsetreki.svg";

export default function Home() {
  const [show, setShow] = useState("");
  const [course, setCourse] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);

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
    <div className={"w-[100%] h-full"}>
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
            Дисциплины цикла “Разработка, внедрение, сопровождение ИС” (профиль
            РКБП)
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
          <Image className={"grayscale min-w-[78px]"} src={vsetreki} alt={""} />
          <h4 className={"text-sm text-left"}>Показать все треки</h4>
        </button>
      </div>
      <div className={"absolute top-[400px] flex flex-col gap-4 mb-16"}>
        <button
          onClick={courseHandler}
          name={"1"}
          className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${course == 1 && "bg-gray-300"}  duration-200 rounded-full py-2 text-center`}
        >
          1 курс
        </button>
        <button
          onClick={courseHandler}
          name={"2"}
          className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${course == 2 && "bg-gray-300"} duration-200 rounded-full py-2 text-center`}
        >
          2 курс
        </button>
        <button
          onClick={courseHandler}
          name={"3"}
          className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${course == 3 && "bg-gray-300"} duration-200 rounded-full py-2 text-center`}
        >
          3 курс
        </button>
        <button
          onClick={courseHandler}
          name={"4"}
          className={`w-[200px] bg-gray-100 hover:bg-gray-200 ${course == 4 && "bg-gray-300"} duration-200 rounded-full py-2 text-center`}
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
          <div className="absolute top-[100px] left-[300px] 2xl:left-[400px] w-2 min-h-[300px] h-[560px] bg-red-track"></div>
          <div className="absolute top-[660px] left-[300px] 2xl:left-[400px] origin-top-left -rotate-45 w-2 h-[150px] bg-red-track"></div>
          <div className="absolute top-[761px] left-[404px] 2xl:left-[504px] w-2 h-[100px] 2xl:h-[200px] bg-red-track"></div>
          <div
            className={`absolute w-[266px] top-[100px] left-[56px] 2xl:left-[156px] flex flex-col gap-1`}
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
          <div className="absolute top-0 left-[350px] 2xl:left-[450px] w-2 min-h-[300px] h-[630px] bg-green-track"></div>
          <div className="absolute top-[630px] left-[350px] 2xl:left-[450px] origin-top-left -rotate-45 w-2 h-[150px] bg-green-track"></div>
          <div className="absolute top-[731px] left-[454px] 2xl:left-[554px] w-2 h-[130px] 2xl:h-[230px] bg-green-track"></div>
          <div className="absolute left-[344px] 2xl:left-[444px] flex flex-col gap-1">
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
          <div className="absolute top-[30px] right-[150px] 2xl:right-[250px] w-2 min-h-[300px] h-[600px] bg-blue-track"></div>
          <div className="absolute top-[630px] right-[150px] 2xl:right-[250px] origin-top-right rotate-45 w-2 h-[150px] bg-blue-track"></div>
          <div className="absolute top-[731px] right-[254px] 2xl:right-[354px] w-2 h-[130px] 2xl:h-[230px] bg-blue-track"></div>
          <div className="absolute w-[266px] right-[136px] 2xl:right-[236px] flex flex-col gap-1">
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
          <div className="absolute top-[100px] right-[100px] 2xl:right-[200px] w-2 min-h-[300px] h-[560px] bg-orange-track"></div>
          <div className="absolute top-[660px] right-[100px] 2xl:right-[200px] origin-top-right rotate-45 w-2 h-[150px] bg-orange-track"></div>
          <div className="absolute top-[761px] right-[204px] 2xl:right-[304px] w-2 h-[100px] 2xl:h-[200px] bg-orange-track"></div>
          <div className="absolute top-[90px] w-[236px] -right-[122px] 2xl:right-[-22px] flex flex-col gap-1">
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

      {/* <div className="grid grid-cols-2 justify-items-center h-full gap-8">
				<div className={"flex flex-row gap-10"}>
					<div className={`relative h-full 
					${currentTrack !== 1 && currentTrack !== 0 ? 'invisible opacity-0' : 'visible opacity-100'}
					duration-200`}>
						<div className="w-2 min-h-[300px] h-[500px] bg-red-track"></div>
						<div className={`absolute top-2 -left-[216px] flex flex-col gap-6`}>
							{topics.topics.red.map(( topic, index ) => {
								return (
									<Topic key={index} buttonHandler={buttonHandler}
									       show={show} title={topic.title}
									       description={topic.description}
									       color={"red"} left={true} courseCurrent={course} course={topic.course}/>
								)
							})}
						</div>
					</div>
					<div className={`relative h-full 
					${currentTrack !== 2 && currentTrack !== 0 ? 'invisible opacity-0' : 'visible opacity-100'}
					duration-200`}>
						<div className="w-2 min-h-[300px] h-full bg-green-track"></div>
						<div className="absolute top-2 -left-2 flex flex-col gap-6">
							{topics.topics.green.map(( topic, index ) => {
								return (
									<Topic key={index} buttonHandler={buttonHandler}
									       show={show} title={topic.title}
									       description={topic.description}
									       color={"green"} left={false} courseCurrent={course} course={topic.course}/>
								)
							})}
						</div>
					</div>
				</div>
				<div className={"flex flex-row gap-10"}>
					<div className={`relative h-full 
					${currentTrack !== 3 && currentTrack !== 0 ? 'invisible opacity-0' : 'visible opacity-100'}
					duration-200`}>
						<div className="w-2 min-h-[300px] h-full bg-blue-track"></div>
						<div className="absolute top-2 -left-[216px] flex flex-col gap-6">
							{topics.topics.blue.map(( topic, index ) => {
								return (
									<Topic key={index} buttonHandler={buttonHandler}
									       show={show} title={topic.title}
									       description={topic.description}
									       color={"blue"} left={true} courseCurrent={course} course={topic.course}/>
								)
							})}
						</div>
					</div>
					<div className={`relative h-full 
					${currentTrack !== 4 && currentTrack !== 0 ? 'invisible opacity-0' : 'visible opacity-100'}
					duration-200`}>
						<div className="w-2 min-h-[300px] h-full bg-orange-track"></div>
						<div className="absolute top-2 -left-2 flex flex-col gap-6">
							{topics.topics.orange.map(( topic, index ) => {
								return (
									<Topic key={index} buttonHandler={buttonHandler}
									       show={show} title={topic.title}
									       description={topic.description}
									       color={"orange"} left={false} courseCurrent={course} course={topic.course}/>
								)
							})}
						</div>
					</div>
				</div>
			</div>
			<div className={`flex justify-center items-center mx-auto w-2/3 border-8 border-b-0 
				${currentTrack === 1 ? 'border-red-track text-red-track'
				: currentTrack === 2 ? 'border-green-track text-green-track'
					: currentTrack === 3 ? 'border-blue-track text-blue-track'
						: currentTrack === 4 ? 'border-orange-track text-orange-track' 
							: 'border-red-track text-red-track grayscale'} rounded-tr-3xl rounded-tl-3xl py-4`}>
				<p className="font-bold text-lg uppercase">Образовательный трек</p>
			</div> */}
    </div>
  );
}
