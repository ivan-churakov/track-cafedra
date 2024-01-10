import * as React from 'react';

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
						<p className={`w-[230px] ${course.map((el) => el === String(courseCurrent))[0] ? 'text-[14px] font-bold' : 'text-[12px] font-medium'} hover:opacity-60`}>{title}</p>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-8 h-8 ml-[-6px] border-[8px]' : 'w-5 h-5 border-[6px]'} ${currentColor} bg-white rounded-full`}></div>
					</>
					:
					<>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-8 h-8 ml-[-6px] border-[8px]' : 'w-5 h-5 border-[6px]'} ${currentColor} bg-white rounded-full`}></div>
						<p className={`w-[230px] ${course.map((el) => el === String(courseCurrent))[0] ? 'text-[14px] font-bold' : 'text-[12px] font-medium'} hover:opacity-60`}>{title}</p>
					</>}
			</button>
			<div className={`absolute ${show === title ? 'visible opacity-100': 'invisible opacity-0'} 
						duration-300 ${left ? '-left-6': 'left-0'} top-12 border-2 bg-white ${currentColor} rounded-lg w-[200px] p-2 z-30`}>
				<p className="text-sm">{description}</p>
			</div>
		</div>
	);
};