import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface PresentationSliderProps {
  images: string[];
  title?: string;
  autoPlayInterval?: number; // интервал в миллисекундах
  autoPlay?: boolean; // включить/выключить автоплей
  showArrows?: boolean; // показывать ли стрелки
  showCounter?: boolean; // показывать ли счетчик
  initialIndex?: number; // начальный индекс слайда
}

export const PresentationSlider: React.FC<PresentationSliderProps> = ({
  images,
  title,
  autoPlayInterval = 5000, // по умолчанию 5 секунд
  autoPlay = true, // по умолчанию включен
  showArrows = false, // по умолчанию выключены
  showCounter = false, // по умолчанию выключен
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Автоматическое переключение слайдов
  useEffect(() => {
    if (images.length > 1 && autoPlay) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [images.length, autoPlayInterval, autoPlay]);

  // Обновление индекса при изменении initialIndex
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Сброс таймера при ручном переключении (только если автоплей включен)
  const resetAutoPlay = () => {
    if (!autoPlay) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    }
  };

  const handlePrevSlide = () => {
    prevSlide();
    resetAutoPlay();
  };

  const handleNextSlide = () => {
    nextSlide();
    resetAutoPlay();
  };

  const handleGoToSlide = (index: number) => {
    goToSlide(index);
    resetAutoPlay();
  };

  return (
    <div className="flex flex-col h-full w-full">
      {title && (
        <p className="font-medium text-center text-xl mb-4">{title}</p>
      )}
      <div className="relative flex-1 w-full">
        <div className="relative w-full h-full">
          <Image
            src={images[currentIndex]}
            alt={`Слайд ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority={currentIndex === 0}
          />
        </div>

        {/* Navigation buttons */}
        {images.length > 1 && showArrows && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Предыдущий слайд"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Следующий слайд"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => handleGoToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Перейти к слайду ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide counter */}
        {images.length > 1 && showCounter && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

