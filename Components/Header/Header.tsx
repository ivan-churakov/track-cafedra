import * as React from "react";
import { Dispatch, FC, SetStateAction } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../image/Logo.svg";
import { useRouter } from "next/router";

interface Props {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const Header = ({ isOpen, setIsOpen }: Props) => {
  const router = useRouter();
  return (
    <div className={`w-full bg-dark z-50 mb-2`}>
      <header className="absolute w-full top-0 h-fit flex items-end flex-row justify-between py-4 px-6 gap-4">
        <div className="w-full">
          <Link href="/" className="flex items-end flex-col cursor-pointer">
            {/* <Image
							className="cursor-pointer"
							alt="КБ-9"
							src={logo}
							width={118}
							height={24}
						/> */}
            <span className="text-2xl">
              Профиль “Разработка кроссплатформенных бизнес-приложений”
            </span>
            <span className="">
              09.03.02 “Информационные системы и технологии”
            </span>
          </Link>
        </div>
      </header>
    </div>
  );
};
