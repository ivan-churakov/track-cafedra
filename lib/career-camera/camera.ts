type CameraVideoConstraints = MediaTrackConstraints & {
  resizeMode?: "none" | "crop-and-scale";
};

export const CAMERA_VIDEO_CONSTRAINTS: CameraVideoConstraints = {
  facingMode: "user",
  resizeMode: "none",
};

type ZoomCapabilities = MediaTrackCapabilities & {
  zoom?: { min: number; max: number; step?: number };
};

type ZoomSettings = MediaTrackSettings & { zoom?: number };
type ZoomConstraint = MediaTrackConstraintSet & { zoom?: number };

export const lockCameraZoom = async (track: MediaStreamTrack): Promise<boolean> => {
  if (typeof track.getCapabilities !== "function") return false;
  const capabilities = track.getCapabilities() as ZoomCapabilities;
  if (!capabilities.zoom) return false;

  const settings = typeof track.getSettings === "function"
    ? track.getSettings() as ZoomSettings
    : {};
  const zoom = settings.zoom ?? capabilities.zoom.min;
  if (zoom === undefined) return false;

  try {
    await track.applyConstraints({ advanced: [{ zoom } as ZoomConstraint] });
    return true;
  } catch {
    return false;
  }
};

export const captureVideoFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): { width: number; height: number } => {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error("Камера ещё не подготовила кадр");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Браузер не поддерживает обработку кадра");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(video, 0, 0, width, height);
  return { width, height };
};
