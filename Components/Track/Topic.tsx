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
			currentColor = 'border-red-500'
			break;
		}
		case 'green': {
			currentColor = 'border-green-300'
			break;
		}
		case 'blue': {
			currentColor = 'border-blue-500'
			break;
		}
		case 'orange': {
			currentColor = 'border-orange-400'
			break;
		}
	}

	return (
		<div className={"relative"}>
			<button id={title} onClick={buttonHandler} className="flex items-center gap-2 z-10">
				{left ?
					<>
						<p className={`w-36 ${course.map((el) => el === String(courseCurrent))[0] ? 'text-[16px] font-bold' : 'text-sm font-medium'} hover:opacity-60`}>{title}</p>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-8 h-8 ml-[-4px]' : 'w-6 h-6'} ${currentColor} bg-white border-[6px] rounded-full`}></div>
					</>
					:
					<>
						<div className={`${course.map((el) => el === String(courseCurrent))[0] ? 'w-8 h-8 ml-[-4px]' : 'w-6 h-6'} ${currentColor} bg-white border-[6px] rounded-full`}></div>
						<p className="w-36 text-sm font-medium hover:opacity-60">{title}</p>
					</>}
			</button>
			<div className={`absolute ${show === title ? 'visible opacity-100': 'invisible opacity-0'} 
						duration-300 ${left ? '-left-6': 'left-0'} top-12 border-2 bg-white ${currentColor} rounded-lg w-[200px] p-2 z-30`}>
				<p className="text-sm">{description}</p>
			</div>
		</div>
	);
};