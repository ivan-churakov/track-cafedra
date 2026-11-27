import { drawScanOverlay, renderContourMask } from "../lib/career-camera/renderer";

const makeGradient = () => ({ addColorStop: jest.fn() });

const makeContext = () =>
  ({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    createLinearGradient: jest.fn(makeGradient),
  }) as unknown as CanvasRenderingContext2D;

describe("career camera renderer", () => {
  test("draws anti-aliased tangent lines instead of pixel circles", () => {
    const context = makeContext();
    const canvas = { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;

    renderContourMask(canvas, [
      { x: 20, y: 30, strength: 0.8, tangentX: 1, tangentY: 0 },
    ], 100, 80);

    expect(context.lineTo).toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
    expect(context.lineCap).toBe("round");
    expect(context.stroke).toHaveBeenCalled();
  });

  test("renders the overlay at device pixel density", () => {
    const context = makeContext();
    const canvas = { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;
    const mask = {} as HTMLCanvasElement;

    drawScanOverlay(
      canvas,
      mask,
      { x: 0, y: 0, width: 100, height: 80 },
      40,
      "live",
      100,
      80,
      2,
    );

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(160);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(context.drawImage).toHaveBeenCalledTimes(1);
  });

  test("does not leave a full contour after completion", () => {
    const context = makeContext();
    const canvas = { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;

    drawScanOverlay(
      canvas,
      {} as HTMLCanvasElement,
      { x: 0, y: 0, width: 100, height: 80 },
      120,
      "complete",
      100,
      80,
    );

    expect(context.drawImage).not.toHaveBeenCalled();
  });
});
