import * as React from "react";

const images = [
  "https://i.pinimg.com/1200x/14/7a/99/147a991d2476e10ed6bb4ef8ff97d3a9.jpg",
  "https://i.pinimg.com/736x/38/4a/cf/384acf8739b73e8dcea6f09f5a44b836.jpg",
  "https://i.pinimg.com/1200x/59/9d/21/599d217cda91ca91367c0bdd98d853e8.jpg",
];

const SliderPage = () => {
  const [index, setIndex] = React.useState(0);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center bg-white">
      <div className="w-1/2 h-1/2">
        <div className="w-full h-full"><img className="w-full h-full object-cover" src={images[index]}/></div>
        <div className="flex justify-between">
          <button onClick={prevSlide}>Предыдущий слайд</button>
          <button onClick={nextSlide}>Следующий слайд</button>
        </div>
      </div>
    </div>
  );
};

export default SliderPage;
