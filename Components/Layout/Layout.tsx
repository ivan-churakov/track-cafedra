import * as React from 'react';

export const Layout = ( { children, isOpen, setIsOpen }: any ) => {
	return (
		<>
			<div className={`bg-cyan-700`}>
				<>{children}</>
			</div>
		</>
	);
};