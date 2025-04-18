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
  const [isConverting, setIsConverting] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isMirrored, setIsMirrored] = useState(true); // Default to mirrored (selfie mode)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const toggleMirror = () => {
    setIsMirrored(!isMirrored);
  };

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
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
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

  const combineAudioStreams = (streams: MediaStream[]) => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const destination = ctx.createMediaStreamDestination();

    streams.forEach((stream) => {
      if (stream.getAudioTracks().length > 0) {
        const source = ctx.createMediaStreamSource(stream);
        source.connect(destination);
      }
    });

    return destination.stream;
  };

  const combineStreams = (
    displayStream: MediaStream,
    cameraStream: MediaStream,
    audioStream: MediaStream
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

      const cameraSize = Math.min(canvas.width / 4, canvas.height / 4);
      const cameraX = canvas.width - cameraSize - 30;
      const cameraY = canvas.height - cameraSize - 30;

      const centerX = cameraX + cameraSize / 2;
      const centerY = cameraY + cameraSize / 2;
      const radius = cameraSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      const scale =
        cameraSize / Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight);
      const scaledWidth = cameraVideo.videoWidth * scale;
      const scaledHeight = cameraVideo.videoHeight * scale;
      const offsetX = (cameraSize - scaledWidth) / 2;
      const offsetY = (cameraSize - scaledHeight) / 2;

      // Apply mirroring effect to camera if enabled
      if (isMirrored) {
        ctx.translate(cameraX + cameraSize, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          cameraVideo,
          -offsetX,
          cameraY + offsetY,
          scaledWidth,
          scaledHeight
        );
      } else {
        ctx.drawImage(
          cameraVideo,
          cameraX + offsetX,
          cameraY + offsetY,
          scaledWidth,
          scaledHeight
        );
      }

      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    const videoStream = canvas.captureStream(60); // Increased to 60fps for smoother video
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    return combinedStream;
  };

  const startRecording = async () => {
    try {
      if (!selectedCamera || !selectedMicrophone) {
        toast.error("Please select both camera and microphone");
        return;
      }

      let streamToRecord: MediaStream;

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMicrophone },
        video: false,
      });

      if (recordingMode === "camera") {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: false,
        });

        // For camera-only mode, we need to handle mirroring differently
        if (isMirrored) {
          // Create a canvas to mirror the camera feed
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const videoElement = document.createElement("video");

          videoElement.srcObject = cameraStream;
          videoElement.play();

          videoElement.onloadedmetadata = () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
          };

          const mirrorStream = canvas.captureStream(60);

          const drawMirroredFrame = () => {
            if (canvas.width === 0) return;
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoElement, 0, 0);
            ctx.restore();
            requestAnimationFrame(drawMirroredFrame);
          };

          drawMirroredFrame();

          streamToRecord = new MediaStream([
            ...mirrorStream.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
        } else {
          streamToRecord = new MediaStream([
            ...cameraStream.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
        }
      } else if (recordingMode === "screen") {
        if (!displayStreamRef.current) {
          await startScreenPreview();
        }
        if (!displayStreamRef.current) {
          toast.error("No screen stream available");
          return;
        }

        const audioStreams = [micStream];
        if (displayStreamRef.current.getAudioTracks().length > 0) {
          audioStreams.push(displayStreamRef.current);
        }

        const combinedAudio = combineAudioStreams(audioStreams);
        streamToRecord = new MediaStream([
          ...displayStreamRef.current.getVideoTracks(),
          ...combinedAudio.getAudioTracks(),
        ]);
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: false,
        });

        if (!displayStreamRef.current) {
          await startScreenPreview();
        }
        if (!displayStreamRef.current) {
          toast.error("No screen stream available");
          return;
        }

        const audioStreams = [micStream];
        if (displayStreamRef.current.getAudioTracks().length > 0) {
          audioStreams.push(displayStreamRef.current);
        }

        const combinedAudio = combineAudioStreams(audioStreams);
        streamToRecord = combineStreams(
          displayStreamRef.current,
          cameraStream,
          combinedAudio
        );
      }

      const mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType: "video/webm;codecs=h264,opus",
        videoBitsPerSecond: 8000000, // 8 Mbps for better quality
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
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
      };

      setRecordingStartTime(Date.now());
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Update recording duration every second
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(Date.now() - (recordingStartTime || 0));
      }, 1000);

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
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      toast.success("Recording stopped");
    }
  };

  const downloadRecording = async () => {
    if (recordedChunks.length === 0) return;

    try {
      setIsConverting(true);

      // Combine all chunks into a single blob
      const recordedBlob = new Blob(recordedChunks, {
        type: "video/webm;codecs=h264,opus",
      });

      // Create a temporary video element to get duration
      const tempVideo = document.createElement("video");
      tempVideo.src = URL.createObjectURL(recordedBlob);

      await new Promise((resolve) => {
        tempVideo.addEventListener("loadedmetadata", () => {
          resolve(undefined);
        });
      });

      // Create the final blob with proper duration metadata
      const finalBlob = new Blob([recordedBlob], {
        type: "video/webm;codecs=h264,opus",
      });

      // Download the file
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(tempVideo.src);
      document.body.removeChild(a);
      tempVideo.remove();
      setRecordedChunks([]);
      setIsConverting(false);
      toast.success("Recording downloaded");
    } catch (error) {
      console.error("Error downloading recording:", error);
      toast.error("Error downloading recording");
      setIsConverting(false);
    }
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
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
              isMirrored={isMirrored}
              toggleMirror={toggleMirror}
            />

            <RecordingControls
              isRecording={isRecording}
              hasRecording={recordedChunks.length > 0}
              isConverting={isConverting}
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
