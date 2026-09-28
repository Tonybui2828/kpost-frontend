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
  X
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
}

export interface BannerConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  position: "bottom" | "top" | "center";
  startSec: number;
  endSec: number;
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
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Whisper Subtitles State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<number>(0);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("");
  const [transcribeSuccessMsg, setTranscribeSuccessMsg] = useState<string>("");
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    fontSize: 22,
    highlightColor: "#FACC15",
    offsetSeconds: 0,
  });

  // Logo & Banner
  const [showModal, setShowModal] = useState<boolean>(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    enabled: true,
    imageSrc: "",
    name: "KPOST AI",
    position: "top-right",
    opacity: 85,
  });
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    enabled: true,
    title: "⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY",
    subtitle: "Miễn phí giao hàng toàn quốc • Bảo hành chính hãng",
    position: "bottom",
    startSec: 3,
    endSec: 15,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // 60 FPS đồng bộ thời gian video chính xác
  useEffect(() => {
    const updateLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Trích xuất TOÀN BỘ ÂM THANH của video (không bao giờ bị cắt 15s)
  const extractFullAudioAsWavBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Lấy chính xác toàn bộ thời lượng video thật
    const fullDuration = decodedBuffer.duration;
    if (fullDuration > 0) {
      setVideoDuration(fullDuration);
    }

    const targetSampleRate = 16000;
    const numFrames = Math.ceil(targetSampleRate * fullDuration);

    // Resample sang 16kHz mono cực nhanh
    const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioCtx.close();

    const wavBlob = audioBufferToWav(renderedBuffer);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(wavBlob);
    });
  };

  // AI Bóc băng toàn bộ âm thanh thật bằng Whisper
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(15);
    setTranscribeStatus("Đang trích xuất toàn bộ âm thanh của video (16kHz Mono)...");

    try {
      const base64Audio = await extractFullAudioAsWavBase64(videoUrl);

      setTranscribeProgress(45);
      setTranscribeStatus("Đang gửi âm thanh sang OpenAI Whisper AI để bóc băng tiếng Việt...");

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      let res: any;

      try {
        res = await axios.post(
          `${backendUrl}/ai-content/transcribe-video`,
          {
            audioBase64: base64Audio,
            videoName: videoName,
            duration: videoDuration || 120,
          },
          { timeout: 120000 }
        );
      } catch (err) {
        res = await axios.post("/api/transcribe-video", {
          audioBase64: base64Audio,
          videoName: videoName,
          duration: videoDuration || 120,
        });
      }

      setTranscribeProgress(85);
      setTranscribeStatus("Đang phân tách mốc thời gian và tạo phụ đề TikTok...");

      // Nhận kết quả từ cả 2 dạng data (res.data.data.cues hoặc res.data.cues)
      const rawCues = res?.data?.data?.cues || res?.data?.cues || [];

      if (rawCues && rawCues.length > 0) {
        setSubtitleCues(rawCues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        setTranscribeSuccessMsg(
          `🎉 Whisper AI đã bóc băng thành công ${rawCues.length} câu lời thoại thật cho toàn bộ video!`
        );
      } else {
        throw new Error(res?.data?.error || "Không nhận được lời thoại từ Whisper AI.");
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi Whisper AI:", err);
      setIsTranscribing(false);
      alert(
        "Lỗi bóc băng âm thanh: " +
          (err?.response?.data?.error || err?.message || "Kiểm tra kết nối hoặc OPENAI_API_KEY ở backend.")
      );
    }
  };

  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setCurrentTime(0);
      setSubtitleCues([]);
      setTranscribeSuccessMsg("");
    }
  };

  const seekToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  // 🌟 TÌM CÂU PHỤ ĐỀ HIỆN TẠI VỚI CƠ CHẾ GIỮ HIỂN THỊ CHỐNG NGẮT QUÃNG
  const adjustedCurrentTime = currentTime + subtitleConfig.offsetSeconds;
  const currentSubtitleCue = useMemo(() => {
    if (!subtitleConfig.enabled || subtitleCues.length === 0) return null;

    // Tìm câu đang phát trong khoảng [startSec, endSec + 0.5s]
    const matched = subtitleCues.find(
      (cue) => adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.5
    );
    if (matched) return matched;

    // Giữ câu vừa nói xong thêm 0.8 giây để mắt người kịp đọc và không bị gián đoạn giữa các khoảng nghỉ
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
                AI Video Editor & Whisper Subtitles
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  REAL AI 100%
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Không dùng chữ mẫu bịa đặt. AI Whisper nghe trực tiếp âm thanh từ video thật của bạn cho toàn bộ thời lượng, nhân vật nói đến đâu sáng chữ đến đó!
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Đang bóc băng...
                </>
              ) : (
                <>
                  <Mic size={16} /> 🎤 AI Bóc Băng Lời Nói Thật
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

        {/* TIẾN TRÌNH BÓC BĂNG */}
        {isTranscribing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Mic size={24} className="text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-white">OpenAI Whisper AI Đang Nghe & Bóc Băng Âm Thanh...</h3>
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
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  Chuẩn Whisper AI
                </span>
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
              <div ref={listContainerRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1 select-none">
                {subtitleCues.map((cue) => {
                  const isActive =
                    adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.2;
                  return (
                    <div
                      id={`cue-item-${cue.id}`}
                      key={cue.id}
                      onClick={() => seekToTimestamp(cue.startSec)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.01]"
                          : "bg-slate-50 hover:bg-purple-50/50 border-slate-200/80 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                            isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {cue.timeLabel}
                        </span>
                        <span className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                          {cue.text}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase text-amber-300 shrink-0 animate-pulse">
                          Đang nói
                        </span>
                      )}
                    </div>
                  );
                })}

                {subtitleCues.length === 0 && !isTranscribing && (
                  <div className="py-12 text-center px-4">
                    <Mic size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">Chưa có phụ đề lời thoại.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm nút <span className="font-bold text-indigo-600">"🎤 AI Bóc Băng Lời Nói Thật"</span> để AI nghe và tạo phụ đề cho toàn bộ video!
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

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto">
                {videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      loop
                      playsInline
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
                          <img src={logoConfig.imageSrc} alt="Logo" className="h-9 w-auto object-contain drop-shadow-md rounded-lg" />
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

      {/* MODAL LOGO & BANNER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Thiết Lập Logo & Banner</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Logo:</label>
                <input
                  type="text"
                  value={logoConfig.name}
                  onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                  className="w-full text-xs font-bold px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu đề Banner:</label>
                <input
                  type="text"
                  value={bannerConfig.title}
                  onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                  className="w-full text-xs font-bold px-3 py-2 border rounded-xl"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}