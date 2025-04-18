import React from "react";
import { CameraPreview } from "./CameraPreview";
import type { RecordingMode } from "@/app/page";
import { MirrorToggle } from "./MirrorToggle";

interface PreviewScreenProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraPreviewRef: React.RefObject<HTMLVideoElement>;
  cameraPosition: { x: number; y: number };
  setCameraPosition: (position: { x: number; y: number }) => void;
  recordingMode: RecordingMode;
  isMirrored: boolean;
  toggleMirror: () => void;
}

export function PreviewScreen({
  videoPreviewRef,
  canvasRef,
  cameraPreviewRef,
  cameraPosition,
  setCameraPosition,
  recordingMode,
  isMirrored,
  toggleMirror,
}: PreviewScreenProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        {(recordingMode === "camera" || recordingMode === "both") && (
          <MirrorToggle isMirrored={isMirrored} onToggle={toggleMirror} />
        )}
      </div>
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
            className={`w-full h-full object-contain ${
              isMirrored ? "scale-x-[-1]" : ""
            }`}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {recordingMode === "both" && (
          <CameraPreview
            cameraPreviewRef={cameraPreviewRef}
            position={cameraPosition}
            setPosition={setCameraPosition}
            isMirrored={isMirrored}
          />
        )}
      </div>
    </div>
  );
}
