import { captureVideoFrame, lockCameraZoom } from "../lib/career-camera/camera";

describe("career camera capture", () => {
  test("locks the current zoom when the camera exposes zoom controls", async () => {
    const applyConstraints = jest.fn().mockResolvedValue(undefined);
    const track = {
      getCapabilities: () => ({ zoom: { min: 1, max: 4, step: 0.1 } }),
      getSettings: () => ({ zoom: 1.4 }),
      applyConstraints,
    } as unknown as MediaStreamTrack;

    await expect(lockCameraZoom(track)).resolves.toBe(true);
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 1.4 }] });
  });

  test("does not require zoom support", async () => {
    const applyConstraints = jest.fn();
    const track = {
      getCapabilities: () => ({}),
      getSettings: () => ({}),
      applyConstraints,
    } as unknown as MediaStreamTrack;

    await expect(lockCameraZoom(track)).resolves.toBe(false);
    expect(applyConstraints).not.toHaveBeenCalled();
  });

  test("keeps the camera usable when zoom locking is rejected", async () => {
    const track = {
      getCapabilities: () => ({ zoom: { min: 1, max: 4 } }),
      getSettings: () => ({ zoom: 2 }),
      applyConstraints: jest.fn().mockRejectedValue(new Error("Unsupported")),
    } as unknown as MediaStreamTrack;

    await expect(lockCameraZoom(track)).resolves.toBe(false);
  });

  test("copies the current video frame into the selection canvas", () => {
    const drawImage = jest.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const video = { videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;

    expect(captureVideoFrame(video, canvas)).toEqual({ width: 1280, height: 720 });
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
  });
});
