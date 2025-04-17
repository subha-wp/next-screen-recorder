/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Video,
  Mic,
  StopCircle,
  Download,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 20, y: 20 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      // Draw main screen
      ctx.drawImage(mainVideo, 0, 0, canvas.width, canvas.height);

      // Draw camera feed in corner
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

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera },
        audio: { deviceId: selectedMicrophone },
      });

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: true,
      });

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = displayStream;
      }

      const combinedStream = combineStreams(displayStream, mediaStream);

      const mediaRecorder = new MediaRecorder(combinedStream, {
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
        combinedStream.getTracks().forEach((track) => track.stop());
        displayStream.getTracks().forEach((track) => track.stop());
        mediaStream.getTracks().forEach((track) => track.stop());
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
    a.download = `screen-recording-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setRecordedChunks([]);
    toast.success("Recording downloaded");
  };

  const toggleFullscreen = () => {
    if (!videoPreviewRef.current) return;

    if (!isFullscreen) {
      if (videoPreviewRef.current.requestFullscreen) {
        videoPreviewRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    getDevices();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCamera}
                    onValueChange={setSelectedCamera}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem
                          key={camera.deviceId}
                          value={camera.deviceId}
                        >
                          {camera.label ||
                            `Camera ${camera.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="shrink-0"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
                {showQRCode && (
                  <div className="mt-2 p-4 bg-white rounded-lg">
                    <p className="text-sm mb-2">
                      Scan to use your phone as a camera:
                    </p>
                    <QRCodeSVG
                      value={`https://${window.location.hostname}:${window.location.port}/camera`}
                      size={150}
                    />
                  </div>
                )}
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
                  <SelectTrigger>
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

            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                className="w-full h-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div
                className="absolute w-40 h-40 aspect-video bg-black rounded-full overflow-hidden cursor-move shadow-lg"
                style={{
                  right: `${cameraPosition.x}px`,
                  bottom: `${cameraPosition.y}px`,
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
                  setCameraPosition({ x: newX, y: newY });
                }}
              >
                <video
                  ref={cameraPreviewRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} className="gap-2">
                  <Video className="w-4 h-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Recording
                </Button>
              )}

              {recordedChunks.length > 0 && (
                <Button
                  onClick={downloadRecording}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Recording
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
