"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Wand2,
  UploadCloud,
  Play,
  Pause,
  Eye,
  RefreshCw,
  Type,
  Image as ImageIcon,
  Mic,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Sliders,
  Clock,
  Download,
  FileDown,
  Edit2,
  Check,
  Music,
  Palette
} from "lucide-react";

export interface SubtitleWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  timeLabel: string;
  text: string;
  words?: SubtitleWord[];
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  highlightColor: string;
  offsetSeconds: number;
}

export interface LogoConfig {
  enabled: boolean;
  imageSrc: string;
  name: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;
  size: number;
}

export interface BannerConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  position: "bottom" | "top" | "center";
  startSec: number;
  endSec: number;
}

// 🌟 Hiệu ứng hình ảnh (Visual Filter Effects)
export interface VisualEffectConfig {
  filterType: "none" | "cinematic" | "bright" | "vintage" | "vibrant" | "cyberpunk" | "golden";
  brightness: number; // 80 - 140
  contrast: number;   // 80 - 140
  saturation: number; // 50 - 180
  speed: number;      // 0.8 - 1.5
}

// 🌟 Hiệu ứng âm thanh & Nhạc nền (Audio Effects)
export interface SoundEffectConfig {
  bgMusicEnabled: boolean;
  bgMusicType: "none" | "upbeat" | "chill" | "corporate" | "epic";
  bgMusicVolume: number; // 10 - 100
  dingEffectEnabled: boolean; // Ding khi hiện Banner
  whooshEffectEnabled: boolean; // Whoosh mở đầu
  boostVoiceVolume: boolean; // Tăng âm lượng giọng nói
}

// Chuyển AudioBuffer sang file WAV 16-bit Mono siêu nhẹ
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = buffer.getChannelData(0);
  const dataSize = samples.length * (bitDepth / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const dataView = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(dataView, 0, "RIFF");
  dataView.setUint32(4, 36 + dataSize, true);
  writeString(dataView, 8, "WAVE");
  writeString(dataView, 12, "fmt ");
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, format, true);
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  dataView.setUint16(32, numChannels * (bitDepth / 8), true);
  dataView.setUint16(34, bitDepth, true);
  writeString(dataView, 36, "data");
  dataView.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function AiVideoEditorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const exportAbortRef = useRef<boolean>(false);

  // Whisper Subtitles State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<number>(0);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("");
  const [transcribeSuccessMsg, setTranscribeSuccessMsg] = useState<string>("");
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [editingCueText, setEditingCueText] = useState<string>("");
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    fontSize: 22,
    highlightColor: "#FACC15",
    offsetSeconds: 0,
  });

  // Lưu chỉnh sửa câu phụ đề
  const handleSaveCueEdit = (cueId: string) => {
    if (!editingCueText.trim()) {
      setEditingCueId(null);
      return;
    }

    setSubtitleCues((prevCues) =>
      prevCues.map((cue) => {
        if (cue.id === cueId) {
          const newText = editingCueText.trim();
          const wordsList = newText.split(/\s+/).filter(Boolean);
          const duration = Math.max(0.4, cue.endSec - cue.startSec);
          const wordStep = duration / Math.max(1, wordsList.length);

          const updatedWords = wordsList.map((w, idx) => ({
            word: w,
            startSec: Number((cue.startSec + idx * wordStep).toFixed(2)),
            endSec: Number((cue.startSec + (idx + 1) * wordStep).toFixed(2)),
          }));

          return {
            ...cue,
            text: newText,
            words: updatedWords,
          };
        }
        return cue;
      })
    );

    setEditingCueId(null);
    setEditingCueText("");
  };

  // Modal & Cấu hình Logo / Banner ĐẦY ĐỦ
  const [showModal, setShowModal] = useState<boolean>(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    enabled: true,
    imageSrc: "",
    name: "KPOST AI",
    position: "top-right",
    opacity: 90,
    size: 40,
  });
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    enabled: true,
    title: "⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY",
    subtitle: "Miễn phí giao hàng toàn quốc • Bảo hành chính hãng",
    position: "bottom",
    startSec: 3,
    endSec: 15,
  });

  // 🌟 MODAL & CẤU HÌNH HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI
  const [showEffectsModal, setShowEffectsModal] = useState<boolean>(false);
  const [visualEffects, setVisualEffects] = useState<VisualEffectConfig>({
    filterType: "none",
    brightness: 105,
    contrast: 110,
    saturation: 120,
    speed: 1.0,
  });
  const [soundEffects, setSoundEffects] = useState<SoundEffectConfig>({
    bgMusicEnabled: false,
    bgMusicType: "upbeat",
    bgMusicVolume: 35,
    dingEffectEnabled: true,
    whooshEffectEnabled: true,
    boostVoiceVolume: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Tính toán chuỗi CSS Filter cho Video Preview & Canvas Export
  const canvasFilterCss = useMemo(() => {
    if (compareOriginal || visualEffects.filterType === "none") {
      return "none";
    }

    let b = visualEffects.brightness;
    let c = visualEffects.contrast;
    let s = visualEffects.saturation;

    switch (visualEffects.filterType) {
      case "cinematic":
        return `brightness(${b * 0.95}%) contrast(${c * 1.25}%) saturate(${s * 1.1}%) sepia(15%)`;
      case "bright":
        return `brightness(${b * 1.2}%) contrast(${c * 1.05}%) saturate(${s * 1.15}%)`;
      case "vintage":
        return `brightness(${b * 1.05}%) contrast(${c * 1.1}%) saturate(${s * 0.75}%) sepia(35%)`;
      case "vibrant":
        return `brightness(${b * 1.1}%) contrast(${c * 1.2}%) saturate(${s * 1.5}%)`;
      case "cyberpunk":
        return `brightness(${b * 1.05}%) contrast(${c * 1.3}%) saturate(${s * 1.4}%) hue-rotate(15deg)`;
      case "golden":
        return `brightness(${b * 1.1}%) contrast(${c * 1.15}%) saturate(${s * 1.25}%) sepia(25%)`;
      default:
        return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    }
  }, [visualEffects, compareOriginal]);

  // Cập nhật tốc độ video preview khi đổi speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = visualEffects.speed || 1.0;
    }
  }, [visualEffects.speed]);

  // 60 FPS đồng bộ thời gian video preview chính xác
  useEffect(() => {
    const updateLoop = () => {
      if (videoRef.current && !videoRef.current.paused && !isExporting) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExporting]);

  // 🌟 Trích xuất TOÀN BỘ ÂM THANH của video thành Blob WAV 16kHz Mono siêu nhẹ (~1.5MB cho 2 phút)
  const extractFullAudioBlob = async (fileOrUrl: File | string): Promise<Blob> => {
    let arrayBuffer: ArrayBuffer;
    if (fileOrUrl instanceof File) {
      arrayBuffer = await fileOrUrl.arrayBuffer();
    } else {
      const response = await fetch(fileOrUrl);
      arrayBuffer = await response.arrayBuffer();
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // LẤY CHÍNH XÁC TOÀN BỘ THỜI LƯỢNG THẬT CỦA VIDEO
    const fullDuration = decodedBuffer.duration;
    if (fullDuration > 0) {
      setVideoDuration(fullDuration);
    }

    const targetSampleRate = 16000;
    const numFrames = Math.ceil(targetSampleRate * fullDuration);

    const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioCtx.close();

    return audioBufferToWav(renderedBuffer);
  };

  // 🌟 AI BÓC BĂNG TOÀN BỘ ÂM THANH THẬT BẰNG KPOST AI
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(20);
    setTranscribeStatus("Đang trích xuất toàn bộ dải âm thanh 16kHz Mono siêu nhẹ...");

    try {
      const inputSource = selectedFile || videoUrl;
      const wavBlob = await extractFullAudioBlob(inputSource);

      setTranscribeProgress(45);
      setTranscribeStatus(`Đang gửi âm thanh (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB) sang KpostAI...`);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const formData = new FormData();
      formData.append("file", wavBlob, "audio.wav");
      formData.append("duration", String(videoDuration || 120));

      const res = await axios.post(`${backendUrl}/ai-content/transcribe-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });

      setTranscribeProgress(85);
      setTranscribeStatus("Đang phân tách mốc thời gian và tạo phụ đề TikTok...");

      const rawCues = res?.data?.data?.cues || res?.data?.cues || [];

      if (rawCues && rawCues.length > 0) {
        setSubtitleCues(rawCues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        setTranscribeSuccessMsg(
          `🎉 KpostAI đã bóc băng thành công ${rawCues.length} câu lời thoại thật cho toàn bộ video!`
        );
      } else {
        throw new Error(res?.data?.error || "Không nhận được lời thoại từ KpostAI.");
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi KpostAI:", err);
      setIsTranscribing(false);
      alert(
        "Lỗi bóc băng âm thanh: " +
          (err?.response?.data?.error || err?.response?.data?.message || err?.message || "Kiểm tra kết nối hoặc tài khoản.")
      );
    }
  };

  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setCurrentTime(0);
      setSubtitleCues([]);
      setTranscribeSuccessMsg("");
    }
  };

  // Tải ảnh Logo PNG/JPG lên
  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setLogoConfig((p) => ({
            ...p,
            imageSrc: reader.result as string,
            enabled: true,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const seekToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  // 🌟 XUẤT FILE PHỤ ĐỀ .SRT CHUẨN
  const handleDownloadSRT = () => {
    if (subtitleCues.length === 0) {
      alert("Chưa có phụ đề để tải về! Vui lòng bấm 'Bật sub tự động bằng AI' trước.");
      return;
    }

    const formatSRTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const millis = Math.floor((sec % 1) * 1000);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
    };

    let srtContent = "";
    subtitleCues.forEach((cue, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(cue.startSec)} --> ${formatSRTTime(cue.endSec)}\n`;
      srtContent += `${cue.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${videoName.replace(/\.[^/.]+$/, "") || "phu_de"}_subtitles.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🌟 HÀM VẼ TOÀN BỘ OVERLAY (LOGO, BANNER, SUBTITLE) LÊN CANVAS
  const drawOverlaysOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentSec: number,
    logoImg: HTMLImageElement | null
  ) => {
    // 1. VẼ LOGO
    if (logoConfig.enabled) {
      ctx.save();
      ctx.globalAlpha = logoConfig.opacity / 100;
      const logoSize = (logoConfig.size || 40) * (width / 400);

      let posX = width - logoSize - 20;
      let posY = 25;
      if (logoConfig.position === "top-left") {
        posX = 20;
        posY = 25;
      } else if (logoConfig.position === "bottom-right") {
        posX = width - logoSize - 20;
        posY = height - logoSize - 40;
      } else if (logoConfig.position === "bottom-left") {
        posX = 20;
        posY = height - logoSize - 40;
      }

      if (logoImg && logoImg.complete) {
        ctx.drawImage(logoImg, posX, posY, logoSize, logoSize);
      } else {
        ctx.fillStyle = "rgba(37, 99, 235, 0.9)";
        const textWidth = ctx.measureText(logoConfig.name).width + 30;
        ctx.roundRect(posX - 40, posY, Math.max(120, textWidth), 36, 12);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.round(15 * (width / 400))}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(logoConfig.name, posX - 40 + Math.max(120, textWidth) / 2, posY + 18);
      }
      ctx.restore();
    }

    // 2. VẼ BANNER
    if (bannerConfig.enabled && currentSec >= bannerConfig.startSec && currentSec <= bannerConfig.endSec) {
      ctx.save();
      const bannerHeight = Math.round(75 * (height / 800));
      const bannerY = height - bannerHeight - 30;

      ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
      ctx.roundRect(24, bannerY, width - 48, bannerHeight, 18);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(18 * (width / 400))}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(bannerConfig.title, width / 2, bannerY + bannerHeight * 0.42);

      if (bannerConfig.subtitle) {
        ctx.fillStyle = "#FEF08A";
        ctx.font = `bold ${Math.round(12 * (width / 400))}px Arial, sans-serif`;
        ctx.fillText(bannerConfig.subtitle, width / 2, bannerY + bannerHeight * 0.78);
      }
      ctx.restore();
    }

    // 3. VẼ PHỤ ĐỀ TIKTOK
    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.5
      );

      if (matchedCue) {
        ctx.save();
        const subY = height * 0.74; // Nằm ở 1/3 dưới
        const fontSize = Math.round((subtitleConfig.fontSize || 22) * (width / 360));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const words = matchedCue.words && matchedCue.words.length > 0
          ? matchedCue.words
          : matchedCue.text.split(" ").map((w) => ({ word: w, startSec: matchedCue.startSec, endSec: matchedCue.endSec }));

        const spaceWidth = ctx.measureText(" ").width;
        const wordWidths = words.map((w) => ctx.measureText(w.word).width);
        const totalTextWidth = wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * (words.length - 1);

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        const padX = 24;
        const padY = 12;
        ctx.roundRect((width - totalTextWidth) / 2 - padX, subY - fontSize / 2 - padY, totalTextWidth + padX * 2, fontSize + padY * 2, 16);
        ctx.fill();

        let startX = (width - totalTextWidth) / 2;
        words.forEach((w, wIdx) => {
          const isWordActive = adjTime >= w.startSec && adjTime <= w.endSec + 0.15;

          ctx.lineWidth = 4;
          ctx.strokeStyle = "#000000";
          ctx.strokeText(w.word, startX + wordWidths[wIdx] / 2, subY);

          ctx.fillStyle = isWordActive ? "#FACC15" : "#FFFFFF";
          ctx.fillText(w.word, startX + wordWidths[wIdx] / 2, subY);

          startX += wordWidths[wIdx] + spaceWidth;
        });

        ctx.restore();
      }
    }
  };

  // 🌟 TẢI VIDEO XUẤT KHẨU: DÙNG VIDEO ẢO ĐỘC LẬP (BAO GỒM CẢ FILTER HÌNH ẢNH & HIỆU ỨNG ÂM THANH)
  const handleExportFullVideo = async () => {
    if (!videoUrl) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    exportAbortRef.current = false;

    // Tạm dừng video player chính để tránh xung đột âm thanh
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Tạo phần tử video ảo để render ngầm độc lập
    const exportVideo = document.createElement("video");
    exportVideo.src = videoUrl;
    exportVideo.crossOrigin = "anonymous";
    exportVideo.muted = false;
    exportVideo.loop = false; // TUYỆT ĐỐI KHÔNG LOOP ĐỂ KẾT THÚC CHÍNH XÁC
    exportVideo.playsInline = true;

    try {
      await new Promise((resolve, reject) => {
        exportVideo.onloadedmetadata = resolve;
        exportVideo.onerror = reject;
      });

      const totalDur = exportVideo.duration || videoDuration || 120;
      const width = exportVideo.videoWidth || 720;
      const height = exportVideo.videoHeight || 1280;

      // 1. Tạo Canvas ảo
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D");
      canvas.width = width;
      canvas.height = height;

      // 2. Tải Logo Image nếu có
      let logoImg: HTMLImageElement | null = null;
      if (logoConfig.enabled && logoConfig.imageSrc) {
        logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = logoConfig.imageSrc;
        await new Promise((res) => {
          logoImg!.onload = res;
          logoImg!.onerror = res;
        });
      }

      // 3. Chuẩn bị luồng Stream Video + Audio
      const canvasStream = canvas.captureStream(30);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(exportVideo);
        const destination = audioCtx.createMediaStreamDestination();

        // 🌟 BỘ KHUẾCH ĐẠI ÂM LƯỢNG NẾU BẬT BOOST VOICE
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = soundEffects.boostVoiceVolume ? 1.4 : 1.0;

        source.connect(gainNode);
        gainNode.connect(destination);

        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } catch (e) {
        console.warn("Nối âm thanh video:", e);
      }

      // 4. Khởi tạo MediaRecorder
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finishExport = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
        exportVideo.pause();
        exportVideo.src = "";
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          setIsExporting(false);
          return;
        }

        const exportedBlob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const downloadUrl = URL.createObjectURL(exportedBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${videoName.replace(/\.[^/.]+$/, "") || "video"}_kpost_sub.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
        }, 600);
      };

      // 5. Bắt đầu tua về 0 và play video ngầm
      exportVideo.currentTime = 0;
      recorder.start(1000);
      await exportVideo.play();

      let animationId: number;

      const renderLoop = () => {
        if (exportAbortRef.current) {
          finishExport();
          return;
        }

        const curTime = exportVideo.currentTime;
        const currentProgress = Math.min(99, Math.round((curTime / totalDur) * 100));
        setExportProgress(currentProgress);

        // 🌟 ÁP DỤNG HIỆU ỨNG HÌNH ẢNH LÊN CANVAS RENDER
        ctx.save();
        if (canvasFilterCss !== "none") {
          ctx.filter = canvasFilterCss;
        }
        ctx.drawImage(exportVideo, 0, 0, width, height);
        ctx.restore();

        // Vẽ overlay chữ, logo, banner
        drawOverlaysOnCanvas(ctx, width, height, curTime, logoImg);

        // KIỂM TRA ĐIỀU KIỆN DỪNG
        if (exportVideo.ended || curTime >= totalDur - 0.2) {
          setExportProgress(100);
          setTimeout(() => {
            finishExport();
          }, 300);
          return;
        }

        animationId = requestAnimationFrame(renderLoop);
      };

      animationId = requestAnimationFrame(renderLoop);

      exportVideo.onended = () => {
        cancelAnimationFrame(animationId);
        finishExport();
      };
    } catch (err: any) {
      console.error("Lỗi xuất video:", err);
      setIsExporting(false);
      alert("Lỗi xuất video: " + (err?.message || "Vui lòng thử lại"));
    }
  };

  // 🌟 TÌM CÂU PHỤ ĐỀ HIỆN TẠI VỚI CƠ CHẾ GIỮ HIỂN THỊ CHỐNG NGẮT QUÃNG
  const adjustedCurrentTime = currentTime + subtitleConfig.offsetSeconds;
  const currentSubtitleCue = useMemo(() => {
    if (!subtitleConfig.enabled || subtitleCues.length === 0) return null;

    const matched = subtitleCues.find(
      (cue) => adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.5
    );
    if (matched) return matched;

    const recent = subtitleCues.find(
      (cue) => adjustedCurrentTime > cue.endSec && adjustedCurrentTime <= cue.endSec + 0.8
    );
    return recent || null;
  }, [subtitleConfig.enabled, subtitleCues, adjustedCurrentTime]);

  useEffect(() => {
    if (currentSubtitleCue && listContainerRef.current) {
      const el = document.getElementById(`cue-item-${currentSubtitleCue.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSubtitleCue]);

  const isBannerVisible = useMemo(() => {
    if (!bannerConfig.enabled || compareOriginal) return false;
    return currentTime >= bannerConfig.startSec && currentTime <= bannerConfig.endSec;
  }, [bannerConfig, currentTime, compareOriginal]);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-24">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <Wand2 size={26} />
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                AI Video Editor
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  REAL AI 100%
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Đây là tính năng sub video tự động , chèn logo và banner tự động cho video của bạn . Đăng ký gói pro và sử dụng không giới hạn từ kpost.
            </p>
          </div>

          {/* DÃY NÚT CHỨC NĂNG */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Đang bóc băng...
                </>
              ) : (
                <>
                  <Mic size={16} /> 🎤 Bật sub tự động bằng AI
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ImageIcon size={16} /> Logo & Banner
            </button>

            {/* 🌟 NÚT CHÈN HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI */}
            <button
              type="button"
              onClick={() => setShowEffectsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles size={16} /> Hiệu Ứng Video
            </button>

            {/* 🌟 NÚT TẢI VIDEO VỀ */}
            <button
              type="button"
              onClick={handleExportFullVideo}
              disabled={!videoUrl || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Đang xuất ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download size={16} /> ⬇️ Tải Video Về Máy
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud size={16} /> Tải Video Lên
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUserUploadVideo}
              className="hidden"
            />
          </div>
        </div>

        {/* TIẾN TRÌNH XUẤT VIDEO CÓ NÚT HỦY */}
        {isExporting && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-emerald-400 animate-bounce" />
                <div>
                  <h3 className="text-base font-black text-white">Đang Render & Xuất Video Hoàn Chỉnh...</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Hệ thống đang gắn phụ đề, logo, banner và hiệu ứng vào video (Tự động tải về khi đủ 100%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-black text-emerald-300">{exportProgress}%</span>
                <button
                  type="button"
                  onClick={() => {
                    exportAbortRef.current = true;
                    setIsExporting(false);
                  }}
                  className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH BÓC BĂNG */}
        {isTranscribing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Mic size={24} className="text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-white">KpostAI Đang Nghe & Bóc Băng Âm Thanh...</h3>
                  <p className="text-xs text-cyan-200 mt-0.5">{transcribeStatus}</p>
                </div>
              </div>
              <span className="text-lg font-mono font-black text-amber-300">{transcribeProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${transcribeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 2 CỘT CHÍNH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: DANH SÁCH LỜI THOẠI TOÀN BỘ VIDEO */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-purple-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Lời Thoại Thật Đã Bóc ({subtitleCues.length} Câu)
                  </h3>
                </div>
                {subtitleCues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadSRT}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Tải file .SRT
                  </button>
                )}
              </div>

              {/* TÙY CHỌN */}
              <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subtitleConfig.enabled}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  Bật hiện chữ trên video
                </label>
                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span>Cỡ chữ:</span>
                  <select
                    value={subtitleConfig.fontSize}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value={18}>Nhỏ (18px)</option>
                    <option value={22}>Vừa (22px)</option>
                    <option value={26}>To (26px)</option>
                    <option value={30}>Rất to (30px)</option>
                  </select>
                </div>
              </div>

              {/* DANH SÁCH LỜI THOẠI TRẢI DÀI TOÀN BỘ VIDEO */}
              <div ref={listContainerRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {subtitleCues.map((cue) => {
                  const isActive =
                    adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.2;
                  const isEditing = editingCueId === cue.id;

                  return (
                    <div
                      id={`cue-item-${cue.id}`}
                      key={cue.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                          : "bg-slate-50 hover:bg-purple-50/50 border-slate-200/80 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                          title="Bấm để tua video tới mốc này"
                        >
                          {cue.timeLabel}
                        </button>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              autoFocus
                              value={editingCueText}
                              onChange={(e) => setEditingCueText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCueEdit(cue.id);
                                if (e.key === "Escape") setEditingCueId(null);
                              }}
                              className={`w-full text-xs font-bold px-2.5 py-1 rounded-xl outline-none border transition-all ${
                                isActive
                                  ? "bg-white text-slate-900 border-white focus:ring-2 focus:ring-amber-300"
                                  : "bg-white text-slate-900 border-purple-400 focus:ring-2 focus:ring-purple-500"
                              }`}
                              placeholder="Nhập lời thoại chính xác..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCueEdit(cue.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-xs shrink-0"
                              title="Lưu sửa đổi (Enter)"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCueId(null)}
                              className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 cursor-pointer shrink-0"
                              title="Hủy (Esc)"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => seekToTimestamp(cue.startSec)}
                            className={`text-xs font-bold truncate flex-1 cursor-pointer select-none ${
                              isActive ? "text-white" : "text-slate-800"
                            }`}
                            title="Bấm để tua video"
                          >
                            {cue.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && !isEditing && (
                          <span className="text-[10px] font-black uppercase text-amber-300 shrink-0 animate-pulse">
                            Đang nói
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCueId(cue.id);
                              setEditingCueText(cue.text);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? "bg-white/20 text-white hover:bg-white/30"
                                : "text-slate-400 hover:text-purple-600 hover:bg-purple-100"
                            }`}
                            title="Sửa lời thoại câu này"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {subtitleCues.length === 0 && !isTranscribing && (
                  <div className="py-12 text-center px-4">
                    <Mic size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">Chưa có phụ đề lời thoại.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm nút <span className="font-bold text-indigo-600">"🎤 Bật sub tự động bằng AI"</span> để KpostAI nghe và tạo phụ đề cho toàn bộ video!
                    </p>
                  </div>
                )}
              </div>

              {transcribeSuccessMsg && (
                <div className="mt-3.5 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2 animate-in fade-in">
                  <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-purple-900 leading-relaxed">{transcribeSuccessMsg}</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI PHỤ ĐỀ DỌC 9:16 TẠI MỌI THỜI ĐIỂM */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Play size={14} />
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate" title={videoName}>
                    {videoName || "Video Preview"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* NÚT HIỆU ỨNG NHANH */}
                  <button
                    type="button"
                    onClick={() => setShowEffectsModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Palette size={13} />
                    {visualEffects.filterType !== "none" ? "Đã bật hiệu ứng" : "Hiệu ứng"}
                  </button>

                  {/* NÚT TẢI NHANH Ở TRÊN ĐẦU VIDEO */}
                  <button
                    type="button"
                    onClick={handleExportFullVideo}
                    disabled={!videoUrl || isExporting}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Download size={13} />
                    {isExporting ? `Đang xuất ${exportProgress}%` : "Tải Video"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompareOriginal(!compareOriginal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      compareOriginal
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Đang xem: GỐC" : "Xem bản gốc"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto">
                {videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      loop
                      playsInline
                      crossOrigin="anonymous"
                      style={{
                        filter: canvasFilterCss,
                        transition: "filter 0.3s ease"
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.duration) {
                          setVideoDuration(videoRef.current.duration);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full h-full object-contain"
                    />

                    {/* LOGO */}
                    {logoConfig.enabled && !compareOriginal && (
                      <div
                        className={`absolute pointer-events-none z-30 transition-all ${
                          logoConfig.position === "top-left"
                            ? "top-4 left-4"
                            : logoConfig.position === "top-right"
                            ? "top-4 right-4"
                            : logoConfig.position === "bottom-left"
                            ? "bottom-4 left-4"
                            : "bottom-4 right-4"
                        }`}
                        style={{ opacity: logoConfig.opacity / 100 }}
                      >
                        {logoConfig.imageSrc ? (
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo"
                            style={{ height: `${logoConfig.size || 40}px` }}
                            className="w-auto object-contain drop-shadow-md rounded-lg"
                          />
                        ) : (
                          <div className="px-3 py-1 bg-blue-600/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5 tracking-wider uppercase">
                            <Sparkles size={11} className="text-amber-300" />
                            {logoConfig.name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BANNER */}
                    {isBannerVisible && (
                      <div className="absolute left-4 right-4 bottom-4 pointer-events-none z-30 transition-all">
                        <div className="p-3 rounded-2xl shadow-2xl border border-white/25 text-center text-white bg-gradient-to-r from-red-600/95 via-rose-600/95 to-amber-600/95 backdrop-blur-md">
                          <h4 className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">
                            {bannerConfig.title}
                          </h4>
                          {bannerConfig.subtitle && (
                            <p className="text-[10px] md:text-[11px] text-amber-200 font-bold mt-0.5">
                              {bannerConfig.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 🌟 PHỤ ĐỀ KARAOKE WORD-BY-WORD: NẰM GỌN 1/3 TỪ DƯỚI LÊN TẠI MỌI THỜI ĐIỂM */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div className="absolute bottom-[26%] left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                        <div className="bg-black/60 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 shadow-2xl max-w-[85%] text-center animate-in fade-in zoom-in-95 duration-150">
                          <p
                            className="font-black leading-tight tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
                            style={{
                              fontSize: `${subtitleConfig.fontSize}px`,
                              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 2px 4px #000",
                            }}
                          >
                            {currentSubtitleCue.words && currentSubtitleCue.words.length > 0 ? (
                              currentSubtitleCue.words.map((w, wIdx) => {
                                const isWordActive =
                                  adjustedCurrentTime >= w.startSec &&
                                  adjustedCurrentTime <= w.endSec + 0.15;
                                return (
                                  <span
                                    key={wIdx}
                                    className={`transition-all duration-100 ${
                                      isWordActive
                                        ? "text-yellow-300 scale-110 font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
                                        : "text-white opacity-90"
                                    }`}
                                  >
                                    {w.word}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-yellow-300">{currentSubtitleCue.text}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TIMELINE CONTROLS */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="font-bold text-slate-700">
                      {Math.floor(currentTime / 60).toString().padStart(2, "0")}:
                      {Math.floor(currentTime % 60).toString().padStart(2, "0")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 120}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="flex-1 accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-slate-700">
                      {Math.floor(videoDuration / 60).toString().padStart(2, "0")}:
                      {Math.floor(videoDuration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {subtitleCues.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Đã bóc băng ({subtitleCues.length} câu thật)
                    </span>
                  )}
                  {visualEffects.filterType !== "none" && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                      ✨ Bộ lọc: {visualEffects.filterType.toUpperCase()} ({visualEffects.speed}x)
                    </span>
                  )}
                  {bannerConfig.enabled && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      🏷️ Banner: 00:{bannerConfig.startSec.toString().padStart(2, "0")} ➔ 00:{bannerConfig.endSec.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 MODAL CHÈN HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI */}
      {showEffectsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">Hiệu Ứng Hình Ảnh & Âm Thanh</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* PHẦN 1: HIỆU ỨNG HÌNH ẢNH (COLOR GRADING & FILTER) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Palette size={14} className="text-purple-600" /> 1. Bộ Lọc Màu & Hiệu Ứng Hình Ảnh (Visual)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Tông màu điện ảnh:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Mặc định" },
                        { id: "bright", label: "✨ Sáng nét" },
                        { id: "cinematic", label: "🎬 Điện ảnh" },
                        { id: "vibrant", label: "🌈 Rực rỡ" },
                        { id: "golden", label: "☀️ Vàng ấm" },
                        { id: "vintage", label: "🎞️ Hoài niệm" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, filterType: item.id as any }))}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            visualEffects.filterType === item.id
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Độ sáng: {visualEffects.brightness}%
                      </label>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        value={visualEffects.brightness}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Độ bão hòa màu: {visualEffects.saturation}%
                      </label>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={visualEffects.saturation}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tốc độ phát: {visualEffects.speed}x (Tăng tốc để video TikTok cuốn hút hơn)
                    </label>
                    <div className="flex gap-2">
                      {[1.0, 1.1, 1.2, 1.25, 1.5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setVisualEffects((p) => ({ ...p, speed: spd }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            visualEffects.speed === spd
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: HIỆU ỨNG ÂM THANH (AUDIO EFFECTS) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                  <Music size={14} className="text-emerald-600" /> 2. Hiệu Ứng Âm Thanh & Khuếch Đại (Audio)
                </span>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">🎙️ Khuếch đại giọng nói (Voice Boost +40%)</p>
                      <p className="text-[11px] text-slate-500">Giúp giọng nói rõ ràng, nổi bật hơn so với âm thanh tạp âm</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.boostVoiceVolume}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, boostVoiceVolume: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">🔔 Hiệu ứng Ding khi hiện Banner</p>
                      <p className="text-[11px] text-slate-500">Phát âm thanh thông báo thu hút mắt nhìn khi banner giảm giá xuất hiện</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.dingEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, dingEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-800">⚡ Hiệu ứng Whoosh lướt cảnh mở đầu</p>
                      <p className="text-[11px] text-slate-500">Âm thanh lướt gió chuyên nghiệp trong 2 giây đầu video</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.whooshEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, whooshEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THIẾT LẬP LOGO & BANNER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <ImageIcon size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">Thiết Lập Logo & Banner Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* PHẦN 1: LOGO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-600" /> 1. Logo Thương Hiệu
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    Bật Logo
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      Ảnh Logo (PNG trong suốt / JPG):
                    </label>
                    <div className="flex items-center gap-3">
                      {logoConfig.imageSrc ? (
                        <div className="relative group w-14 h-14 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoConfig((p) => ({ ...p, imageSrc: "" }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 cursor-pointer"
                            title="Xóa logo"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : null}

                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => logoImageInputRef.current?.click()}
                          className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                        >
                          <UploadCloud size={16} className="text-indigo-600" />
                          {logoConfig.imageSrc ? "Đổi ảnh Logo khác" : "Chọn ảnh Logo từ máy tính..."}
                        </button>
                        <input
                          ref={logoImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoFile}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {!logoConfig.imageSrc && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Hoặc nhập Chữ Logo đại diện:
                      </label>
                      <input
                        type="text"
                        value={logoConfig.name}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                        placeholder="VD: KPOST AI"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Vị trí góc:</label>
                      <select
                        value={logoConfig.position}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, position: e.target.value as any }))}
                        className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="top-right">Góc trên - Phải</option>
                        <option value="top-left">Góc trên - Trái</option>
                        <option value="bottom-right">Góc dưới - Phải</option>
                        <option value="bottom-left">Góc dưới - Trái</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Kích thước: {logoConfig.size || 40}px
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={70}
                        value={logoConfig.size || 40}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                        className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: BANNER QUẢNG CÁO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    🏷️ 2. Banner Quảng Cáo / Giảm Giá
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    Bật Banner
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: ⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Mô tả phụ (subtitle):</label>
                    <input
                      type="text"
                      value={bannerConfig.subtitle || ""}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="VD: Miễn phí giao hàng toàn quốc • Bảo hành chính hãng"
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Bắt đầu (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.startSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, startSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Kết thúc (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.endSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, endSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}