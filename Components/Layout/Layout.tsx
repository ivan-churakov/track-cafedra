import * as React from 'react';
import { Header } from "../Header/Header";

export const Layout = ( { children, isOpen, setIsOpen }: any ) => {
	return (
		<>
			<Header isOpen={isOpen} setIsOpen={setIsOpen}/>
			<div className={`h-full px-4 sm:px-6 py-2 pb-0`}>
				<>{children}</>
			</div>
		</>
	);
};