import { useState } from "react";
import topics from "../public/topic.json";
import { TopicSmall } from "../Components/Track/TopicSmall";
import Image from "next/image";
import discipline1 from "../image/discipline1.svg"
import discipline2 from "../image/discipline2.svg"
import discipline3 from "../image/discipline3.svg"
import discipline4 from "../image/discipline4.svg"

const TrackFull = () => {
	const [ show, setShow ] = useState('');
	const [ course, setCourse ] = useState(0);
	const [ currentTrack, setCurrentTrack ] = useState(0);

	const buttonHandler = ( e: any ) => {
		if (show === e.currentTarget.id) {
			setShow('')
		} else {
			setShow(e.currentTarget.id)
		}
	}

	const courseHandler = ( e: any ) => {
		setCourse(e.target.name)
	}

	return (
		<div className={"w-[100%] h-full"}>
			<div className="flex flex-col gap-2 mb-12">
				<button onClick={() => setCurrentTrack(1)} className="flex items-center hover:opacity-60 duration-100 gap-4">
					<Image src={discipline1} alt={""} className={"min-w-[78px]"}/>
					<h4 className={"text-lg text-left"}>Общеобразовательные дисциплины (для всех профилей 09.03.02)</h4>
				</button>
				<button onClick={() => setCurrentTrack(2)} className="flex items-center hover:opacity-60 duration-100 gap-4">
					<Image src={discipline2} alt={""} className={"min-w-[78px]"}/>
					<h4 className={"text-lg text-left"}>ИТ-дисциплины (для всех профилей 09.03.02)</h4>
				</button>
				<button onClick={() => setCurrentTrack(3)} className="flex items-center hover:opacity-60 duration-100 gap-4">
					<Image src={discipline3} alt={""} className={"min-w-[78px]"}/>
					<h4 className={"text-lg text-left"}>Дисциплины цикла “Разработка, внедрение, сопровождение ИС” (профиль РКБП)</h4>
				</button>
				<button onClick={() => setCurrentTrack(4)} className="flex items-center hover:opacity-60 duration-100 gap-4">
					<Image src={discipline4} alt={""} className={"min-w-[78px]"}/>
					<h4 className={"text-lg text-left"}>Дисциплины цикла “Информационные системы и технологии” (профиль РКБП)</h4>
				</button>
				<button onClick={() => setCurrentTrack(0)} className="flex items-center hover:opacity-60 duration-100 gap-4">
					<Image className={"grayscale min-w-[78px]"} src={discipline4} alt={""}/>
					<h4 className={"text-lg text-left"}>Показать все треки</h4>
				</button>
			</div>
			<div className={"flex gap-4 mb-16"}>
				<button
					onClick={courseHandler} name={"1"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					1 курс
				</button>
				<button
					onClick={courseHandler} name={"2"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					2 курс
				</button>
				<button
					onClick={courseHandler} name={"3"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					3 курс
				</button>
				<button
					onClick={courseHandler} name={"4"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					4 курс
				</button>
				<button
					onClick={courseHandler} name={"0"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					Без фильтра
				</button>
			</div>
			<div className="grid grid-cols-2 justify-items-center h-full gap-8">
				<div className={"flex flex-row gap-10"}>
					<div className={`relative h-full 
					${currentTrack !== 1 && currentTrack !== 0 ? 'invisible opacity-0' : 'visible opacity-100'}
					duration-200`}>
						<div className="w-[6px] min-h-[300px] h-[650px] bg-red-track"></div>
						<div className={`absolute top-2 -left-[214px] flex flex-col gap-2`}>
							{topics.topics.red.map(( topic, index ) => {
								return (
									<TopicSmall key={index} buttonHandler={buttonHandler}
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
						<div className="w-[6px] min-h-[300px] h-full bg-green-track"></div>
						<div className="absolute top-2 left-[-6px] flex flex-col gap-2">
							{topics.topics.green.map(( topic, index ) => {
								return (
									<TopicSmall key={index} buttonHandler={buttonHandler}
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
						<div className="w-[6px] min-h-[300px] h-full bg-blue-track"></div>
						<div className="absolute top-2 -left-[214px] flex flex-col gap-2">
							{topics.topics.blue.map(( topic, index ) => {
								return (
									<TopicSmall key={index} buttonHandler={buttonHandler}
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
						<div className="w-[6px] min-h-[300px] h-full bg-orange-track"></div>
						<div className="absolute top-2 left-[-6px] flex flex-col gap-2">
							{topics.topics.orange.map(( topic, index ) => {
								return (
									<TopicSmall key={index} buttonHandler={buttonHandler}
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
			</div>
		</div>
	);
};

export default TrackFull;