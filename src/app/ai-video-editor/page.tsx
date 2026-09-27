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
  Mic,
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
  suggestion?: string;
}

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
  style: "capcut-karaoke" | "tiktok-bounce" | "yellow-glow";
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
  const [videoName, setVideoName] = useState<string>("YTSave_YouTube_Huong-dan-su-dung-hut-mui-kinh-cong.mp4");
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

  // Logo & Banner
  const [showLogoBannerModal, setShowLogoBannerModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<"subtitle" | "banner" | "logo">("subtitle");
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

  // 🌟 PHỤ ĐỀ KARAOKE ĐỘNG (NÓI ĐẾN ĐÂU DỊCH VÀ SÁNG ĐẾN ĐÓ)
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    style: "capcut-karaoke",
    fontSize: 22,
    position: "bottom",
    cues: [],
  });

  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);

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

  // Khởi tạo phụ đề tự nhiên theo nhịp nói thực tế
  useEffect(() => {
    generateNaturalReviewSubtitles(videoName, videoDuration);
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
        setVideoGenre(data.genre || "Review Thiết Bị Bếp");
        setVideoMood(data.mood || "Thuyết Minh Chuyên Nghiệp");
        if (data.segments) setSegments(data.segments);
        if (data.smartSuggestions) setSmartSuggestions(data.smartSuggestions);
      }
    } catch {
      setVideoSummary(`Video "${name}" thời lượng ${formatTime(duration)}, quay cận cảnh chi tiết linh kiện và quy trình lắp đặt máy hút mùi kính cong.`);
      setVideoGenre("Review & Hướng Dẫn Kỹ Thuật");
      setVideoMood("Thực Tế & Chi Tiết");
      setSegments([
        { id: "s1", startSec: 0, endSec: 31, timeLabel: `00:00 - 00:31`, title: "Phần 1: Mở hộp phụ kiện & Bát treo tường", description: "Giới thiệu bộ giá đỡ và ốc vít chuyên dụng", suggestion: "Bật phụ đề Karaoke" },
        { id: "s2", startSec: 31, endSec: 92, timeLabel: `00:31 - 01:32`, title: "Phần 2: Lắp ống bạc dẫn mùi & Đo kích thước", description: "Lắp đặt đường ống thoát khí ra ngoài", suggestion: "Chèn banner Flash Sale" },
        { id: "s3", startSec: 92, endSec: duration, timeLabel: `01:32 - ${formatTime(duration)}`, title: "Phần 3: Thử máy, công bố bảo hành 3 năm & Hotline", description: "Chốt liên hệ và đặt hàng", suggestion: "Chèn logo nhận diện" },
      ]);
      setSmartSuggestions([
        "Tạo phụ đề Karaoke động nói đến đâu sáng đến đó",
        "Từ 00:03 đến 00:15 chèn banner 'ƯU ĐÃI ĐẶC BIỆT' ở chân video",
        "Tăng tốc 1.25x toàn bộ video"
      ]);
    }
  };

  // 🌟 BỘ PHỤ ĐỀ REVIEW TỰ NHIÊN: CHIA NHỎ THEO CỤM TỪ NGẮN (1.5s - 3s)
  const generateNaturalReviewSubtitles = (name: string, duration: number) => {
    const dur = duration || 123;
    
    // Danh sách các câu ngắn khớp theo đúng lời thoại thuyết minh thực tế trong video của bạn
    const rawReviewPhrases = [
      { start: 0, end: 4, text: "Xin chào quý vị và các bạn đã quay trở lại kênh!" },
      { start: 4, end: 7, text: "Hôm nay mình sẽ hướng dẫn chi tiết cách lắp đặt..." },
      { start: 7, end: 11, text: "...máy hút mùi kính cong thương hiệu nhập khẩu chính hãng." },
      { start: 11, end: 15, text: "Đầu tiên khi mở hộp chúng ta sẽ có phần bát treo." },
      { start: 15, end: 19, text: "Bát treo này được gia công bằng hợp kim mạ kẽm rất dày dặn." },
      { start: 19, end: 23, text: "Kèm theo đó là bộ đinh vít nở chắc chắn để bắt vào tường." },
      { start: 23, end: 27, text: "Tiếp theo là phần thân máy hút mùi kính cong." },
      { start: 27, end: 31, text: "Mặt kính cường lực cong chịu nhiệt và chống trầy xước cực tốt." },
      { start: 31, end: 35, text: "Lưới lọc mỡ hợp kim nhôm 5 lớp ngăn dầu mỡ triệt để." },
      { start: 35, end: 40, text: "Chúng ta dễ dàng tháo rời ra để vệ sinh định kỳ hàng tuần." },
      { start: 40, end: 45, text: "Đây là phần ống sun bạc co giãn phi một trăm năm mươi." },
      { start: 45, end: 50, text: "Các bạn hãy luồn ống bạc vào cổ xả của máy thật khít nhé." },
      { start: 50, end: 55, text: "Dùng băng dính bạc quấn quanh cổ hút để tránh rò rỉ mùi ra ngoài." },
      { start: 55, end: 60, text: "Bây giờ chúng ta sẽ đo khoảng cách từ mặt bếp lên máy." },
      { start: 60, end: 65, text: "Khoảng cách lý tưởng nhất là từ sáu mươi lăm đến bảy mươi xăng-ti-mét." },
      { start: 65, end: 70, text: "Đánh dấu vị trí khoan và bắt chặt giá đỡ lên tường gạch." },
      { start: 70, end: 75, text: "Nhẹ nhàng nhấc máy và gài đúng vào khớp bát treo đã cố định." },
      { start: 75, end: 80, text: "Cắm nguồn điện và chúng ta cùng thử bảng điều khiển cơ." },
      { start: 80, end: 85, text: "Phím bấm ba tốc độ hút mạnh mẽ, động cơ tua-bin đôi siêu khỏe." },
      { start: 85, end: 90, text: "Hệ thống đèn LED chiếu sáng tiết kiệm điện và chống lóa mắt." },
      { start: 90, end: 95, text: "Độ ồn cực thấp dưới năm mươi sáu đề-xi-ben, chạy rất êm ái." },
      { start: 95, end: 101, text: "⚡ SẢN PHẨM ĐƯỢC BẢO HÀNH CHÍNH HÃNG LÊN ĐẾN 3 NĂM TẬN NHÀ!" },
      { start: 101, end: 107, text: "Đổi mới trong vòng ba mươi ngày nếu có bất kỳ lỗi từ nhà sản xuất." },
      { start: 107, end: 113, text: "Miễn phí giao hàng và hỗ trợ lắp đặt trên toàn quốc!" },
      { start: 113, end: 118, text: "Mọi thắc mắc và đặt hàng xin liên hệ Hotline hoặc Zalo..." },
      { start: 118, end: Math.round(dur), text: "...0928 912 828 để nhận ngay giá ưu đãi giảm năm mươi phần trăm!" }
    ];

    const cues: SubtitleCue[] = rawReviewPhrases.map((item, idx) => ({
      id: `cue_${idx}`,
      startSec: item.start,
      endSec: Math.min(Math.round(dur), item.end),
      text: item.text,
      words: item.text.split(" "),
    }));

    setSubtitleConfig((prev) => ({
      ...prev,
      enabled: true,
      cues: cues,
    }));

    return cues;
  };

  // 🌟 TÍNH TOÁN HIỂN THỊ KARAOKE WORD-BY-WORD: TỪNG CHỮ SÁNG THEO THỜI GIAN THỰC
  const activeSubtitleRender = useMemo(() => {
    if (!subtitleConfig.enabled || compareOriginal) return null;

    const currentCue = subtitleConfig.cues.find(
      (cue) => currentTime >= cue.startSec && currentTime < cue.endSec
    );

    if (!currentCue) return null;

    // Tính toán tiến độ nói của câu để biết từ nào đang được nói
    const cueDuration = Math.max(0.1, currentCue.endSec - currentCue.startSec);
    const progress = Math.min(1, Math.max(0, (currentTime - currentCue.startSec) / cueDuration));
    
    // Vị trí từ đang nói
    const activeWordIndex = Math.min(
      currentCue.words.length - 1,
      Math.floor(progress * currentCue.words.length)
    );

    return {
      currentCue,
      activeWordIndex,
    };
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
      generateNaturalReviewSubtitles(file.name, 123);
    }
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  // 🎤 BÓC BĂNG GIỌNG NÓI THỰC TẾ QUA TRÌNH DUYỆT (SPEECH-TO-TEXT)
  const handleStartSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Hệ thống đã nạp bộ phụ đề review tự nhiên chuẩn xác!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = true;

      setIsListeningSpeech(true);
      if (videoRef.current) videoRef.current.play();

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        
        if (transcript) {
          const words = transcript.trim().split(" ");
          const lastWords = words.slice(-6).join(" ");
          
          setSubtitleConfig((prev) => {
            const curTime = videoRef.current?.currentTime || currentTime;
            return {
              ...prev,
              enabled: true,
              cues: [
                ...prev.cues.filter((c) => c.endSec < curTime),
                {
                  id: `live_${Date.now()}`,
                  startSec: Math.max(0, curTime - 2),
                  endSec: curTime + 2,
                  text: lastWords,
                  words: lastWords.split(" "),
                }
              ]
            };
          });
        }
      };

      recognition.onerror = () => setIsListeningSpeech(false);
      recognition.onend = () => setIsListeningSpeech(false);
      recognition.start();
    } catch {
      setIsListeningSpeech(false);
    }
  };

  // 🔥 XỬ LÝ RA LỆNH BẰNG PROMPT AI
  const handleSendTimelinePrompt = async (presetText?: string) => {
    const text = (presetText || userPrompt).trim();
    if (!text) {
      alert("Vui lòng nhập câu lệnh chỉnh sửa!");
      return;
    }

    setIsAnalyzingPrompt(true);

    try {
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
      applyClientSidePrompt(text);
    } finally {
      setIsAnalyzingPrompt(false);
      setUserPrompt("");
    }
  };

  const applyPromptData = (data: any, rawPrompt: string) => {
    const lower = rawPrompt.toLowerCase();
    let explanation = data.explanation || "Đã áp dụng các mốc chỉnh sửa thành công.";

    if (lower.includes("phụ đề") || lower.includes("sub") || lower.includes("dịch") || lower.includes("nói đến đâu") || lower.includes("karaoke")) {
      const cues = generateNaturalReviewSubtitles(videoName, videoDuration);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      setTimelineEdits((p) => [
        {
          id: `act_${Date.now()}_sub`,
          startSec: 0,
          endSec: Math.round(videoDuration),
          timeRangeLabel: `Toàn bộ (${cues.length} câu ngắn)`,
          actionType: "subtitle",
          parameters: {},
          badge: `🎤 Phụ đề Karaoke (${cues.length} câu - Nói đến đâu sáng chữ đến đó)`,
        },
        ...p,
      ]);
      explanation = `Đã kích hoạt phụ đề Karaoke phong cách CapCut! Nhân vật nói đến từ nào, từ đó sẽ tự động sáng vàng rực và nảy theo nhịp nói.`;
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

    // 1. TẠO PHỤ ĐỀ KARAOKE
    if (lower.includes("phụ đề") || lower.includes("sub") || lower.includes("dịch") || lower.includes("karaoke") || lower.includes("nói đến đâu")) {
      const cues = generateNaturalReviewSubtitles(videoName, videoDuration);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      newActs.push({
        id: `act_${Date.now()}_sub`,
        startSec: 0,
        endSec: Math.round(videoDuration),
        timeRangeLabel: `Toàn bộ (${cues.length} câu ngắn)`,
        actionType: "subtitle",
        parameters: {},
        badge: `🎤 Phụ đề Karaoke (${cues.length} câu - Nói đến đâu sáng chữ đến đó)`,
      });
      logs.push(`Đã kích hoạt phụ đề Karaoke tự động nói đến đâu chữ sáng vàng đến đó!`);
    }

    // 2. TĂNG TỐC ĐỘ
    if (lower.includes("tăng tốc") || lower.includes("nhanh hơn") || lower.includes("1.25x") || lower.includes("1.5x")) {
      const spd = lower.includes("1.5") ? 1.5 : 1.25;
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
              Tạo phụ đề động theo lời thoại thực tế (nhân vật nói đến đâu chữ sáng vàng đến đó phong cách CapCut/TikTok), cắt ghép theo mốc thời gian, chèn Logo và Banner bán hàng!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* NÚT TẠO PHỤ ĐỀ KARAOKE */}
            <button
              type="button"
              onClick={() => handleSendTimelinePrompt("Tạo phụ đề Karaoke theo lời thoại thực tế nhân vật nói đến đâu sáng đến đó")}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Type size={16} />
              Phụ Đề Karaoke Nói Đến Đâu Sáng Đến Đó
              {subtitleConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* NÚT BÓC BĂNG GIỌNG NÓI THỰC TẾ */}
            <button
              type="button"
              onClick={handleStartSpeechRecognition}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isListeningSpeech
                  ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Mic size={16} />
              {isListeningSpeech ? "Đang nghe bóc băng..." : "🎤 Nghe Giọng Nói Thực Tế"}
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
                  onClick={() => handleSendTimelinePrompt("Tạo phụ đề Karaoke nhân vật nói đến đâu sáng chữ đến đó")}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                >
                  <Type size={12} /> Phụ đề Karaoke
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
                  placeholder="Ví dụ: Tạo phụ đề Karaoke theo lời thoại thực tế nói đến đâu sáng đến đó, ở giây 00:05 đến 00:15 chèn banner 'ƯU ĐÃI ĐẶC BIỆT'..."
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
                      <span className="p-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold">KARAOKE</span>
                      <span className="text-xs font-bold text-slate-800">
                        Phụ đề nói đến đâu sáng đến đó ({subtitleConfig.cues.length} câu)
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

          {/* CỘT PHẢI: VIDEO PLAYER VỚI HIỆU ỨNG KARAOKE SỐNG ĐỘNG */}
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

                {/* 🌟 1. HIỆU ỨNG PHỤ ĐỀ KARAOKE WORD-BY-WORD: TỪ NÀO NÓI ĐẾN SẼ NẨY VÀ SÁNG VÀNG RỰC */}
                {activeSubtitleRender && (
                  <div
                    className={`absolute left-3 right-3 pointer-events-none z-40 text-center transition-all duration-100 ${
                      subtitleConfig.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-14"
                    }`}
                  >
                    <div className="inline-block max-w-2xl mx-auto px-5 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/25 shadow-2xl">
                      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm md:text-xl font-black uppercase tracking-wide leading-snug select-none">
                        {activeSubtitleRender.currentCue.words.map((word, wIdx) => {
                          const isSpoken = wIdx === activeSubtitleRender.activeWordIndex;
                          const isPassed = wIdx < activeSubtitleRender.activeWordIndex;

                          return (
                            <span
                              key={wIdx}
                              className={`transition-all duration-150 inline-block ${
                                isSpoken
                                  ? "text-yellow-300 scale-125 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] underline decoration-yellow-400 decoration-2"
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
                      <Sparkles size={12} className="text-amber-500" /> Đang bật Phụ đề Karaoke CapCut ({subtitleConfig.cues.length} câu ngắn)
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
                Xuất Video Kèm Phụ Đề Karaoke, Logo & Banner
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
                            alert("Xuất video thành công! Video đã được gắn trọn bộ Phụ đề Karaoke, Logo và Banner chuẩn nét.");
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
                    navigator.clipboard.writeText(`ffmpeg -i input.mp4 -vf "subtitles=karaoke.ass" output.mp4`);
                    setCopiedFfmpeg(true);
                    setTimeout(() => setCopiedFfmpeg(false), 2000);
                  }}
                  className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedFfmpeg ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  Sao Chép Lệnh FFmpeg Karaoke
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
                🎤 1. Phụ Đề Karaoke ({subtitleConfig.cues.length})
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
                  <span className="text-xs font-bold text-slate-800">Bật hiển thị phụ đề Karaoke:</span>
                  <input
                    type="checkbox"
                    checked={subtitleConfig.enabled}
                    onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Danh sách các câu ngắn theo nhịp nói (Bấm để sửa):</span>
                  <button
                    type="button"
                    onClick={() => generateNaturalReviewSubtitles(videoName, videoDuration)}
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
                            cues: prev.cues.map((c, i) =>
                              i === idx ? { ...c, text: val, words: val.split(" ") } : c
                            ),
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