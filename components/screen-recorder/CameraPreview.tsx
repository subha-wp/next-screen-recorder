import React from "react";

interface CameraPreviewProps {
  cameraPreviewRef: React.RefObject<HTMLVideoElement>;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  isMirrored: boolean;
}

export function CameraPreview({
  cameraPreviewRef,
  position,
  setPosition,
  isMirrored,
}: CameraPreviewProps) {
  return (
    <div
      className="absolute w-[15%] aspect-square border-blue-400 border-1 bg-black rounded-full overflow-hidden cursor-move shadow-lg"
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      draggable="true"
      onDragStart={(e) => {
        const target = e.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData("text/plain", `${offsetX},${offsetY}`);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const [offsetX, offsetY] = e.dataTransfer
          .getData("text/plain")
          .split(",");
        const newX = e.clientX - parseInt(offsetX);
        const newY = e.clientY - parseInt(offsetY);
        setPosition({ x: newX, y: newY });
      }}
    >
      <video
        ref={cameraPreviewRef}
        autoPlay
        muted
        className={`w-full h-full object-cover ${
          isMirrored ? "scale-x-[-1]" : ""
        }`}
      />
    </div>
  );
}
