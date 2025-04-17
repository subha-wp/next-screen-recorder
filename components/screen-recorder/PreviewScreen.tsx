import React from "react";
import { CameraPreview } from "./CameraPreview";
import type { RecordingMode } from "@/app/page";

interface PreviewScreenProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraPreviewRef: React.RefObject<HTMLVideoElement>;
  cameraPosition: { x: number; y: number };
  setCameraPosition: (position: { x: number; y: number }) => void;
  recordingMode: RecordingMode;
}

export function PreviewScreen({
  videoPreviewRef,
  canvasRef,
  cameraPreviewRef,
  cameraPosition,
  setCameraPosition,
  recordingMode,
}: PreviewScreenProps) {
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      {recordingMode !== "camera" && (
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          className="w-full h-full object-contain"
        />
      )}
      {recordingMode === "camera" && (
        <video
          ref={cameraPreviewRef}
          autoPlay
          muted
          className="w-full h-full object-contain"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />
      {recordingMode === "both" && (
        <CameraPreview
          cameraPreviewRef={cameraPreviewRef}
          position={cameraPosition}
          setPosition={setCameraPosition}
        />
      )}
    </div>
  );
}
