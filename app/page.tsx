/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { DeviceSelector } from "@/components/screen-recorder/DeviceSelector";
import { PreviewScreen } from "@/components/screen-recorder/PreviewScreen";
import { RecordingControls } from "@/components/screen-recorder/RecordingControls";
import { RecordingModeSelector } from "@/components/screen-recorder/RecordingModeSelector";

export type RecordingMode = "screen" | "camera" | "both";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 20, y: 20 });
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("both");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);

  const getDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      const microphones = devices.filter(
        (device) => device.kind === "audioinput"
      );

      setAvailableCameras(cameras);
      setAvailableMicrophones(microphones);

      if (cameras.length) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    } catch (error) {
      toast.error("Please allow camera and microphone access");
    }
  };

  const startCameraPreview = async (deviceId: string) => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
        cameraStreamRef.current = stream;
      }
    } catch (error) {
      toast.error("Error accessing camera");
      console.error(error);
    }
  };

  const startScreenPreview = async () => {
    try {
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: true,
      });

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        displayStreamRef.current = stream;
      }
    } catch (error) {
      toast.error("Error accessing screen");
      console.error(error);
    }
  };

  const combineStreams = (
    displayStream: MediaStream,
    cameraStream: MediaStream
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return displayStream;

    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return displayStream;

    const mainVideo = document.createElement("video");
    mainVideo.srcObject = displayStream;
    mainVideo.play();

    const cameraVideo = document.createElement("video");
    cameraVideo.srcObject = cameraStream;
    cameraVideo.play();

    const drawFrame = () => {
      ctx.drawImage(mainVideo, 0, 0, canvas.width, canvas.height);
      const cameraWidth = canvas.width / 4;
      const cameraHeight = (cameraWidth * 9) / 16;
      ctx.drawImage(
        cameraVideo,
        cameraPosition.x,
        cameraPosition.y,
        cameraWidth,
        cameraHeight
      );
      requestAnimationFrame(drawFrame);
    };

    drawFrame();
    return canvas.captureStream(30);
  };

  const startRecording = async () => {
    try {
      if (!selectedCamera || !selectedMicrophone) {
        toast.error("Please select both camera and microphone");
        return;
      }

      let streamToRecord: MediaStream;

      if (recordingMode === "camera") {
        streamToRecord = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: { deviceId: selectedMicrophone },
        });
      } else if (recordingMode === "screen") {
        if (!displayStreamRef.current) {
          await startScreenPreview();
        }
        if (!displayStreamRef.current) {
          toast.error("No screen stream available");
          return;
        }
        streamToRecord = displayStreamRef.current;
      } else {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: { deviceId: selectedMicrophone },
        });

        if (!displayStreamRef.current) {
          await startScreenPreview();
        }
        if (!displayStreamRef.current) {
          toast.error("No screen stream available");
          return;
        }

        streamToRecord = combineStreams(displayStreamRef.current, mediaStream);
      }

      const mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        streamToRecord.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      toast.error("Error starting recording");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setRecordedChunks([]);
    toast.success("Recording downloaded");
  };

  useEffect(() => {
    getDevices();
    if (recordingMode !== "camera") {
      startScreenPreview();
    }

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordingMode]);

  useEffect(() => {
    if (selectedCamera) {
      startCameraPreview(selectedCamera);
    }
  }, [selectedCamera]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-6 h-6" />
              Professional Screen Recorder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RecordingModeSelector
              mode={recordingMode}
              onModeChange={setRecordingMode}
            />

            <DeviceSelector
              availableCameras={availableCameras}
              availableMicrophones={availableMicrophones}
              selectedCamera={selectedCamera}
              selectedMicrophone={selectedMicrophone}
              setSelectedCamera={setSelectedCamera}
              setSelectedMicrophone={setSelectedMicrophone}
              showQRCode={showQRCode}
              setShowQRCode={setShowQRCode}
            />

            <PreviewScreen
              videoPreviewRef={videoPreviewRef}
              canvasRef={canvasRef}
              cameraPreviewRef={cameraPreviewRef}
              cameraPosition={cameraPosition}
              setCameraPosition={setCameraPosition}
              recordingMode={recordingMode}
            />

            <RecordingControls
              isRecording={isRecording}
              hasRecording={recordedChunks.length > 0}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onDownloadRecording={downloadRecording}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
