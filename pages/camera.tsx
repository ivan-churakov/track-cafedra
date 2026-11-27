import * as React from "react";
import Head from "next/head";
import { CareerCamera } from "../Components/CareerCamera/CareerCamera";

export default function Camera() {
  return (
    <>
      <Head>
        <title>Определение профессии</title>
        <meta name="description" content="Сканирование и подбор профессии кафедры КБ9" />
      </Head>
      <CareerCamera />
    </>
  );
}
