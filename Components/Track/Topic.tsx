import * as React from 'react';
import Link from "next/link";

type Props = {
	buttonHandler: any,
	show: string,
	title: string,
	description: string,
	color: string,
	left: boolean,
	course: string[],
	courseCurrent: number,
};
export const Topic = ( {buttonHandler, show, title, description, color, left, course, courseCurrent}: Props ) => {
	let currentColor;
	switch (color) {
		case 'red': {
			currentColor = 'border-red-track'
			break;
		}
		case 'green': {
			currentColor = 'border-green-track'
			break;
		}
		case 'blue': {
			currentColor = 'border-blue-track'
			break;
		}
		case 'orange': {
			currentColor = 'border-orange-track'
			break;
		}
	}

	return (
		<div className={"relative"}>
			<button id={title} onClick={buttonHandler} className="flex items-center gap-2 z-10">
				{left ?
					<>
						<p className={`w-[200px] ${course.map((el) => el === String(courseCurrent))[0] ? 'text-[16px] font-bold' : 'text-sm font-medium'} hover:opacity-60`}>{title}</p>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-10 h-10 ml-[-8px] border-[8px]' : 'w-6 h-6 border-[6px]'} ${currentColor} bg-white rounded-full`}></div>
					</>
					:
					<>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-10 h-10 ml-[-8px] border-[8px]' : 'w-6 h-6 border-[6px]'} ${currentColor} bg-white rounded-full`}></div>
						<p className={`w-[200px] ${course.map((el) => el === String(courseCurrent))[0] ? 'text-[16px] font-bold' : 'text-sm font-medium'} hover:opacity-60`}>{title}</p>
					</>}
			</button>
			<div className={`absolute ${show === title ? 'visible opacity-100': 'invisible opacity-0'} 
						duration-300 ${left ? '-left-6': 'left-0'} top-12 border-2 bg-white ${currentColor} rounded-lg w-[200px] p-2 z-30`}>
				<p className="text-sm mb-4">{description}</p>
				<Link className={""} href={`/topic/${title}`}>Перейти к предмету</Link>
			</div>
		</div>
	);
};