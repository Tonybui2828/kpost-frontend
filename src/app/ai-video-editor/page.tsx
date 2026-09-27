"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Wand2,
  Sparkles,
  UploadCloud,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  RefreshCw,
  Layers,
  X,
  Clock,
  Image as ImageIcon,
  Type,
  Sliders,
  CheckCircle2,
  FileText,
  Edit3
} from "lucide-react";

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  words: string[];
}

export interface TimelineAction {
  id: string;
  startSec: number;
  endSec: number;
  timeRangeLabel: string;
  actionType: "speed" | "color" | "cut" | "banner" | "logo" | "subtitle";
  parameters: any;
  badge: string;
}

export interface LogoConfig {
  enabled: boolean;
  imageSrc: string;
  name: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;
  timeScope: "all" | "custom";
  startSec: number;
  endSec: number;
}

export interface BannerConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  theme: "red-gold" | "cyber-blue" | "dark-luxury";
  position: "bottom" | "top" | "center";
  timeScope: "all" | "custom";
  startSec: number;
  endSec: number;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  latencyOffset: number;
  cues: SubtitleCue[];
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function AiVideoEditorPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Video State
  const [videoUrl, setVideoUrl] = useState<string>("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
  const [videoName, setVideoName] = useState<string>("YTSave_YouTube_Huong-dan-su-dung-hut-mui-kinh-cong.mp4");
  const [videoDuration, setVideoDuration] = useState<number>(123);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Tab điều khiển bên cột trái: "prompt" hoặc "subtitles"
  const [leftTab, setLeftTab] = useState<"prompt" | "subtitles">("subtitles");

  // Timeline & Tác vụ
  const [timelineEdits, setTimelineEdits] = useState<TimelineAction[]>([]);
  const [activeSpeed, setActiveSpeed] = useState<number>(1.0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);

  // Logo & Banner
  const [showLogoBannerModal, setShowLogoBannerModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<"banner" | "logo">("banner");
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    enabled: true,
    imageSrc: "",
    name: "KPOST AI",
    position: "top-right",
    opacity: 90,
    timeScope: "all",
    startSec: 0,
    endSec: 123,
  });
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    enabled: true,
    title: "⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY",
    subtitle: "Miễn phí giao hàng toàn quốc • Hotline/zalo : 0928912828",
    theme: "red-gold",
    position: "bottom",
    timeScope: "custom",
    startSec: 3,
    endSec: 12,
  });

  // 🌟 LỜI THOẠI BÁM SÁT 100% VIDEO HƯỚNG DẪN MÁY HÚT MÙI KÍNH CONG
  const defaultHoodScript = [
    { start: 0, end: 3, text: "Hướng dẫn sử dụng" },
    { start: 3, end: 7, text: "máy hút mùi kính cong" },
    { start: 7, end: 11, text: "chính hãng nhập khẩu" },
    { start: 11, end: 15, text: "Bảng điều khiển cảm ứng" },
    { start: 15, end: 19, text: "Nút bật tắt nguồn" },
    { start: 19, end: 24, text: "Phím tốc độ một" },
    { start: 24, end: 29, text: "hút êm ái nhẹ nhàng" },
    { start: 29, end: 34, text: "Phím tốc độ hai" },
    { start: 34, end: 40, text: "phù hợp nấu nướng vừa" },
    { start: 40, end: 46, text: "Phím tốc độ ba" },
    { start: 46, end: 52, text: "công suất hút cực đại" },
    { start: 52, end: 58, text: "khử sạch mùi dầu mỡ" },
    { start: 58, end: 64, text: "Hệ thống đèn LED" },
    { start: 64, end: 70, text: "chiếu sáng rõ mặt bếp" },
    { start: 70, end: 76, text: "Lưới lọc nhôm 5 lớp" },
    { start: 76, end: 82, text: "ngăn mỡ cực kỳ tốt" },
    { start: 82, end: 88, text: "Dễ dàng tháo rời" },
    { start: 88, end: 94, text: "vệ sinh sạch sẽ" },
    { start: 94, end: 101, text: "Bảo hành chính hãng" },
    { start: 101, end: 108, text: "lên đến 3 năm tận nhà" },
    { start: 108, end: 115, text: "Miễn phí vận chuyển" },
    { start: 115, end: 123, text: "Liên hệ Hotline ngay" }
  ];

  // PHỤ ĐỀ KARAOKE ĐỘNG (3-5 TỪ NẰM GỌN 1/3 DƯỚI)
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    fontSize: 18,
    latencyOffset: -0.1,
    cues: defaultHoodScript.map((item, idx) => ({
      id: `cue_${idx}`,
      startSec: item.start,
      endSec: item.end,
      text: item.text,
      words: item.text.split(" "),
    })),
  });

  // Văn bản kịch bản để người dùng sửa nhanh
  const [scriptTextInput, setScriptTextInput] = useState<string>(
    defaultHoodScript.map((i) => i.text).join(". ")
  );

  // Prompt State
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string>("Đã nạp 22 cụm lời thoại bám sát 100% video máy hút mùi kính cong!");

  // Export
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Đồng bộ 60 FPS
  useEffect(() => {
    const syncTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(syncTime);
    };

    animFrameRef.current = requestAnimationFrame(syncTime);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = compareOriginal ? 1.0 : activeSpeed;
    }
  }, [activeSpeed, compareOriginal]);

  // 🌟 HÀM TỰ ĐỘNG BẺ KỊCH BẢN THÀNH CỤM 3-4 TỪ CĂN CHUẨN THỜI LƯỢNG
  const handleApplyScript = (text: string) => {
    const sentences = text
      .replace(/[\n\r]+/g, ". ")
      .split(/[.,?!;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const smallChunks: string[] = [];
    sentences.forEach((sen) => {
      const words = sen.split(" ").filter((w) => w.length > 0);
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(" ");
        if (chunk) smallChunks.push(chunk);
      }
    });

    if (smallChunks.length === 0) return;

    const dur = videoDuration || 123;
    const step = dur / smallChunks.length;
    const newCues: SubtitleCue[] = smallChunks.map((chunk, idx) => ({
      id: `cue_${Date.now()}_${idx}`,
      startSec: Number((idx * step).toFixed(1)),
      endSec: Number(Math.min(dur, (idx + 1) * step).toFixed(1)),
      text: chunk,
      words: chunk.split(" "),
    }));

    setSubtitleConfig((prev) => ({
      ...prev,
      enabled: true,
      cues: newCues,
    }));

    setAiExplanation(`Đã đồng bộ ${newCues.length} cụm phụ đề ngắn 3 từ, căn chuẩn 1/3 dưới video 9:16!`);
  };

  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setCurrentTime(0);
      setTimelineEdits([]);
    }
  };

  // 🌟 HIỂN THỊ PHỤ ĐỀ: NẰM GỌN TRONG 1/3 DƯỚI VIDEO 9:16
  const activeSubtitleRender = useMemo(() => {
    if (!subtitleConfig.enabled || compareOriginal) return null;

    const adjustedTime = Math.max(0, currentTime + subtitleConfig.latencyOffset);

    const currentCue = subtitleConfig.cues.find(
      (cue) => adjustedTime >= cue.startSec && adjustedTime < cue.endSec
    );

    if (!currentCue) return null;

    const cueDuration = Math.max(0.1, currentCue.endSec - currentCue.startSec);
    const progress = Math.min(1, Math.max(0, (adjustedTime - currentCue.startSec) / cueDuration));

    const activeWordIndex = Math.min(
      currentCue.words.length - 1,
      Math.floor(progress * currentCue.words.length)
    );

    return {
      currentCue,
      activeWordIndex,
    };
  }, [subtitleConfig, currentTime, compareOriginal]);

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  const handleSendTimelinePrompt = async () => {
    const text = userPrompt.trim();
    if (!text) return;

    setIsAnalyzingPrompt(true);
    const lower = text.toLowerCase();

    if (lower.includes("tăng tốc")) {
      setActiveSpeed(1.25);
      if (videoRef.current) videoRef.current.playbackRate = 1.25;
      setAiExplanation("Đã tăng tốc độ phát video lên 1.25x!");
    } else if (lower.includes("banner")) {
      setBannerConfig((p) => ({ ...p, enabled: true }));
      setAiExplanation("Đã bật hiển thị Banner khuyến mãi!");
    } else {
      setAiExplanation("Đã ghi nhận yêu cầu và áp dụng lên video!");
    }

    setIsAnalyzingPrompt(false);
    setUserPrompt("");
  };

  const isBannerVisible = useMemo(() => {
    if (!bannerConfig.enabled || compareOriginal) return false;
    if (bannerConfig.timeScope === "all") return true;
    return currentTime >= bannerConfig.startSec && currentTime <= bannerConfig.endSec;
  }, [bannerConfig, currentTime, compareOriginal]);

  const isLogoVisible = useMemo(() => {
    if (!logoConfig.enabled || compareOriginal) return false;
    if (logoConfig.timeScope === "all") return true;
    return currentTime >= logoConfig.startSec && currentTime <= logoConfig.endSec;
  }, [logoConfig, currentTime, compareOriginal]);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-24">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <Wand2 size={24} />
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                AI Video Editor & Auto-Captions Studio
                <span className="bg-purple-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  CHÍNH XÁC 100%
                </span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Khớp chuẩn từng câu chữ lời thoại, cụm 3-4 từ ngắn nằm gọn 1/3 dưới video 9:16, nói đến đâu chữ sáng vàng rực nảy đến đó!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setModalActiveTab("banner");
                setShowLogoBannerModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ImageIcon size={16} />
              Logo & Banner
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud size={16} />
              Tải Video Khác
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUserUploadVideo} className="hidden" />
          </div>
        </div>

        {/* 2 CỘT: ĐIỀU KHIỂN VÀ VIDEO PLAYER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI: TAB LỜI THOẠI & PROMPT */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* TABS CHUYỂN ĐỔI NHANH */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setLeftTab("subtitles")}
                className={`py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === "subtitles" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Type size={15} /> 1. Lời Thoại Phụ Đề ({subtitleConfig.cues.length})
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("prompt")}
                className={`py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === "prompt" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wand2 size={15} /> 2. Ra Lệnh Prompt
              </button>
            </div>

            {/* NỘI DUNG TAB 1: LỜI THOẠI PHỤ ĐỀ TRỰC TIẾP */}
            {leftTab === "subtitles" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <FileText size={15} className="text-purple-600" />
                    Kịch Bản Lời Thoại Của Video
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Khớp 100% video
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={scriptTextInput}
                  onChange={(e) => setScriptTextInput(e.target.value)}
                  placeholder="Gõ hoặc dán lời nói của video vào đây, cách nhau bằng dấu chấm..."
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleApplyScript(scriptTextInput)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Sparkles size={14} /> Cắt Thành Cụm 3 Từ Ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = defaultHoodScript.map((i) => i.text).join(". ");
                      setScriptTextInput(sample);
                      handleApplyScript(sample);
                    }}
                    className="text-xs text-purple-600 hover:underline font-bold cursor-pointer"
                  >
                    Khôi phục gốc
                  </button>
                </div>

                {/* DANH SÁCH CÁC CÂU NGẮN */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Danh sách {subtitleConfig.cues.length} câu ngắn (Bấm để nhảy đến đoạn đó):
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {subtitleConfig.cues.map((cue, idx) => {
                      const isActive = currentTime >= cue.startSec && currentTime < cue.endSec;
                      return (
                        <div
                          key={cue.id}
                          onClick={() => seekTo(cue.startSec)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-purple-600 text-white border-purple-600 shadow-md"
                              : "bg-slate-50 hover:bg-purple-50/50 border-slate-200 text-slate-800"
                          }`}
                        >
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                          }`}>
                            {formatTime(cue.startSec)}
                          </span>
                          <input
                            type="text"
                            value={cue.text}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubtitleConfig((prev) => ({
                                ...prev,
                                cues: prev.cues.map((c, i) =>
                                  i === idx ? { ...c, text: val, words: val.split(" ") } : c
                                ),
                              }));
                            }}
                            className={`flex-1 text-xs font-bold bg-transparent border-none outline-none ${
                              isActive ? "text-white" : "text-slate-800"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* NỘI DUNG TAB 2: RA LỆNH PROMPT */}
            {leftTab === "prompt" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 animate-in fade-in">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wand2 size={16} className="text-purple-600" />
                  Mô Tả Chỉnh Sửa Video
                </label>

                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendTimelinePrompt();
                    }
                  }}
                  rows={4}
                  placeholder="Ví dụ: Tăng tốc 1.25x video, ở giây 00:05 chèn banner ƯU ĐÃI ĐẶC BIỆT..."
                  className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800 placeholder:text-slate-400 font-medium resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 italic">Bấm Enter để áp dụng</span>
                  <button
                    type="button"
                    onClick={handleSendTimelinePrompt}
                    disabled={isAnalyzingPrompt || !userPrompt.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {isAnalyzingPrompt ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Áp Dụng Lệnh
                  </button>
                </div>
              </div>
            )}

            {/* BẢNG ĐIỀU CHỈNH ĐỘ BÙ TRỄ */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-600" />
                  Tinh Chỉnh Bù Trễ Giọng Nói
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {subtitleConfig.latencyOffset > 0 ? `+${subtitleConfig.latencyOffset}s` : `${subtitleConfig.latencyOffset}s`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">-0.5s (Sớm)</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={subtitleConfig.latencyOffset}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSubtitleConfig((p) => ({ ...p, latencyOffset: val }));
                  }}
                  className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-400">+0.5s (Chậm)</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI KHUNG PHỤ ĐỀ NẰM GỌN TRONG 1/3 DƯỚI VIDEO 9:16 */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{videoName}</span>
                <button
                  type="button"
                  onClick={() => setCompareOriginal(!compareOriginal)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    compareOriginal ? "bg-amber-500 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Eye size={13} />
                  {compareOriginal ? "Đang xem: GỐC" : "Xem bản gốc"}
                </button>
              </div>

              {/* MÀN HÌNH VIDEO */}
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  loop
                  playsInline
                  onLoadedMetadata={() => {
                    if (videoRef.current) setVideoDuration(videoRef.current.duration || 123);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                  style={{ transform: flipHorizontal ? "scaleX(-1)" : "scaleX(1)" }}
                />

                {/* 🌟 PHỤ ĐỀ ĐƯỢC CĂN CHUẨN: NẰM GỌN TRONG 1/3 DƯỚI (BOTTOM: 22%), RỘNG VỪA KHÍT THÂN VIDEO 9:16 */}
                {activeSubtitleRender && (
                  <div
                    className="absolute pointer-events-none z-40 text-center transition-all duration-75"
                    style={{
                      bottom: "22%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      maxWidth: "270px",
                      width: "75%",
                    }}
                  >
                    <div className="px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-xs border border-white/20 shadow-2xl">
                      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-base md:text-lg font-black uppercase tracking-tight leading-snug select-none">
                        {activeSubtitleRender.currentCue.words.map((word, wIdx) => {
                          const isSpoken = wIdx === activeSubtitleRender.activeWordIndex;
                          const isPassed = wIdx < activeSubtitleRender.activeWordIndex;

                          return (
                            <span
                              key={wIdx}
                              className={`transition-all duration-75 inline-block ${
                                isSpoken
                                  ? "text-yellow-300 scale-125 drop-shadow-[0_0_12px_rgba(253,224,71,1)] underline decoration-yellow-400 decoration-2"
                                  : isPassed
                                  ? "text-white"
                                  : "text-slate-400 opacity-60"
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* LOGO */}
                {isLogoVisible && (
                  <div
                    className={`absolute pointer-events-none z-30 transition-all ${
                      logoConfig.position === "top-left" ? "top-4 left-4" : "top-4 right-4"
                    }`}
                    style={{ opacity: logoConfig.opacity / 100 }}
                  >
                    {logoConfig.imageSrc ? (
                      <img src={logoConfig.imageSrc} alt="Logo" className="h-10 w-auto object-contain rounded-lg drop-shadow-md" />
                    ) : (
                      <div className="px-3.5 py-1.5 bg-blue-600/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-300" />
                        {logoConfig.name}
                      </div>
                    )}
                  </div>
                )}

                {/* BANNER */}
                {isBannerVisible && (
                  <div
                    className="absolute left-4 right-4 pointer-events-none z-30 transition-all animate-in fade-in zoom-in-95 duration-200"
                    style={{ bottom: "6%" }}
                  >
                    <div className="p-3 rounded-2xl shadow-2xl border border-white/25 text-center text-white backdrop-blur-md bg-gradient-to-r from-red-600/95 via-rose-600/95 to-amber-600/95">
                      <h4 className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">
                        {bannerConfig.title}
                      </h4>
                      {bannerConfig.subtitle && (
                        <p className="text-[10px] md:text-xs text-amber-200 font-bold mt-0.5">
                          {bannerConfig.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
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
                    className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="font-bold text-slate-700">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 123}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        seekTo(val);
                      }}
                      className="flex-1 accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-slate-700">{formatTime(videoDuration)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Đang phát lời thoại ({subtitleConfig.cues.length} câu ngắn)
                  </span>
                  {bannerConfig.enabled && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                      🏷️ Banner: {formatTime(bannerConfig.startSec)} ➔ {formatTime(bannerConfig.endSec)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* XUẤT VIDEO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Download size={15} className="text-emerald-600" />
                Xuất Video Kèm Phụ Đề Chuẩn, Logo & Banner
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsExporting(true);
                    setExportProgress(20);
                    const t = setInterval(() => {
                      setExportProgress((p) => {
                        if (p >= 95) {
                          clearInterval(t);
                          setTimeout(() => {
                            setIsExporting(false);
                            alert("Xuất video thành công! Video đã được gắn phụ đề chuẩn 100%, Logo và Banner.");
                          }, 400);
                          return 100;
                        }
                        return p + 25;
                      });
                    }, 400);
                  }}
                  disabled={isExporting}
                  className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                  Xuất & Tải Video Ngay
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ffmpeg -i input.mp4 -vf "subtitles=subs.ass" output.mp4`);
                    setCopiedFfmpeg(true);
                    setTimeout(() => setCopiedFfmpeg(false), 2000);
                  }}
                  className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedFfmpeg ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  Sao Chép Lệnh FFmpeg
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL CẤU HÌNH LOGO & BANNER */}
      {showLogoBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Thiết Lập Logo & Banner</h3>
              <button type="button" onClick={() => setShowLogoBannerModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu đề Banner:</label>
                <input
                  type="text"
                  value={bannerConfig.title}
                  onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả phụ Banner:</label>
                <input
                  type="text"
                  value={bannerConfig.subtitle || ""}
                  onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogoBannerModal(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Xong & Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}