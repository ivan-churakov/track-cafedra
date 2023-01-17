import * as React from 'react';
import { Dispatch, FC, SetStateAction } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../image/Logo.svg"
import { useRouter } from "next/router";

interface Props {
	isOpen: boolean,
	setIsOpen: Dispatch<SetStateAction<boolean>>
}

export const Header = ( { isOpen, setIsOpen }: Props ) => {
	const router = useRouter();
	return (
		<div className={`w-full bg-dark z-50 mb-12`}>
			<header className="container mx-auto top-0 h-fit flex flex-row justify-between items-center py-[50px] px-6 gap-4">
				<div className="relative left-0">
					<Link href='/' className="cursor-pointer">
						<Image
							className="cursor-pointer"
							alt="КБ-9"
							src={logo}
							width={118}
							height={24}
						/>
					</Link>
				</div>
				<nav className="items-center relative flex font-medium text-sm gap-10">
					<p className={`flex items-center hover:text-gray-500 mx-0 my-[8px] ${router.pathname === '/' ? 'text-light' : 'text-gray'}`}>
						<Link href='/'>Главная</Link>
					</p>
					<p className={`flex items-center hover:text-gray-500 mx-0 my-[8px] ${router.pathname === '/track' ? 'text-light' : 'text-gray'}`}>
						<Link href='/track'>Трек предметов</Link>
					</p>
				</nav>
			</header>
		</div>
	);
};