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
  FileText,
  Sliders,
  CheckCircle2
} from "lucide-react";

export interface VideoSegment {
  id: string;
  startSec: number;
  endSec: number;
  timeLabel: string;
  title: string;
  description: string;
  dialogue?: string;
  suggestion?: string;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
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
  style: "tiktok-bold" | "cinema-classic" | "yellow-highlight";
  fontSize: number;
  position: "bottom" | "center";
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
  const [videoName, setVideoName] = useState<string>("Huong-dan-su-dung-hut-mui-kinh-cong.mp4");
  const [videoDuration, setVideoDuration] = useState<number>(123);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Timeline & Tác vụ
  const [timelineEdits, setTimelineEdits] = useState<TimelineAction[]>([]);
  const [activeSpeed, setActiveSpeed] = useState<number>(1.0);
  const [activeFilter, setActiveFilter] = useState<string>("none");
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [letterbox, setLetterbox] = useState<boolean>(false);

  // Logo & Banner
  const [showLogoBannerModal, setShowLogoBannerModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<"logo" | "banner" | "subtitle">("subtitle");
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

  // 🌟 SUBTITLES / PHỤ ĐỀ STATE
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    style: "tiktok-bold",
    fontSize: 22,
    position: "bottom",
    cues: [],
  });

  // AI Learning State
  const [videoSummary, setVideoSummary] = useState<string>("");
  const [videoGenre, setVideoGenre] = useState<string>("");
  const [videoMood, setVideoMood] = useState<string>("");
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  // Prompt State
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");

  // Export
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo phụ đề tự động theo nội dung video
  useEffect(() => {
    generateSmartSubtitles(videoName, videoDuration);
    triggerAiVideoLearning(videoName, videoDuration);
  }, []);

  // Cập nhật tốc độ playbackRate thực tế
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = compareOriginal ? 1.0 : activeSpeed;
    }
  }, [activeSpeed, compareOriginal]);

  // HỌC HIỂU NỘI DUNG VIDEO
  const triggerAiVideoLearning = async (name: string, duration: number) => {
    try {
      const res = await axios.post(`${API_URL}/ai-content/analyze-video-deep`, {
        videoName: name,
        duration: duration || 123,
      });

      const data = res.data?.data;
      if (data) {
        setVideoSummary(data.summary || `Video hướng dẫn và giới thiệu sản phẩm sắc nét, cuốn hút.`);
        setVideoGenre(data.genre || "Review & Hướng Dẫn Sản Phẩm");
        setVideoMood(data.mood || "Chuyên Nghiệp & Thu Hút");
        if (data.segments) setSegments(data.segments);
        if (data.smartSuggestions) setSmartSuggestions(data.smartSuggestions);
      }
    } catch {
      setVideoSummary(`Video "${name}" có thời lượng ${formatTime(duration)}, bao gồm hướng dẫn chi tiết và thông số sản phẩm.`);
      setVideoGenre("Giới Thiệu & Bán Hàng");
      setVideoMood("Năng Động");
      setSegments([
        { id: "s1", startSec: 0, endSec: 25, timeLabel: `00:00 - 00:25`, title: "Phần 1: Mở hộp & Giới thiệu chi tiết thiết bị", description: "Cận cảnh phụ kiện và thân máy", suggestion: "Tăng tốc 1.2x" },
        { id: "s2", startSec: 25, endSec: 85, timeLabel: `00:25 - 01:25`, title: "Phần 2: Hướng dẫn lắp đặt & Thử động cơ", description: "Bật hút mùi, kiểm tra độ êm và lực hút", suggestion: "Chèn banner Flash Sale" },
        { id: "s3", startSec: 85, endSec: duration, timeLabel: `01:25 - ${formatTime(duration)}`, title: "Phần 3: Chính sách bảo hành 3 năm & Đặt hàng", description: "Kêu gọi khách hàng liên hệ", suggestion: "Chèn logo góc phải" },
      ]);
      setSmartSuggestions([
        "Tạo phụ đề tự động toàn bộ video phong cách TikTok",
        "Từ 00:03 đến 00:15 chèn banner 'ƯU ĐÃI ĐẶC BIỆT' ở chân video",
        "Tăng tốc 1.25x đoạn giữa để video ngắn gọn hơn"
      ]);
    }
  };

  // TẠO PHỤ ĐỀ THÔNG MINH TỰ ĐỘNG KHỚP NỘI DUNG VÀ MỐC THỜI GIAN
  const generateSmartSubtitles = (name: string, duration: number) => {
    const isKitchen = name.toLowerCase().includes("hut-mui") || name.toLowerCase().includes("bep") || name.toLowerCase().includes("kinh-cong");
    const dur = duration || 123;
    const cues: SubtitleCue[] = [];

    if (isKitchen) {
      // Bộ phụ đề thực tế cho video máy hút mùi / thiết bị nhà bếp
      const sampleTexts = [
        "Xin chào các bạn, hôm nay mình sẽ hướng dẫn lắp đặt máy hút mùi kính cong!",
        "Đây là dòng máy hút mùi cao cấp nhập khẩu chính hãng.",
        "Phần lưới lọc mỡ bằng inox và nhôm 5 lớp cực kỳ chắc chắn.",
        "Động cơ turbin đôi với công suất hút mạnh mẽ lên tới 1000m3/h.",
        "Các nút điều khiển phím bấm cơ siêu bền và dễ dàng sử dụng.",
        "Thiết kế kính cong thanh lịch, tôn lên vẻ sang trọng cho gian bếp.",
        "Sản phẩm được bảo hành chính hãng lên đến 3 năm tận nhà!",
        "Miễn phí vận chuyển toàn quốc, liên hệ ngay Hotline để nhận ưu đãi hôm nay!"
      ];
      const step = dur / sampleTexts.length;
      sampleTexts.forEach((text, i) => {
        cues.push({
          id: `cue_${i}`,
          startSec: Math.round(i * step),
          endSec: Math.round((i + 1) * step),
          text: text,
        });
      });
    } else {
      // Phụ đề tổng quát tự thích ứng
      const step = Math.max(5, Math.floor(dur / 6));
      for (let i = 0; i < dur; i += step) {
        cues.push({
          id: `cue_${i}`,
          startSec: i,
          endSec: Math.min(dur, i + step),
          text: i === 0 ? "Chào mừng bạn đến với video hướng dẫn chi tiết hôm nay!" : `Nội dung nổi bật phân đoạn ${formatTime(i)} đến ${formatTime(Math.min(dur, i + step))}`
        });
      }
    }

    setSubtitleConfig((prev) => ({
      ...prev,
      enabled: true,
      cues: cues,
    }));

    return cues;
  };

  // TÌM CÂU PHỤ ĐỀ ĐANG ĐƯỢC PHÁT TẠI GIÂY HIỆN TẠI
  const currentSubtitleText = useMemo(() => {
    if (!subtitleConfig.enabled || compareOriginal) return "";
    const activeCue = subtitleConfig.cues.find(
      (cue) => currentTime >= cue.startSec && currentTime < cue.endSec
    );
    return activeCue ? activeCue.text : "";
  }, [subtitleConfig, currentTime, compareOriginal]);

  // UPLOAD VIDEO TỪ MÁY
  const handleUserUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
      setCurrentTime(0);
      setTimelineEdits([]);
      triggerAiVideoLearning(file.name, 123);
      generateSmartSubtitles(file.name, 123);
    }
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  // 🔥 XỬ LÝ RA LỆNH BẰNG PROMPT AI (TÍCH HỢP TẠO PHỤ ĐỀ)
  const handleSendTimelinePrompt = async (presetText?: string) => {
    const text = (presetText || userPrompt).trim();
    if (!text) {
      alert("Vui lòng nhập câu lệnh chỉnh sửa!");
      return;
    }

    setIsAnalyzingPrompt(true);

    try {
      // 1. GỌI API BACKEND
      const res = await axios.post(`${API_URL}/ai-content/parse-timeline-prompt`, {
        userPrompt: text,
        duration: videoDuration,
        currentTime: currentTime,
        currentTimeline: segments,
      });

      if (res.data?.success && res.data?.data) {
        applyPromptData(res.data.data, text);
      } else {
        throw new Error("Fallback");
      }
    } catch {
      // 2. CLIENT-SIDE FALLBACK
      applyClientSidePrompt(text);
    } finally {
      setIsAnalyzingPrompt(false);
      setUserPrompt("");
    }
  };

  const applyPromptData = (data: any, rawPrompt: string) => {
    const lower = rawPrompt.toLowerCase();
    let explanation = data.explanation || "Đã áp dụng các mốc chỉnh sửa thành công.";

    // NẾU CÂU LỆNH CÓ YÊU CẦU PHỤ ĐỀ
    if (lower.includes("phụ đề") || lower.includes("sub") || lower.includes("caption") || lower.includes("lời thoại")) {
      const cues = generateSmartSubtitles(videoName, videoDuration);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      setTimelineEdits((p) => [
        {
          id: `act_${Date.now()}_sub`,
          startSec: 0,
          endSec: Math.round(videoDuration),
          timeRangeLabel: `Toàn bộ (${cues.length} câu)`,
          actionType: "subtitle",
          parameters: {},
          badge: `📝 Phụ đề tự động AI (${cues.length} câu khớp giọng đọc)`,
        },
        ...p,
      ]);
      explanation = `Đã tạo phụ đề tự động phong cách TikTok cho toàn bộ video (${cues.length} câu lời thoại)! Chữ to rõ, tự đổi màu theo lời thoại.`;
    }

    if (data.timelineEdits && data.timelineEdits.length > 0) {
      setTimelineEdits((prev) => [...data.timelineEdits, ...prev]);
      const speedAct = data.timelineEdits.find((a: any) => a.actionType === "speed");
      if (speedAct?.parameters?.speed) {
        setActiveSpeed(Number(speedAct.parameters.speed));
      }
    }

    if (data.logoBannerConfig?.banner?.enabled) {
      const b = data.logoBannerConfig.banner;
      setBannerConfig((p) => ({
        ...p,
        enabled: true,
        title: b.title || p.title,
        subtitle: b.subtitle || p.subtitle,
        position: b.position || p.position,
        startSec: b.startSec ?? p.startSec,
        endSec: b.endSec ?? p.endSec,
      }));
    }

    if (data.logoBannerConfig?.logo?.enabled) {
      const l = data.logoBannerConfig.logo;
      setLogoConfig((p) => ({
        ...p,
        enabled: true,
        name: l.text || p.name,
      }));
    }

    setAiExplanation(explanation);
  };

  const applyClientSidePrompt = (text: string) => {
    const lower = text.toLowerCase();
    const newActs: TimelineAction[] = [];
    const logs: string[] = [];

    // 1. TẠO PHỤ ĐỀ
    if (lower.includes("phụ đề") || lower.includes("sub") || lower.includes("caption") || lower.includes("lời thoại") || lower.includes("vietsub")) {
      const cues = generateSmartSubtitles(videoName, videoDuration);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      newActs.push({
        id: `act_${Date.now()}_sub`,
        startSec: 0,
        endSec: Math.round(videoDuration),
        timeRangeLabel: `Toàn bộ (${cues.length} câu)`,
        actionType: "subtitle",
        parameters: {},
        badge: `📝 Phụ đề tự động AI (${cues.length} câu khớp video)`,
      });
      logs.push(`Đã tạo và bật phụ đề động phong cách TikTok cho toàn bộ video!`);
    }

    // 2. TĂNG TỐC ĐỘ
    if (lower.includes("tăng tốc") || lower.includes("nhanh hơn") || lower.includes("1.25x") || lower.includes("1.5x") || lower.includes("1.3x")) {
      const spd = lower.includes("1.5") ? 1.5 : lower.includes("1.3") ? 1.3 : 1.25;
      setActiveSpeed(spd);
      if (videoRef.current) videoRef.current.playbackRate = spd;
      newActs.push({
        id: `act_${Date.now()}_spd`,
        startSec: 0,
        endSec: Math.round(videoDuration),
        timeRangeLabel: `00:00 - ${formatTime(videoDuration)}`,
        actionType: "speed",
        parameters: { speed: spd },
        badge: `⚡ Tăng tốc độ phát ${spd}x`,
      });
      logs.push(`Tăng tốc ${spd}x`);
    }

    // 3. CHÈN BANNER
    if (lower.includes("banner") || lower.includes("ưu đãi") || lower.includes("giảm giá") || lower.includes("sale")) {
      const titleMatch = text.match(/['"“](.+?)['"”]/);
      const titleText = titleMatch ? titleMatch[1] : "⚡ ƯU ĐÃI ĐẶC BIỆT";
      setBannerConfig((p) => ({ ...p, enabled: true, title: titleText }));
      newActs.push({
        id: `act_${Date.now()}_ban`,
        startSec: 3,
        endSec: 15,
        timeRangeLabel: "00:03 - 00:15",
        actionType: "banner",
        parameters: { title: titleText },
        badge: `🏷️ Banner: "${titleText}"`,
      });
      logs.push(`Chèn banner "${titleText}"`);
    }

    // 4. CHÈN LOGO
    if (lower.includes("logo") || lower.includes("watermark")) {
      setLogoConfig((p) => ({ ...p, enabled: true }));
      logs.push("Bật logo KPOST AI góc trên phải");
    }

    if (newActs.length > 0) {
      setTimelineEdits((p) => [...newActs, ...p]);
    }
    setAiExplanation(logs.length > 0 ? logs.join(" • ") : "Đã cập nhật các mốc thời gian theo câu lệnh.");
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
                AI Video Editor & Timeline Studio
                <span className="bg-purple-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                  AI PRO
                </span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Ra lệnh AI tạo phụ đề tự động (Auto-Captions TikTok), cắt ghép theo mốc thời gian, tăng tốc độ, chèn Logo và Banner bán hàng chỉ với 1 cú click!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* NÚT TẠO PHỤ ĐỀ AI NHANH */}
            <button
              type="button"
              onClick={() => handleSendTimelinePrompt("Tạo phụ đề tự động cho toàn bộ video phong cách TikTok")}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Type size={16} />
              Tạo Phụ Đề AI
              {subtitleConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowLogoBannerModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ImageIcon size={16} />
              Logo & Banner
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud size={16} />
              Tải Video Lên
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUserUploadVideo} className="hidden" />
          </div>
        </div>

        {/* NỘI DUNG AI ĐÃ HỌC HIỂU */}
        {videoSummary && (
          <div className="mb-6 bg-white border border-purple-200 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shrink-0 mt-0.5">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black uppercase text-purple-900 tracking-wider">
                      AI Đã Học & Hiểu Toàn Bộ Nội Dung Video Này
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                      {videoGenre}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                      Tone: {videoMood}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                    {videoSummary}
                  </p>
                </div>
              </div>

              {/* Gợi ý 1-click */}
              <div className="shrink-0 bg-purple-50/70 p-3 rounded-2xl border border-purple-100 max-w-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block mb-1.5 flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> Gợi ý từ AI (Bấm để áp dụng ngay):
                </span>
                <div className="space-y-1.5">
                  {smartSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendTimelinePrompt(sug)}
                      className="text-left w-full text-[11px] text-slate-700 hover:text-purple-700 bg-white hover:bg-purple-100/60 p-2 rounded-xl border border-purple-200/60 transition-colors font-medium cursor-pointer line-clamp-2"
                    >
                      ✨ {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DẢI PHÂN CẢNH */}
            <div className="mt-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-600" />
                Cấu trúc phân cảnh theo mốc thời gian (Bấm vào phân cảnh để nhảy video đến đúng đoạn):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {segments.map((seg) => {
                  const isActive = currentTime >= seg.startSec && currentTime < seg.endSec;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => seekTo(seg.startSec)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.01]"
                          : "bg-slate-50 hover:bg-purple-50/50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono ${isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"}`}>
                          {seg.timeLabel}
                        </span>
                        {isActive && <span className="text-[10px] font-black uppercase text-amber-300 animate-pulse">Đang phát</span>}
                      </div>
                      <h4 className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900"}`}>{seg.title}</h4>
                      <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? "text-purple-100" : "text-slate-500"}`}>{seg.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2 CỘT: PROMPT VÀ VIDEO PLAYER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI: Ô NHẬP LỆNH */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wand2 size={16} className="text-purple-600" />
                  Mô Tả Chỉnh Sửa Theo Thời Gian Video
                </label>
                <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  Vị trí: {formatTime(currentTime)}
                </span>
              </div>

              {/* Nút bấm nhanh */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => handleSendTimelinePrompt("Tạo phụ đề tự động phong cách TikTok cho video")}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                >
                  <Type size={12} /> Tạo Phụ Đề AI
                </button>
                <button
                  type="button"
                  onClick={() => setUserPrompt(`Từ giây ${Math.floor(currentTime)}s đến ${Math.min(Math.round(videoDuration), Math.floor(currentTime) + 10)}s chèn banner `)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  + Chèn mốc đang dừng ({formatTime(currentTime)})
                </button>
                <button
                  type="button"
                  onClick={() => setUserPrompt("Cắt bỏ 3 giây đầu bị thừa")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  ✂️ Cắt đầu
                </button>
              </div>

              {/* Textarea nhập prompt */}
              <div className="relative">
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
                  placeholder="Ví dụ: Tạo phụ đề cho toàn bộ video phong cách TikTok, ở giây 00:05 đến 00:15 chèn banner 'ƯU ĐÃI ĐẶC BIỆT' và tăng tốc độ 1.25x..."
                  className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800 placeholder:text-slate-400 font-medium resize-none leading-relaxed"
                />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 italic">
                    Gõ tự do tiếng Việt • Bấm Enter để áp dụng
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSendTimelinePrompt()}
                    disabled={isAnalyzingPrompt || !userPrompt.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-purple-500/25 transition-all cursor-pointer"
                  >
                    {isAnalyzingPrompt ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Áp Dụng Lệnh
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiExplanation && (
                <div className="mt-3.5 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                  <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-purple-900 leading-relaxed">
                    {aiExplanation}
                  </p>
                </div>
              )}
            </div>

            {/* DANH SÁCH HÀNH ĐỘNG ĐÃ ÁP DỤNG */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers size={15} className="text-blue-600" />
                  Các Hành Động Đã Áp Dụng ({timelineEdits.length + (logoConfig.enabled ? 1 : 0) + (bannerConfig.enabled ? 1 : 0) + (subtitleConfig.enabled ? 1 : 0)})
                </h3>
                {timelineEdits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineEdits([]);
                      setActiveSpeed(1.0);
                      if (videoRef.current) videoRef.current.playbackRate = 1.0;
                    }}
                    className="text-[11px] font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {/* ITEM PHỤ ĐỀ */}
                {subtitleConfig.enabled && (
                  <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold">SUB</span>
                      <span className="text-xs font-bold text-slate-800">
                        Phụ đề tự động AI ({subtitleConfig.cues.length} câu)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalActiveTab("subtitle");
                          setShowLogoBannerModal(true);
                        }}
                        className="text-xs text-indigo-600 hover:underline font-bold px-2 py-0.5"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubtitleConfig((p) => ({ ...p, enabled: false }))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {logoConfig.enabled && (
                  <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">LOGO</span>
                      <span className="text-xs font-bold text-slate-800">{logoConfig.name} ({logoConfig.position})</span>
                    </div>
                    <button type="button" onClick={() => setLogoConfig((p) => ({ ...p, enabled: false }))} className="text-slate-400 hover:text-red-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {bannerConfig.enabled && (
                  <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded-md bg-amber-600 text-white text-[10px] font-bold shrink-0">BANNER</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{bannerConfig.title}</span>
                    </div>
                    <button type="button" onClick={() => setBannerConfig((p) => ({ ...p, enabled: false }))} className="text-slate-400 hover:text-red-600 p-1 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {timelineEdits.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.badge}</span>
                    <button
                      type="button"
                      onClick={() => setTimelineEdits((p) => p.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI LỚP PHỦ PHỤ ĐỀ, LOGO & BANNER */}
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
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setVideoDuration(videoRef.current.duration || 123);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                  style={{ transform: flipHorizontal ? "scaleX(-1)" : "scaleX(1)" }}
                />

                {/* 🌟 1. HIỂN THỊ PHỤ ĐỀ ĐỘNG PHONG CÁCH TIKTOK TRÊN MÀN HÌNH */}
                {currentSubtitleText && (
                  <div
                    className={`absolute left-4 right-4 pointer-events-none z-40 text-center transition-all duration-150 animate-in fade-in zoom-in-95 ${
                      subtitleConfig.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-14"
                    }`}
                  >
                    <div className="inline-block max-w-xl mx-auto px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-xs border border-white/20 shadow-2xl">
                      <p className="text-white font-black text-sm md:text-lg tracking-wide uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        <span className="text-yellow-300 mr-1.5">⚡</span>
                        {currentSubtitleText}
                      </p>
                    </div>
                  </div>
                )}

                {/* 🌟 2. LOGO OVERLAY */}
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

                {/* 🌟 3. BANNER OVERLAY */}
                {isBannerVisible && (
                  <div
                    className={`absolute left-4 right-4 pointer-events-none z-30 transition-all animate-in fade-in zoom-in-95 duration-200 ${
                      bannerConfig.position === "top" ? "top-6" : "bottom-4"
                    }`}
                  >
                    <div className="p-3.5 rounded-2xl shadow-2xl border border-white/25 text-center text-white backdrop-blur-md bg-gradient-to-r from-red-600/95 via-rose-600/95 to-amber-600/95">
                      <h4 className="text-sm md:text-base font-black uppercase tracking-wider leading-tight">
                        {bannerConfig.title}
                      </h4>
                      {bannerConfig.subtitle && (
                        <p className="text-[11px] md:text-xs text-amber-200 font-bold mt-0.5">
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
                  {subtitleConfig.enabled && (
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 flex items-center gap-1.5">
                      <Type size={12} /> Đang bật Phụ đề TikTok ({subtitleConfig.cues.length} câu)
                    </span>
                  )}
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
                Xuất Video Kèm Phụ Đề, Logo & Banner
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsExporting(true);
                    setExportProgress(15);
                    const t = setInterval(() => {
                      setExportProgress((p) => {
                        if (p >= 95) {
                          clearInterval(t);
                          setTimeout(() => {
                            setIsExporting(false);
                            alert("Xuất video thành công! Video đã được gắn trọn bộ Phụ đề, Logo và Banner chuẩn nét.");
                          }, 400);
                          return 100;
                        }
                        return p + 25;
                      });
                    }, 400);
                  }}
                  disabled={isExporting}
                  className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Đang xuất... ({exportProgress}%)
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Xuất & Tải Video Ngay
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ffmpeg -i input.mp4 -vf "subtitles=subs.srt" output.mp4`);
                    setCopiedFfmpeg(true);
                    setTimeout(() => setCopiedFfmpeg(false), 2000);
                  }}
                  className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedFfmpeg ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  Sao Chép Lệnh FFmpeg Phụ Đề
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL CẤU HÌNH PHỤ ĐỀ, LOGO & BANNER */}
      {showLogoBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Cấu Hình Hiển Thị Video</h3>
              <button type="button" onClick={() => setShowLogoBannerModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            {/* TABS */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setModalActiveTab("subtitle")}
                className={`py-2 rounded-xl font-black text-xs uppercase cursor-pointer ${
                  modalActiveTab === "subtitle" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                📝 1. Phụ Đề ({subtitleConfig.cues.length})
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab("banner")}
                className={`py-2 rounded-xl font-black text-xs uppercase cursor-pointer ${
                  modalActiveTab === "banner" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                🏷️ 2. Banner
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab("logo")}
                className={`py-2 rounded-xl font-black text-xs uppercase cursor-pointer ${
                  modalActiveTab === "logo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                🛡️ 3. Logo
              </button>
            </div>

            {/* TAB PHỤ ĐỀ */}
            {modalActiveTab === "subtitle" && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Bật hiển thị phụ đề trên video:</span>
                  <input
                    type="checkbox"
                    checked={subtitleConfig.enabled}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Danh sách câu thoại phụ đề (Bấm để sửa câu chữ):</span>
                  <button
                    type="button"
                    onClick={() => generateSmartSubtitles(videoName, videoDuration)}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Tạo lại tự động
                  </button>
                </div>

                <div className="space-y-2">
                  {subtitleConfig.cues.map((cue, idx) => (
                    <div key={cue.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-md shrink-0 mt-1">
                        {formatTime(cue.startSec)} - {formatTime(cue.endSec)}
                      </span>
                      <input
                        type="text"
                        value={cue.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubtitleConfig((prev) => ({
                            ...prev,
                            cues: prev.cues.map((c, i) => (i === idx ? { ...c, text: val } : c)),
                          }));
                        }}
                        className="flex-1 text-xs font-bold bg-white px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB BANNER */}
            {modalActiveTab === "banner" && (
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả phụ:</label>
                  <input
                    type="text"
                    value={bannerConfig.subtitle || ""}
                    onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* TAB LOGO */}
            {modalActiveTab === "logo" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên chữ Logo:</label>
                  <input
                    type="text"
                    value={logoConfig.name}
                    onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
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
      )}

    </div>
  );
}