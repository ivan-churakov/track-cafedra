import '../styles/globals.css'
import type { AppProps } from 'next/app'
import localFont from '@next/font/local'
import { useEffect, useState } from "react";
import { Layout } from "../Components/Layout/Layout";

const rubik = localFont({
  src: [
    {
      path: '../fonts/Rubik-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Rubik-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Rubik-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Rubik-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Rubik-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-rubik',
});

export default function App({ Component, pageProps }: AppProps) {
  const [ isMenuOpen, setIsMenuOpen ] = useState(false)
  const [ isLoading, setIsLoading ] = useState(true)

  useEffect(() => {
    if (isLoading) {
      setIsLoading(false)
    }
  }, [ isLoading ])

  return <div>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div className={`w-full h-full min-h-[100vh] bg-dark text-light`}>
      <main className={`${rubik.variable} font-sand min-h-[100vh] h-full font-sans`}>
        {isLoading ? (
            <div className={"w-full h-full flex justify-center items-center"}>
              Loading...
            </div>
          )
          : <Layout isOpen={isMenuOpen} setIsOpen={setIsMenuOpen}>
            <Component {...pageProps} />
          </Layout>}
      </main>
    </div>
  </div>
}
