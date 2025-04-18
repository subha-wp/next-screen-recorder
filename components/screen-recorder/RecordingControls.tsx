import React from "react";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, Download, Loader2 } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  hasRecording: boolean;
  isConverting: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownloadRecording: () => void;
}

export function RecordingControls({
  isRecording,
  hasRecording,
  isConverting,
  onStartRecording,
  onStopRecording,
  onDownloadRecording,
}: RecordingControlsProps) {
  return (
    <div className="flex justify-center gap-4">
      {!isRecording ? (
        <Button onClick={onStartRecording} className="gap-2">
          <Video className="w-4 h-4" />
          Start Recording
        </Button>
      ) : (
        <Button
          onClick={onStopRecording}
          variant="destructive"
          className="gap-2"
        >
          <StopCircle className="w-4 h-4" />
          Stop Recording
        </Button>
      )}

      {hasRecording && (
        <Button
          onClick={onDownloadRecording}
          variant="outline"
          className="gap-2"
          disabled={isConverting}
        >
          {isConverting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isConverting ? "Converting to MP4..." : "Download Recording"}
        </Button>
      )}
    </div>
  );
}
