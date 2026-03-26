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
      <header className="w-full h-fit flex items-end flex-row justify-between py-4 px-6 gap-4">
        <div className="w-full">
          <Link href="/" className="flex items-end flex-col cursor-pointer">
            <span className="text-2xl">
              Профиль &laquo;Разработка кроссплатформенных бизнес-приложений&raquo;
            </span>
            <span className="">
              09.03.02 &laquo;Информационные системы и технологии&raquo;
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/teachers"
            className="text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap"
          >
            Преподаватели
          </Link>
        </nav>
      </header>
    </div>
  );
};
