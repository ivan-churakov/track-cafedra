import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CareerCamera } from "../Components/CareerCamera/CareerCamera";

const makeStream = () => {
  const track = {
    stop: jest.fn(),
    getCapabilities: jest.fn(() => ({})),
    getSettings: jest.fn(() => ({})),
    applyConstraints: jest.fn(),
  };
  return {
    track,
    stream: { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream,
  };
};

describe("CareerCamera", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { configurable: true, get: () => 8 });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { configurable: true, get: () => 8 });
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 640,
      height: 480,
      right: 640,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  });

  test("renders the scanner directly without the legacy iframe", () => {
    const { container } = render(<CareerCamera />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Включить камеру" })).toBeInTheDocument();
  });

  test("shows a useful error when camera permission is denied", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: jest.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError")) },
    });
    render(<CareerCamera />);

    await user.click(screen.getByRole("button", { name: "Включить камеру" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Разрешите доступ к камере");
  });

  test("analyzes the frozen selection frame instead of capturing a zoomed frame again", async () => {
    const user = userEvent.setup();
    const { stream } = makeStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: jest.fn().mockResolvedValue(stream) },
    });
    const drawImage = jest.fn();
    const imageData = new Uint8ClampedArray(8 * 8 * 4).fill(100);
    const context = {
      drawImage,
      getImageData: jest.fn(() => ({ data: imageData })),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
    } as unknown as CanvasRenderingContext2D;
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const { getByTestId } = render(<CareerCamera />);

    await user.click(screen.getByRole("button", { name: "Включить камеру" }));
    fireEvent.pointerDown(getByTestId("camera-viewport"), {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 250,
      clientY: 180,
    });
    expect(drawImage).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Сканировать" }));

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Сканирование/ })).toBeDisabled();
  });
});
