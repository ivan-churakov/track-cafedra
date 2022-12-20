import * as React from 'react';
import { useState } from "react";
import topics from "../public/topic.json";
import { Topic } from "../Components/Track/Topic";

const Track = () => {
	const [ show, setShow ] = useState('');

	const buttonHandler = ( e: any ) => {
		if (show === e.currentTarget.id) {
			setShow('')
		} else {
			setShow(e.currentTarget.id)
		}
	}

	return (
		<div className={"w-[100%] h-full"}>

			<div className="grid grid-cols-2 justify-items-center h-full gap-8">
				<div className={"flex flex-row gap-8"}>
					<div className="relative h-full">
						<div className="w-2 min-h-[300px] h-[1500px] bg-red-500"></div>
						<div className="absolute top-2 -left-40 flex flex-col gap-8">
							{topics.topics.red.map(( topic, index ) => {
								return (
									<Topic key={index} buttonHandler={buttonHandler}
									       show={show} title={topic.title}
									       description={topic.description}
									       color={"red"} left={true}/>
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
									       color={"green"} left={false}/>
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
									       color={"blue"} left={true}/>
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
									       color={"orange"} left={false}/>
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