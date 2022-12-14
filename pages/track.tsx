import * as React from 'react';
import { useState } from "react";

const Track = () => {
	const [show, setShow] = useState(false);

	const buttonHandler = (e: any) => {
		setShow(!show)
	}

	return (
		<div className={"w-[90%] h-full ml-auto"}>
			<div className="grid grid-cols-4 justify-items-center h-full gap-8">
				<div className="relative h-full">
					<div className="w-2 min-h-[300px] h-full bg-red-500"></div>
					<button id={"#BigData"} onClick={buttonHandler} className="absolute top-10 -left-2 flex items-center gap-2 z-10">
						<div className="w-6 h-6 border-red-500 bg-white border-[6px] rounded-full"></div>
						<p className="w-16 text-sm font-medium">Большие данные</p>
					</button>
					<div className={`absolute ${show ? 'block': 'hidden'} left-4 top-20 bg-blue-500 w-fit z-20`}>
						<p className="text-sm">Большие данные очень хороший предмет)</p>
					</div>
				</div>
				<div className="h-full">
					<div className="w-2 min-h-[300px] h-full bg-green-300"></div>
				</div>
				<div className="h-full">
					<div className="w-2 min-h-[300px] h-full bg-blue-500"></div>
				</div>
				<div className="h-full">
					<div className="w-2 min-h-[300px] h-full bg-orange-400"></div>
				</div>
			</div>
		</div>
	);
};

export default Track;