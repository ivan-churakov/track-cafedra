import Image from "next/image";
import logo from "../image/Logo.svg"
import trackImg from "../image/track-img.png"
import disciplines from "../image/disciplines.png"
import year from "../image/year.png"
import Link from "next/link";

export default function Home() {
	return (
		<div>
			<div className={'flex flex-col mb-16'}>
				<h1 className={"font-bold text-[100px] text-center leading-[98%] mb-8"}>
					План обучения для кафедры кб-9
				</h1>
				<h3 className={"text-xl text-center mb-4"}>
					Если вы устали каждый раз залезать в огромную таблицу и искать там нужный предмет, то этот план для вас.
				</h3>
				<p className="text-lg opacity-70 text-center">План создан студентами для студентов.</p>
			</div>
			<div className="flex justify-center gap-8">
				<div className="flex flex-col items-center border-[1px] border-[#E4E4E4] rounded-xl p-8">
					<Image src={logo} alt={'кб-9'} className={"mb-6"}/>
					<h5 className="font-bold text-2xl mb-6">Новый план</h5>
					<Image src={trackImg} alt={'трек предметов'}
					       className={"border-[1px] border-[#E4E4E4] rounded-xl mb-8"}
					       width={300}/>
					<Link href={'/track'} className="font-bold text-lg bg-black text-white rounded-full py-2 px-4">Попробуйте сами</Link>
				</div>
				<div className="flex flex-col gap-8">
					<div className="flex flex-col items-center border-[1px] border-[#E4E4E4] rounded-xl p-4">
						<h5 className="font-medium text-xl mb-4">Разные дисциплины</h5>
						<Image src={disciplines} alt={'дисциплины'}
						       className={"border-[1px] border-[#E4E4E4] rounded-xl"}
						       width={200}/>
					</div>
					<div className="flex flex-col items-center border-[1px] border-[#E4E4E4] rounded-xl p-4">
						<h5 className="font-medium text-xl mb-4">Все курсы бакалавриата</h5>
						<Image src={year} alt={'4 курса'}
						       className={"border-[1px] border-[#E4E4E4] rounded-xl"}
						       width={200}/>
					</div>
				</div>
			</div>
		</div>
	)
}
