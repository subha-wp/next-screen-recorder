import React from "react";
import { CameraPreview } from "./CameraPreview";

interface PreviewScreenProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraPreviewRef: React.RefObject<HTMLVideoElement>;
  cameraPosition: { x: number; y: number };
  setCameraPosition: (position: { x: number; y: number }) => void;
}

export function PreviewScreen({
  videoPreviewRef,
  canvasRef,
  cameraPreviewRef,
  cameraPosition,
  setCameraPosition,
}: PreviewScreenProps) {
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <video
        ref={videoPreviewRef}
        autoPlay
        muted
        className="w-full h-full object-contain"
      />
      <canvas ref={canvasRef} className="hidden" />
      <CameraPreview
        cameraPreviewRef={cameraPreviewRef}
        position={cameraPosition}
        setPosition={setCameraPosition}
      />
    </div>
  );
}
