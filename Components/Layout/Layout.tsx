import * as React from 'react';

export const Layout = ( { children, isOpen, setIsOpen }: any ) => {
	return (
		<>
			<div className={`h-[100vh] bg-cyan-700`}>
				<>{children}</>
			</div>
		</>
	);
};