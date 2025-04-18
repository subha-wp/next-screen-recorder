import React from "react";
import { Camera, Monitor, Split } from "lucide-react";
import type { RecordingMode } from "@/app/page";
import { Button } from "@/components/ui/button";

interface RecordingModeSelectorProps {
  mode: RecordingMode;
  onModeChange: (mode: RecordingMode) => void;
}

export function RecordingModeSelector({
  mode,
  onModeChange,
}: RecordingModeSelectorProps) {
  return (
    <div className="flex gap-4 justify-center">
      <Button
        variant={mode === "screen" ? "default" : "outline"}
        onClick={() => onModeChange("screen")}
        className="gap-2"
      >
        <Monitor className="w-4 h-4" />S O
      </Button>
      <Button
        variant={mode === "camera" ? "default" : "outline"}
        onClick={() => onModeChange("camera")}
        className="gap-2"
      >
        <Camera className="w-4 h-4" />C O
      </Button>
      <Button
        variant={mode === "both" ? "default" : "outline"}
        onClick={() => onModeChange("both")}
        className="gap-2"
      >
        <Split className="w-4 h-4" />S & C
      </Button>
    </div>
  );
}
