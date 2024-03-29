import {Html, Head, Main, NextScript} from 'next/document'

export default function Document() {
	return (
		<Html>
			<Head>
				<meta charSet="utf-8"/>
				<link rel="icon" href="/favicon.ico"/>
			</Head>
			<body className={"bg-white"}>
			<Main/>
			<NextScript/>
			</body>
		</Html>
	)
}