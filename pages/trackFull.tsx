import { useState } from "react";
import topics from "../public/topic.json";
import { TopicSmall } from "../Components/Track/TopicSmall";
import Image from "next/image";
import discipline1 from "../image/discipline1.svg";
import discipline2 from "../image/discipline2.svg";
import discipline3 from "../image/discipline3.svg";
import discipline4 from "../image/discipline4.svg";
// import { Topic } from "../Components/Track/Topic";

const TrackFull = () => {
  const [show, setShow] = useState("");
  const [course, setCourse] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);

  const buttonHandler = (e: any) => {
    if (show === e.currentTarget.id) {
      setShow("");
    } else {
      setShow(e.currentTarget.id);
    }
  };

  const courseHandler = (e: any) => {
    setCourse(e.target.name);
  };

  return (
    <div className={"relative w-[100%] h-full"}>
      <div className="absolute left-[40%]">
        <div className="absolute top-[100px] w-[5px] min-h-[300px] h-[400px] bg-red-track"></div>
        <div className="absolute top-[500px] origin-top-left -rotate-45 w-[5px] h-[150px] bg-red-track"></div>
        <div className="absolute top-[601px] left-[104px] w-[5px] h-[100px] bg-red-track"></div>
        <div className="absolute w-[266px] top-[90px] -left-[245px] flex flex-col gap-4">
          <TopicSmall
            buttonHandler={buttonHandler}
            show={show}
            title={'Управление ИТ-проектами'}
            description={"Управление ИТ-проектами очень хороший предмет)"}
            color={"red"}
            left={true}
            courseCurrent={course}
            course={["4"]}
          />
          <TopicSmall
            buttonHandler={buttonHandler}
            show={show}
            title={'Социальная психология и педагогия'}
            description={"Социальная психология и педагогия очень хороший предмет)"}
            color={"red"}
            left={true}
            courseCurrent={course}
            course={["2"]}
          />
        </div>
      </div>
    </div>
  );
};

export default TrackFull;
