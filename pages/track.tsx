import * as React from 'react';
import { useState } from "react";
import topics from "../public/topic.json";
import { Topic } from "../Components/Track/Topic";

const Track = () => {
	const [ show, setShow ] = useState('');
	const [course, setCourse] = useState(0)

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
			<div className={"flex gap-4 mb-16"}>
				<button
					onClick={courseHandler}	name={"1"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					1 курс
				</button>
				<button
					onClick={courseHandler}	name={"2"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					2 курс
				</button>
				<button
					onClick={courseHandler}	name={"3"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					3 курс
				</button>
				<button
					onClick={courseHandler}	name={"4"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					4 курс
				</button>
				<button
					onClick={courseHandler}	name={"0"}
					className="w-full bg-gray-100 hover:bg-gray-200 duration-200 rounded-full py-2 text-center">
					Без фильтра
				</button>
			</div>
			<div className="grid grid-cols-2 justify-items-center h-full gap-8">
				<div className={"flex flex-row gap-8"}>
					<div className="relative h-full">
						<div className="w-2 min-h-[300px] h-[1500px] bg-red-500"></div>
						<div className={`absolute top-2 -left-40 flex flex-col gap-8`}>
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
					<div className="relative h-full">
						<div className="w-2 min-h-[300px] h-full bg-green-300"></div>
						<div className="absolute top-2 -left-2 flex flex-col gap-8">
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
				<div className={"flex flex-row gap-8"}>
					<div className="relative h-full">
						<div className="w-2 min-h-[300px] h-full bg-blue-500"></div>
						<div className="absolute top-2 -left-40 flex flex-col gap-8">
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
					<div className="relative h-full">
						<div className="w-2 min-h-[300px] h-full bg-orange-400"></div>
						<div className="absolute top-2 -left-2 flex flex-col gap-8">
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
		</div>
	);
};

export default Track;