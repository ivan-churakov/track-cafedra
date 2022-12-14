import * as React from 'react';
import { Header } from "../Header/Header";

export const Layout = ( { children, isOpen, setIsOpen }: any ) => {
	return (
		<>
			<Header isOpen={isOpen} setIsOpen={setIsOpen}/>
			<div className={`container mx-auto h-full px-4 sm:px-6 py-2`}>
				<>{children}</>
			</div>
		</>
	);
};