import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Camera, Mic } from "lucide-react";

interface DeviceSelectorProps {
  availableCameras: MediaDeviceInfo[];
  availableMicrophones: MediaDeviceInfo[];
  selectedCamera: string;
  selectedMicrophone: string;
  setSelectedCamera: (deviceId: string) => void;
  setSelectedMicrophone: (deviceId: string) => void;
  showQRCode: boolean;
  setShowQRCode: (show: boolean) => void;
}

export function DeviceSelector({
  availableCameras,
  availableMicrophones,
  selectedCamera,
  selectedMicrophone,
  setSelectedCamera,
  setSelectedMicrophone,
}: DeviceSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Camera
        </label>
        <div className="flex gap-2">
          <Select value={selectedCamera} onValueChange={setSelectedCamera}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {availableCameras.map((camera) => (
                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Microphone
        </label>
        <Select
          value={selectedMicrophone}
          onValueChange={setSelectedMicrophone}
        >
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent>
            {availableMicrophones.map((mic) => (
              <SelectItem key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
