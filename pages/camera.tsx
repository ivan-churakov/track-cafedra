import * as React from "react";

export default function Camera() {
  return (
    <iframe
      src="/camera/career-camera.html"
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Определение профессии"
      allow="camera"
    />
  );
}
