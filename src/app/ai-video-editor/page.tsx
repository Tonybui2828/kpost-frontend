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
  FileDown,
  Edit2,
  Check,
  Palette,
  Flame,
  Radio,
  Link2,
  Upload,
  AlertTriangle,
  FolderOpen,
  Download,
  Sliders,
  Plus,
  Trash2
} from "lucide-react";

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  timeLabel: string;
  text: string;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  stylePreset: "tiktok-yellow" | "white-stroke" | "black-pill" | "yellow-box";
  position: "bottom-15" | "bottom-24" | "center" | "top";
  offsetSeconds: number;
  showBgBox: boolean;
}

export interface SubtitleMaskConfig {
  enabled: boolean;
  positionYPercent: number;
  heightPx: number;
  blurAmount: number;
  opacity: number;
  bgColor: string;
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

export interface VisualEffectConfig {
  filterType: "none" | "cinematic" | "bright" | "vintage" | "vibrant" | "cyberpunk" | "golden";
  brightness: number;
  contrast: number;
  saturation: number;
  speed: number;
}

export interface SoundEffectConfig {
  bgMusicEnabled: boolean;
  bgMusicType: "none" | "upbeat" | "chill" | "corporate" | "epic";
  bgMusicVolume: number;
  dingEffectEnabled: boolean;
  whooshEffectEnabled: boolean;
  boostVoiceVolume: boolean;
}

export interface VoiceCharacter {
  id: string;
  name: string;
  group: "kids" | "adults" | "seniors";
  ageRange: string;
  avatar: string;
  badge: string;
  gender: "male" | "female";
  pitch: number;
  rate: number;
  description: string;
  sampleText: string;
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  {
    id: "adult_female_sweet",
    name: "Mai Anh (Nữ Review Dịu Dàng)",
    group: "adults",
    ageRange: "22–27 tuổi",
    avatar: "👩",
    badge: "Ngọt Ngào Reviewer",
    gender: "female",
    pitch: 1.25,
    rate: 1.05,
    description: "Thủ thỉ tự nhiên như tâm sự, giọng điệu cuốn hút, chuyên đồ gia dụng, mỹ phẩm.",
    sampleText: "Mọi người nhìn chiếc máy này hút khỏe dã man chưa nè, dính chặt tấm bìa luôn!"
  },
  {
    id: "adult_male_reviewer",
    name: "Đức Anh (Reviewer Bắt Trend)",
    group: "adults",
    ageRange: "24–28 tuổi",
    avatar: "👱‍♂️",
    badge: "Reviewer Công Nghệ",
    gender: "male",
    pitch: 1.02,
    rate: 1.12,
    description: "Tốc độ nhanh, dứt khoát, chuyên đồ gia dụng thông minh, công nghệ.",
    sampleText: "Anh em xem lực hút con máy này thực sự quá đỉnh trong tầm giá!"
  },
  {
    id: "adult_male_mc",
    name: "Minh Quân (Nam MC Trầm Ấm)",
    group: "adults",
    ageRange: "30–35 tuổi",
    avatar: "🎙️",
    badge: "MC Quyền Lực",
    gender: "male",
    pitch: 0.88,
    rate: 0.98,
    description: "Trầm ấm, truyền cảm, trang trọng, chuyên phim ngắn drama, xe cộ, tin tức.",
    sampleText: "Khoảnh khắc người đàn ông mở cánh cửa, mọi sự thật ngỡ ngàng đều được hé lộ."
  },
  {
    id: "child_boy",
    name: "Bé Bắp (Bé Trai 5–7 tuổi)",
    group: "kids",
    ageRange: "5–7 tuổi",
    avatar: "👦",
    badge: "Trẻ Em Lí Lắc",
    gender: "male",
    pitch: 1.65,
    rate: 1.08,
    description: "Giọng ngây thơ, hồn nhiên, reo hò thích thú, chuyên đồ chơi thiếu nhi.",
    sampleText: "Oa các bạn ơi, nhìn món đồ chơi này thích mê luôn nè!"
  },
  {
    id: "adult_female_news",
    name: "Thu Thảo (Nữ Thuyết Minh)",
    group: "adults",
    ageRange: "28–32 tuổi",
    avatar: "💼",
    badge: "Thuyết Minh Chuyên Nghiệp",
    gender: "female",
    pitch: 1.08,
    rate: 1.0,
    description: "Đài từ rõ ràng, âm vang, ấm áp, chuyên video quảng cáo sản phẩm cao cấp.",
    sampleText: "Thiết kế hiện đại mang đến trải nghiệm tiện nghi và thẩm mỹ tối đa."
  },
  {
    id: "speed_mc",
    name: "MC Siêu Tốc (Khớp Douyin Nhanh)",
    group: "adults",
    ageRange: "20–25 tuổi",
    avatar: "⚡",
    badge: "Siêu Tốc Douyin",
    gender: "female",
    pitch: 1.05,
    rate: 1.35,
    description: "Tốc độ nói nhanh, dứt khoát, bắt trọn 100% nhịp độ nói liên thanh của video Douyin.",
    sampleText: "Mọi người nhìn kỹ nha, món này đang cực kỳ hot rần rần những ngày qua nè!",
  }
];

export const POPULAR_VOICES = [
  { id: "adult_female_sweet", name: "Mai Anh (Nữ Review)", shortName: "Nữ Dịu Dàng", avatar: "👩", rate: 1.15, pitch: 1.15 },
  { id: "adult_male_reviewer", name: "Đức Anh (Reviewer)", shortName: "Nam Bắt Trend", avatar: "👱‍♂️", rate: 1.18, pitch: 0.98 },
  { id: "adult_male_mc", name: "Minh Quân (Nam MC)", shortName: "Nam Trầm Ấm", avatar: "🎙️", rate: 1.05, pitch: 0.85 },
  { id: "adult_female_news", name: "Thu Thảo (Thuyết Minh)", shortName: "Nữ Chuẩn Đài", avatar: "💼", rate: 1.10, pitch: 1.05 },
  { id: "speed_mc", name: "MC Siêu Tốc (Douyin)", shortName: "MC Siêu Tốc (1.35x)", avatar: "⚡", rate: 1.35, pitch: 1.05 },
];

export interface DouyinTrendItem {
  id: string;
  title: string;
  originalTitle: string;
  category: "kids_toys" | "smart_home" | "tech_gadgets" | "beauty_care" | "short_drama";
  categoryLabel: string;
  likes: string;
  shares: string;
  videoUrl: string;
  voiceRecommendation: string;
  voiceRecommendationName: string;
  viralInsight: string;
  suggestedScript: { startSec: number; endSec: number; text: string }[];
}

export const DOUYIN_HOT_TRENDS: DouyinTrendItem[] = [
  {
    id: "dy_home_01",
    title: "Máy Hút Mùi Kính Cong Cảm Ứng Lực Hút Siêu Khỏe",
    originalTitle: "大吸力抽油烟机 厨房油烟秒吸净",
    category: "smart_home",
    categoryLabel: "Gia dụng & Nhà bếp",
    likes: "2.5M",
    shares: "320K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "Đoạn test giữ chặt tấm bìa carton lớn chứng minh lực hút cực mạnh ngay giây đầu.",
    suggestedScript: [
      { startSec: 0, endSec: 3.5, text: "Nhìn tấm bìa carton to đùng mà bị hút dính chặt chưa cả nhà ơi!" },
      { startSec: 3.5, endSec: 7.5, text: "Bật nấc 3 một cái là khói dầu xào nấu hút sạch bay trong một nốt nhạc." },
      { startSec: 7.5, endSec: 12, text: "Bảng điều khiển cảm ứng vẫy tay thông minh không cần chạm tay dính dầu mỡ." },
      { startSec: 12, endSec: 16, text: "Bảo hành 3 năm chính hãng, bấm ngay vào góc trái để nhận ưu đãi nhé!" }
    ]
  },
  {
    id: "dy_tech_02",
    title: "Giá Đỡ Điện Thoại Tự Xoay AI Theo Khuôn Mặt 360",
    originalTitle: "AI智能人脸追踪直播支架",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "3.4M",
    shares: "480K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer công nghệ)",
    viralInsight: "Camera tự xoay mượt mà theo người di chuyển tạo hiệu ứng công nghệ cao.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Anh em làm video hay livestream một mình nhất định phải sắm con máy này!" },
      { startSec: 4.5, endSec: 9.5, text: "Đi đến đâu máy tự lia camera theo đến đó, không cần cài app lằng nhằng." },
      { startSec: 9.5, endSec: 14, text: "Nhỏ gọn bỏ túi mang đi quay ngoài trời quá đỉnh luôn anh em!" }
    ]
  }
];

function formatSecToTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

// Hàm chia câu tự nhiên: GIỮ NGUYÊN TỪ GHÉP TIẾNG VIỆT, KHÔNG CHIA VỤN VẶT
function smartSplitSubtitleText(rawCues: SubtitleCue[]): SubtitleCue[] {
  const result: SubtitleCue[] = [];
  let idCounter = 1;

  for (const cue of rawCues) {
    const text = (cue.text || "").trim();
    if (!text) continue;

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 11) {
      result.push({
        id: `cue_${idCounter++}`,
        startSec: cue.startSec,
        endSec: cue.endSec,
        timeLabel: `${formatSecToTime(cue.startSec)} - ${formatSecToTime(cue.endSec)}`,
        text: text,
      });
      continue;
    }

    // Nếu câu dài trên 11 từ, tách theo dấu phẩy / dấu chấm câu trước
    const clauses = text.split(/(?<=[,;:\-–—!?。！？])\s+/).filter(Boolean);
    if (clauses.length > 1) {
      const totalDur = Math.max(0.8, cue.endSec - cue.startSec);
      let curStart = cue.startSec;
      clauses.forEach((cl, idx) => {
        const clWords = cl.split(/\s+/).filter(Boolean).length;
        const dur = (clWords / words.length) * totalDur;
        const curEnd = idx === clauses.length - 1 ? cue.endSec : Number((curStart + dur).toFixed(2));
        result.push({
          id: `cue_${idCounter++}`,
          startSec: Number(curStart.toFixed(2)),
          endSec: Number(curEnd.toFixed(2)),
          timeLabel: `${formatSecToTime(curStart)} - ${formatSecToTime(curEnd)}`,
          text: cl.trim(),
        });
        curStart = curEnd;
      });
    } else {
      // Chia làm 2 vế tự nhiên
      const mid = Math.ceil(words.length / 2);
      const part1 = words.slice(0, mid).join(" ");
      const part2 = words.slice(mid).join(" ");
      const midTime = Number((cue.startSec + (cue.endSec - cue.startSec) * (mid / words.length)).toFixed(2));

      result.push({
        id: `cue_${idCounter++}`,
        startSec: cue.startSec,
        endSec: midTime,
        timeLabel: `${formatSecToTime(cue.startSec)} - ${formatSecToTime(midTime)}`,
        text: part1,
      });
      result.push({
        id: `cue_${idCounter++}`,
        startSec: midTime,
        endSec: cue.endSec,
        timeLabel: `${formatSecToTime(midTime)} - ${formatSecToTime(cue.endSec)}`,
        text: part2,
      });
    }
  }

  return result;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const exportAbortRef = useRef<boolean>(false);

  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<number>(0);
  const [transcribeStatus, setTranscribeStatus] = useState<string>("");
  const [transcribeSuccessMsg, setTranscribeSuccessMsg] = useState<string>("");
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [editingCueText, setEditingCueText] = useState<string>("");

  // Cấu hình hiển thị chữ Sub (Cực nét, viền đen chống mờ)
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    fontSize: 22,
    stylePreset: "tiktok-yellow",
    position: "bottom-24",
    offsetSeconds: 0,
    showBgBox: true,
  });

  // Modal Sửa nhanh toàn bộ kịch bản
  const [showBulkEditModal, setShowBulkEditModal] = useState<boolean>(false);
  const [bulkEditText, setBulkEditText] = useState<string>("");

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

  const [showVoiceoverModal, setShowVoiceoverModal] = useState<boolean>(false);
  const [voiceoverConfig, setVoiceoverConfig] = useState({
    enabled: false,
    selectedVoiceId: "adult_female_sweet",
    muteOriginal: false,
    originalVolume: 100,
    rate: 1.15,
    pitch: 1.15,
  });

  const lastSpokenCueIdRef = useRef<string | null>(null);
  const currentSentenceSpokenRef = useRef<string | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [voiceChangeNotice, setVoiceChangeNotice] = useState<string | null>(null);

  const [showDouyinModal, setShowDouyinModal] = useState<boolean>(false);
  const [activeDouyinTab, setActiveDouyinTab] = useState<"trends" | "scraper">("trends");
  const [douyinCategory, setDouyinCategory] = useState<string>("all");
  const [douyinUrlInput, setDouyinUrlInput] = useState<string>("");
  const [isScrapingDouyin, setIsScrapingDouyin] = useState<boolean>(false);

  const [maskConfig, setMaskConfig] = useState<SubtitleMaskConfig>({
    enabled: false,
    positionYPercent: 14,
    heightPx: 56,
    blurAmount: 16,
    opacity: 0.85,
    bgColor: "#0c0305",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSaveCueEdit = (cueId: string) => {
    if (!editingCueText.trim()) {
      setEditingCueId(null);
      return;
    }

    setSubtitleCues((prevCues) =>
      prevCues.map((cue) => {
        if (cue.id === cueId) {
          return {
            ...cue,
            text: editingCueText.trim(),
          };
        }
        return cue;
      })
    );

    setEditingCueId(null);
    setEditingCueText("");
  };

  // Mở modal sửa kịch bản hàng loạt
  const handleOpenBulkEdit = () => {
    const fullText = subtitleCues.map((c) => c.text).join("\n");
    setBulkEditText(fullText);
    setShowBulkEditModal(true);
  };

  // Lưu sửa kịch bản hàng loạt
  const handleSaveBulkEdit = () => {
    const lines = bulkEditText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setShowBulkEditModal(false);
      return;
    }

    const totalDur = Math.max(10, videoDuration || (videoRef.current ? videoRef.current.duration : 0) || 30);
    const durPerLine = totalDur / lines.length;

    const newCues: SubtitleCue[] = lines.map((line, idx) => {
      const start = Number((idx * durPerLine).toFixed(2));
      const end = Number(((idx + 1) * durPerLine).toFixed(2));
      return {
        id: `bulk_cue_${idx + 1}`,
        startSec: start,
        endSec: end,
        timeLabel: `${formatSecToTime(start)} - ${formatSecToTime(end)}`,
        text: line,
      };
    });

    setSubtitleCues(newCues);
    setShowBulkEditModal(false);
    setTranscribeSuccessMsg(`✅ Đã cập nhật ${newCues.length} câu phụ đề mới khớp hoàn toàn theo kịch bản của bạn!`);
  };

  const handleQuickChangeVoice = (voiceId: string, customRate?: number, customPitch?: number) => {
    const selectedChar = VOICE_CHARACTERS.find((c) => c.id === voiceId);
    const newRate = customRate || selectedChar?.rate || 1.15;
    const newPitch = customPitch || selectedChar?.pitch || 1.0;

    setVoiceoverConfig((prev) => ({
      ...prev,
      selectedVoiceId: voiceId,
      rate: newRate,
      pitch: newPitch,
      enabled: true,
      muteOriginal: true,
      originalVolume: 0,
    }));

    audioCacheRef.current.clear();
    currentSentenceSpokenRef.current = null;
    lastSpokenCueIdRef.current = null;

    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    const sample = selectedChar?.sampleText || (subtitleCues[0]?.text) || "Xin chào! Tôi là MC lồng tiếng.";
    speakSentence(sample, voiceId);

    setVoiceChangeNotice(`✅ Đã chọn MC: ${selectedChar?.name || voiceId} (Tốc độ ${newRate}x)`);
    setTimeout(() => setVoiceChangeNotice(null), 3000);
  };

  const speakSentence = (text: string, voiceId?: string) => {
    if (typeof window === "undefined" || !text.trim()) return;

    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
      ttsAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }

    const cleanSnippet = text.slice(0, 200).trim();
    const activeVoiceId = voiceId || voiceoverConfig.selectedVoiceId;

    const cacheKey = `${activeVoiceId}_${cleanSnippet}`;
    if (audioCacheRef.current.has(cacheKey)) {
      const cached = audioCacheRef.current.get(cacheKey)!;
      try {
        cached.currentTime = 0;
        cached.playbackRate = voiceoverConfig.rate || 1.15;
        ttsAudioRef.current = cached;
        cached.play().catch(() => {});
        return;
      } catch {}
    }

    const fallbackToSpeechSynthesis = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          const utt = new SpeechSynthesisUtterance(cleanSnippet);
          utt.lang = "vi-VN";
          const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
          const viVoice = voices.find((v) => {
            const l = (v.lang || "").toLowerCase().replace("_", "-");
            const n = (v.name || "").toLowerCase();
            return l.startsWith("vi") || n.includes("vietnam") || n.includes("vietnamese");
          });
          if (viVoice) utt.voice = viVoice;
          utt.rate = voiceoverConfig.rate || 1.15;
          utt.pitch = voiceoverConfig.pitch || 1.0;
          window.speechSynthesis.speak(utt);
        } catch {}
      }
    };

    try {
      const audio = document.createElement("audio");
      audio.setAttribute("referrerpolicy", "no-referrer");
      audio.src = `/api/tts?text=${encodeURIComponent(cleanSnippet)}`;
      audio.playbackRate = voiceoverConfig.rate || 1.15;
      ttsAudioRef.current = audio;
      audioCacheRef.current.set(cacheKey, audio);
      audio.onerror = () => fallbackToSpeechSynthesis();
      audio.play().catch(() => fallbackToSpeechSynthesis());
    } catch {
      fallbackToSpeechSynthesis();
    }
  };

  const extractFullAudioBlob = async (fileOrUrl: File | string): Promise<Blob> => {
    let arrayBuffer: ArrayBuffer;
    if (fileOrUrl instanceof File) {
      arrayBuffer = await fileOrUrl.arrayBuffer();
    } else {
      let fetchUrl = fileOrUrl;
      if (fileOrUrl.startsWith("http") && !fileOrUrl.includes("/api/stream-video")) {
        fetchUrl = `/api/stream-video?url=${encodeURIComponent(fileOrUrl)}`;
      }
      const response = await fetch(fetchUrl);
      arrayBuffer = await response.arrayBuffer();
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

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

  // 🎯 TÍNH NĂNG 1: BÓC BĂNG VIDEO CHUẨN XÁC THEO LỜI NÓI THỰC TẾ
  const handleTranscribeWhisper = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(20);
    setTranscribeStatus("Đang trích xuất dữ liệu âm thanh từ video...");

    try {
      const inputSource = selectedFile || videoUrl;
      const wavBlob = await extractFullAudioBlob(inputSource);
      
      setTranscribeProgress(45);
      setTranscribeStatus(`Đang gửi âm thanh (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB) sang AI phân tích lời nói...`);

      const audioBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(wavBlob);
      });

      setTranscribeProgress(70);
      setTranscribeStatus("AI đang nhận diện chính xác từng lời nhân vật nói trong video...");

      const res = await axios.post("/api/transcribe-video", {
        audioBase64,
        mimeType: "audio/wav",
        duration: videoDuration || 60,
        videoTitle: videoName || "Video người dùng",
      }, { timeout: 90000 });

      if (res.data?.cues && res.data.cues.length > 0) {
        const rawCues = res.data.cues.map((c: any, idx: number) => ({
          id: c.id || `cue_${idx + 1}`,
          startSec: Number(c.startSec),
          endSec: Number(c.endSec),
          timeLabel: `${formatSecToTime(Number(c.startSec))} - ${formatSecToTime(Number(c.endSec))}`,
          text: c.text,
        }));

        const formatted = smartSplitSubtitleText(rawCues);
        setSubtitleCues(formatted);
        setSubtitleConfig((p) => ({ ...p, enabled: true }));
        setVoiceoverConfig((p) => ({ ...p, enabled: false, muteOriginal: false, originalVolume: 100 }));

        if (videoRef.current) {
          videoRef.current.volume = 1.0;
        }

        setTranscribeSuccessMsg(
          `🎯 AI đã bóc băng thành công ${formatted.length} câu khớp chuẩn theo người nói! Nội dung: ${res.data.summary || videoName}`
        );
      } else {
        alert("Không nhận diện được giọng nói trong video (âm thanh quá nhỏ hoặc chỉ có nhạc nền). Bạn có thể bấm 'Sửa kịch bản' để nhập nội dung.");
      }

      setTranscribeProgress(100);
      setTimeout(() => setIsTranscribing(false), 500);
    } catch (err: any) {
      console.error("Lỗi bóc băng:", err);
      alert("Lỗi khi bóc băng: " + (err.response?.data?.error || err.message));
      setIsTranscribing(false);
    }
  };

  // 🌐 TÍNH NĂNG 2: DỊCH LỜI THOẠI & LỒNG TIẾNG MC TIẾNG VIỆT
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(20);
    setTranscribeStatus("Đang trích xuất dải âm thanh từ video...");

    try {
      const inputSource = selectedFile || videoUrl;
      const wavBlob = await extractFullAudioBlob(inputSource);
      
      setTranscribeProgress(45);
      setTranscribeStatus("Đang gửi dải âm thanh sang AI...");

      const audioBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(wavBlob);
      });

      setTranscribeProgress(70);
      setTranscribeStatus("AI đang lắng nghe và DỊCH SANG TIẾNG VIỆT chuẩn xác theo sản phẩm...");

      const res = await axios.post("/api/transcribe-and-translate", {
        audioBase64,
        mimeType: "audio/wav",
        duration: videoDuration || 60,
        videoTitle: videoName || "Video Douyin / Review",
      }, { timeout: 90000 });

      if (res.data?.cues && res.data.cues.length > 0) {
        const rawCues = res.data.cues.map((c: any, idx: number) => ({
          id: c.id || `trans_cue_${idx + 1}`,
          startSec: Number(c.startSec),
          endSec: Number(c.endSec),
          timeLabel: `${formatSecToTime(Number(c.startSec))} - ${formatSecToTime(Number(c.endSec))}`,
          text: c.text,
        }));

        const formatted = smartSplitSubtitleText(rawCues);
        setSubtitleCues(formatted);
        setSubtitleConfig((p) => ({ ...p, enabled: true }));
        setVoiceoverConfig((p) => ({
          ...p,
          enabled: true,
          muteOriginal: true,
          originalVolume: 0,
        }));

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          setCurrentTime(0);
          videoRef.current.volume = 0;
        }

        setTranscribeSuccessMsg(
          `🎉 Đã dịch thành công ${formatted.length} câu tiếng Việt! Giọng MC AI đang lồng tiếng theo timeline.`
        );

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          if (formatted.length > 0) {
            speakSentence(formatted[0].text);
          }
        }, 300);
      } else {
        alert("Không nhận diện được giọng nói để dịch. Bạn có thể bấm 'Sửa kịch bản' để nhập lời thoại theo ý muốn.");
      }

      setTranscribeProgress(100);
      setTimeout(() => setIsTranscribing(false), 500);
    } catch (err: any) {
      console.error("Lỗi dịch:", err);
      alert("Lỗi khi dịch phụ đề: " + (err.response?.data?.error || err.message));
      setIsTranscribing(false);
    }
  };

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = visualEffects.speed || 1.0;
    }
  }, [visualEffects.speed]);

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

  const adjustedCurrentTime = currentTime + subtitleConfig.offsetSeconds;
  const currentSubtitleCue = useMemo(() => {
    if (!subtitleConfig.enabled || subtitleCues.length === 0) return null;

    const matched = subtitleCues.find(
      (cue) => adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.4
    );
    if (matched) return matched;

    const recent = subtitleCues.find(
      (cue) => adjustedCurrentTime > cue.endSec && adjustedCurrentTime <= cue.endSec + 0.6
    );
    return recent || null;
  }, [subtitleConfig.enabled, subtitleCues, adjustedCurrentTime]);

  useEffect(() => {
    if (!voiceoverConfig.enabled || isExporting || !isPlaying) return;
    if (currentSubtitleCue) {
      if (currentSubtitleCue.id !== currentSentenceSpokenRef.current) {
        currentSentenceSpokenRef.current = currentSubtitleCue.id;
        lastSpokenCueIdRef.current = currentSubtitleCue.id;
        speakSentence(currentSubtitleCue.text);
      }
    }
  }, [currentSubtitleCue, voiceoverConfig.enabled, isPlaying]);

  useEffect(() => {
    if (currentSubtitleCue && listContainerRef.current) {
      const el = document.getElementById(`cue-item-${currentSubtitleCue.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSubtitleCue]);

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
      setVideoLoadError(null);
      e.target.value = "";
    }
  };

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
      currentSentenceSpokenRef.current = null;
      lastSpokenCueIdRef.current = null;
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
  };

  const handleImportDouyinVideo = (item: DouyinTrendItem) => {
    setSelectedFile(null);
    setVideoUrl(item.videoUrl);
    setVideoName(item.title);
    setCurrentTime(0);
    setIsPlaying(false);
    lastSpokenCueIdRef.current = null;

    const scriptDuration = item.suggestedScript?.[item.suggestedScript.length - 1]?.endSec || 15;
    setVideoDuration(scriptDuration);

    const recommendedChar = VOICE_CHARACTERS.find((c) => c.id === item.voiceRecommendation) || VOICE_CHARACTERS[0];
    setVoiceoverConfig((p) => ({
      ...p,
      enabled: true,
      selectedVoiceId: recommendedChar.id,
      pitch: recommendedChar.pitch,
      rate: recommendedChar.rate,
    }));

    if (item.suggestedScript && item.suggestedScript.length > 0) {
      const cues: SubtitleCue[] = item.suggestedScript.map((s, idx) => ({
        id: `douyin_cue_${idx + 1}`,
        startSec: s.startSec,
        endSec: s.endSec,
        timeLabel: `${formatSecToTime(s.startSec)} - ${formatSecToTime(s.endSec)}`,
        text: s.text,
      }));
      setSubtitleCues(cues);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      setTranscribeSuccessMsg(`🚀 Đã nạp kịch bản tiếng Việt! Gợi ý giọng: ${recommendedChar.name}`);
    }

    setShowDouyinModal(false);
  };

  const handleScrapeDouyinLink = () => {
    let input = douyinUrlInput.trim();
    if (!input) {
      alert("Vui lòng dán link video!");
      return;
    }

    setIsScrapingDouyin(true);
    setSelectedFile(null);
    setVideoUrl(input);
    setVideoName("Video Trực Tuyến");
    setCurrentTime(0);
    setIsPlaying(false);
    setVideoDuration(60);
    setIsScrapingDouyin(false);
    setShowDouyinModal(false);
    setDouyinUrlInput("");
    setTranscribeSuccessMsg("✅ Đã nạp thành công liên kết video!");
  };

  const handleDownloadSRT = () => {
    if (subtitleCues.length === 0) {
      alert("Chưa có phụ đề để tải về!");
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

  const drawOverlaysOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentSec: number,
    logoImg: HTMLImageElement | null
  ) => {
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

    if (maskConfig.enabled) {
      ctx.save();
      const maskY = height * (1 - maskConfig.positionYPercent / 100) - (maskConfig.heightPx * (height / 800)) / 2;
      const maskH = maskConfig.heightPx * (height / 800);
      ctx.fillStyle = maskConfig.bgColor || "#0e0406";
      ctx.globalAlpha = maskConfig.opacity || 0.85;
      ctx.roundRect(width * 0.04, maskY, width * 0.92, maskH, 16);
      ctx.fill();
      ctx.restore();
    }

    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.4
      );

      if (matchedCue) {
        ctx.save();
        let subY = height * 0.76;
        if (subtitleConfig.position === "bottom-15") subY = height * 0.85;
        if (subtitleConfig.position === "center") subY = height * 0.52;
        if (subtitleConfig.position === "top") subY = height * 0.18;

        const fontSize = Math.round((subtitleConfig.fontSize || 22) * (width / 360));
        ctx.font = `900 ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(matchedCue.text).width;
        const boxPadX = 24;
        const boxPadY = 12;

        if (subtitleConfig.stylePreset === "yellow-box") {
          ctx.fillStyle = "#FACC15";
          ctx.roundRect((width - textWidth) / 2 - boxPadX, subY - fontSize / 2 - boxPadY, textWidth + boxPadX * 2, fontSize + boxPadY * 2, 12);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.fillText(matchedCue.text, width / 2, subY);
        } else {
          if (subtitleConfig.showBgBox) {
            ctx.fillStyle = subtitleConfig.stylePreset === "black-pill" ? "rgba(0, 0, 0, 0.9)" : "rgba(0, 0, 0, 0.75)";
            ctx.roundRect((width - textWidth) / 2 - boxPadX, subY - fontSize / 2 - boxPadY, textWidth + boxPadX * 2, fontSize + boxPadY * 2, 14);
            ctx.fill();
          }

          // Viền đen siêu sắc nét chống mờ
          ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.16));
          ctx.strokeStyle = "#000000";
          ctx.lineJoin = "round";
          ctx.strokeText(matchedCue.text, width / 2, subY);

          ctx.fillStyle = subtitleConfig.stylePreset === "white-stroke" ? "#FFFFFF" : "#FDE047";
          ctx.fillText(matchedCue.text, width / 2, subY);
        }
        ctx.restore();
      }
    }
  };

  const handleExportFullVideo = async () => {
    if (!videoUrl) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    exportAbortRef.current = false;

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const exportVideo = document.createElement("video");
    exportVideo.src = videoUrl;
    exportVideo.crossOrigin = "anonymous";
    exportVideo.muted = false;
    exportVideo.loop = false;
    exportVideo.playsInline = true;

    try {
      await new Promise((resolve, reject) => {
        exportVideo.onloadedmetadata = resolve;
        exportVideo.onerror = reject;
      });

      const totalDur = exportVideo.duration || videoDuration || 120;
      const width = exportVideo.videoWidth || 720;
      const height = exportVideo.videoHeight || 1280;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D");
      canvas.width = width;
      canvas.height = height;

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

      const canvasStream = canvas.captureStream(30);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(exportVideo);
        const destination = audioCtx.createMediaStreamDestination();
        const gainNode = audioCtx.createGain();

        if (voiceoverConfig.muteOriginal) {
          gainNode.gain.value = 0;
        } else {
          gainNode.gain.value = voiceoverConfig.originalVolume / 100;
        }

        source.connect(gainNode);
        gainNode.connect(destination);

        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } catch (e) {
        console.warn("Nối audio export:", e);
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finishExport = () => {
        if (recorder.state === "recording") recorder.stop();
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
        setTimeout(() => setIsExporting(false), 500);
      };

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

        ctx.save();
        if (canvasFilterCss !== "none") ctx.filter = canvasFilterCss;
        ctx.drawImage(exportVideo, 0, 0, width, height);
        ctx.restore();

        drawOverlaysOnCanvas(ctx, width, height, curTime, logoImg);

        if (exportVideo.ended || curTime >= totalDur - 0.2) {
          setExportProgress(100);
          setTimeout(() => finishExport(), 300);
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

  const isBannerVisible = useMemo(() => {
    if (!bannerConfig.enabled || compareOriginal) return false;
    return currentTime >= bannerConfig.startSec && currentTime <= bannerConfig.endSec;
  }, [bannerConfig, currentTime, compareOriginal]);

  const filteredDouyinTrends = useMemo(() => {
    if (douyinCategory === "all") return DOUYIN_HOT_TRENDS;
    return DOUYIN_HOT_TRENDS.filter((t) => t.category === douyinCategory);
  }, [douyinCategory]);

  return (
    <div className="flex-1 bg-[#070D18] min-h-screen p-3 md:p-6 font-sans text-slate-100 overflow-y-auto selection:bg-[#1877F2] selection:text-white">
      <div className="max-w-[1540px] mx-auto pb-24">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 bg-[#0C1628]/95 backdrop-blur-md p-5 rounded-3xl border border-[#1A3158] shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="p-2.5 bg-gradient-to-tr from-[#1565C0] via-[#1877F2] to-[#2563EB] rounded-2xl text-white shadow-lg shadow-blue-950/60 border border-blue-400/30">
                <Wand2 size={24} />
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                KPOST AI VIDEO EDITOR
                <span className="bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm border border-blue-400/30">
                  PRO STUDIO
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Trình chỉnh sửa Video AI: Bóc băng tạo phụ đề sắc nét chuẩn xác theo người nói, lồng tiếng MC và chống mờ chữ 100%.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* NÚT 1: TẠO SUB TỪ LỜI NÓI THỰC TẾ */}
            <button
              type="button"
              onClick={handleTranscribeWhisper}
              disabled={isTranscribing || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-950/70 border border-blue-400/40 transition-all cursor-pointer disabled:opacity-50"
              title="Lắng nghe và bóc băng chính xác 100% lời nói của nhân vật trong video"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-white" /> Đang Phân Tích Lời Nói...
                </>
              ) : (
                <>
                  <Mic size={16} className="text-amber-300 animate-pulse" /> 🎤 Tạo Sub Video (AI Bóc Băng)
                </>
              )}
            </button>

            {/* NÚT 2: DỊCH & LỒNG TIẾNG */}
            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing || isExporting}
              className="px-3.5 py-2.5 bg-[#122340] hover:bg-[#1A335C] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-2 border border-[#1E3B68] transition-all cursor-pointer disabled:opacity-50"
              title="Dịch nội dung video ngoại ngữ sang tiếng Việt và bật MC đọc"
            >
              <Sparkles size={16} className="text-amber-400" /> 🌐 Dịch & Lồng Tiếng
            </button>

            {/* NÚT 3: SỬA KỊCH BẢN HÀNG LOẠT */}
            <button
              type="button"
              onClick={handleOpenBulkEdit}
              className="px-3.5 py-2.5 bg-[#122340] hover:bg-[#1A335C] text-amber-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
              title="Xem và chỉnh sửa toàn bộ câu lời thoại bằng tay trong 1 bảng"
            >
              <Edit2 size={15} /> 📝 Sửa Kịch Bản Nhanh
            </button>

            {/* NÚT CHE SUB GỐC */}
            <button
              type="button"
              onClick={() => setMaskConfig((p) => ({ ...p, enabled: !p.enabled }))}
              className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                maskConfig.enabled
                  ? "bg-[#1877F2] text-white border-blue-400 shadow-md"
                  : "bg-[#122340] hover:bg-[#1A335C] text-slate-200 border-[#1E3B68]"
              }`}
            >
              <Eye size={15} className={maskConfig.enabled ? "text-amber-300" : "text-blue-300"} />
              Che Sub Gốc: {maskConfig.enabled ? "BẬT" : "TẮT"}
            </button>

            <button
              type="button"
              onClick={() => setShowDouyinModal(true)}
              className="px-3 py-2.5 bg-[#122340] hover:bg-[#1A335C] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-[#1E3B68] transition-all cursor-pointer"
            >
              <Flame size={15} className="text-amber-400" /> Douyin Trends
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <ImageIcon size={15} /> Logo & Banner
            </button>

            <button
              type="button"
              onClick={handleExportFullVideo}
              disabled={!videoUrl || isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={16} /> ⬇️ Tải Video Về Máy
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
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

        {/* TIẾN TRÌNH XUẤT */}
        {isExporting && (
          <div className="mb-5 p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Download size={22} className="text-emerald-400 animate-bounce" />
                <div>
                  <h3 className="text-sm font-black text-white">Đang Kết Xuất Video Với Phụ Đề Nét Cao...</h3>
                  <p className="text-xs text-emerald-200">Video sẽ tự động tải về máy khi tiến trình đạt 100%.</p>
                </div>
              </div>
              <span className="text-base font-mono font-black text-emerald-300">{exportProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH AI BÓC BĂNG */}
        {isTranscribing && (
          <div className="mb-5 p-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Mic size={22} className="text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white">AI Đang Nghe & Tạo Phụ Đề Chuẩn Xác...</h3>
                  <p className="text-xs text-cyan-200">{transcribeStatus}</p>
                </div>
              </div>
              <span className="text-base font-mono font-black text-amber-300">{transcribeProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${transcribeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 2 CỘT CHÍNH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI: DANH SÁCH LỜI THOẠI TOÀN BỘ VIDEO */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#0C1628]/95 backdrop-blur-md rounded-3xl border border-[#1A3158] p-4 md:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-[#1877F2]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Lời Thoại Video ({subtitleCues.length} Câu)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenBulkEdit}
                    className="px-2.5 py-1 rounded-xl bg-[#142646] hover:bg-[#1D3662] border border-[#23457B] text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 size={12} /> Sửa nhanh
                  </button>
                  {subtitleCues.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadSRT}
                      className="px-2.5 py-1 rounded-xl bg-[#142646] hover:bg-[#1D3662] border border-[#23457B] text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <FileDown size={12} /> .SRT
                    </button>
                  )}
                </div>
              </div>

              {/* BẢNG TÙY BIẾN KIỂU CHỮ SUB CHỐNG MỜ & CỠ CHỮ */}
              <div className="mb-3 p-3 bg-[#08101E] border border-[#1A3158] rounded-2xl flex flex-col gap-2.5 text-xs shadow-inner">
                {/* DÒNG 1: HIỆN SUB & CHỌN MẪU CHỮ NÉT */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-black text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={subtitleConfig.enabled}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Hiện phụ đề trên video
                  </label>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-300">Cỡ chữ:</span>
                    <select
                      value={subtitleConfig.fontSize}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                      className="px-2 py-1 bg-[#122340] border border-[#1E3B68] rounded-lg text-xs font-black text-amber-300"
                    >
                      <option value={18}>18px (Nhỏ)</option>
                      <option value={22}>22px (Chuẩn TikTok)</option>
                      <option value={26}>26px (Lớn rõ)</option>
                      <option value={30}>30px (Cực đại)</option>
                    </select>
                  </div>
                </div>

                {/* DÒNG 2: 4 KIỂU CHỮ SIÊU NÉT (CHỐNG MỜ) */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    Kiểu chữ sắc nét (Chống mờ nền):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "tiktok-yellow", label: "🟡 Vàng TikTok (Viền Đen)", desc: "CapCut Style" },
                      { id: "white-stroke", label: "⚪ Trắng Viền Đen Dày", desc: "Rõ mọi cảnh" },
                      { id: "black-pill", label: "⬛ Hộp Đen Chữ Vàng", desc: "Tương phản cao" },
                      { id: "yellow-box", label: "🟨 Hộp Nền Vàng Chữ Đen", desc: "Nổi bật nhất" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSubtitleConfig((p) => ({ ...p, stylePreset: st.id as any }))}
                        className={`p-1.5 rounded-xl text-left border transition-all cursor-pointer ${
                          subtitleConfig.stylePreset === st.id
                            ? "bg-[#1877F2] text-white border-blue-400 font-black shadow-sm"
                            : "bg-[#122340] text-slate-300 border-[#1E3B68] hover:bg-[#1A335C]"
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">{st.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DÒNG 3: VỊ TRÍ & ĐỒNG BỘ THỜI GIAN */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#152745]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300">Vị trí:</span>
                    <select
                      value={subtitleConfig.position}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, position: e.target.value as any }))}
                      className="px-2 py-0.5 bg-[#122340] border border-[#1E3B68] rounded-lg text-[11px] font-bold text-white"
                    >
                      <option value="bottom-24">Đáy chuẩn (24%)</option>
                      <option value="bottom-15">Sát đáy (15%)</option>
                      <option value="center">Giữa video (50%)</option>
                      <option value="top">Đỉnh trên (80%)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="font-bold text-slate-400">Khớp thời gian:</span>
                    <button
                      type="button"
                      onClick={() => setSubtitleConfig((p) => ({ ...p, offsetSeconds: Number((p.offsetSeconds - 0.2).toFixed(1)) }))}
                      className="px-1.5 py-0.5 bg-[#122340] hover:bg-[#1A335C] text-slate-200 border border-[#1E3B68] rounded font-mono font-bold"
                      title="Hiện sớm hơn 0.2s"
                    >
                      -0.2s
                    </button>
                    <span className="font-mono font-bold text-amber-300 px-1">{subtitleConfig.offsetSeconds > 0 ? `+${subtitleConfig.offsetSeconds}` : subtitleConfig.offsetSeconds}s</span>
                    <button
                      type="button"
                      onClick={() => setSubtitleConfig((p) => ({ ...p, offsetSeconds: Number((p.offsetSeconds + 0.2).toFixed(1)) }))}
                      className="px-1.5 py-0.5 bg-[#122340] hover:bg-[#1A335C] text-slate-200 border border-[#1E3B68] rounded font-mono font-bold"
                      title="Hiện trễ hơn 0.2s"
                    >
                      +0.2s
                    </button>
                  </div>
                </div>

                {/* DÒNG 4: GIỌNG ĐỌC MC */}
                <div className="pt-2 border-t border-[#152745] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-[#38BDF8]" />
                    <span className="text-[11px] font-bold text-slate-200">
                      Lồng tiếng MC AI:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {POPULAR_VOICES.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleQuickChangeVoice(v.id, v.rate, v.pitch)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          voiceoverConfig.selectedVoiceId === v.id && voiceoverConfig.enabled
                            ? "bg-[#1877F2] text-white border-blue-400"
                            : "bg-[#122340] text-slate-300 border-[#1E3B68]"
                        }`}
                      >
                        {v.avatar} {v.shortName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DANH SÁCH LỜI THOẠI (CHỮ SÁNG RÕ 100%, KHÔNG BỊ TỐI MỜ) */}
              <div ref={listContainerRef} className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {subtitleCues.map((cue) => {
                  const isActive =
                    isPlaying && adjustedCurrentTime >= cue.startSec && adjustedCurrentTime <= cue.endSec + 0.2;
                  const isEditing = editingCueId === cue.id;

                  return (
                    <div
                      id={`cue-item-${cue.id}`}
                      key={cue.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-400 shadow-lg ring-2 ring-blue-400/40"
                          : "bg-[#0A1222] hover:bg-[#122340] border-[#1A3158] text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#122340] text-cyan-300 border border-cyan-800/40"
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
                              className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl outline-none bg-white text-slate-900 border-2 border-yellow-400 shadow-md"
                              placeholder="Nhập lời thoại..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCueEdit(cue.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-sm shrink-0"
                              title="Lưu sửa đổi"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCueId(null)}
                              className="p-1.5 rounded-lg bg-slate-500 text-white hover:bg-slate-600 cursor-pointer shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => seekToTimestamp(cue.startSec)}
                            className={`text-xs font-semibold flex-1 cursor-pointer select-none leading-relaxed break-words ${
                              isActive ? "text-white font-bold" : "text-slate-100 hover:text-white"
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
                            ⚡ Đang nói
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(cue.text);
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/30 cursor-pointer"
                          title="Bấm nghe thử câu này"
                        >
                          <Volume2 size={14} />
                        </button>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCueId(cue.id);
                              setEditingCueText(cue.text);
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-300 hover:bg-blue-950/30 cursor-pointer"
                            title="Sửa câu này"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {subtitleCues.length === 0 && !isTranscribing && (
                  <div className="py-12 text-center px-4">
                    <Mic size={36} className="mx-auto text-blue-400/40 mb-2" />
                    <p className="text-xs font-bold text-slate-300">Chưa có phụ đề lời thoại cho video này.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm nút <strong className="text-cyan-300">"🎤 Tạo Sub Video (AI Bóc Băng)"</strong> ở góc trên để AI lắng nghe lời nói thực tế của người trong video!
                    </p>
                  </div>
                )}
              </div>

              {transcribeSuccessMsg && (
                <div className="mt-3.5 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-emerald-200 leading-relaxed">{transcribeSuccessMsg}</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: VIDEO PLAYER VỚI CHỮ SUB SIÊU NÉT (CHỐNG MỜ) */}
          <div className="lg:col-span-7">
            <div className="bg-[#0C1628]/95 backdrop-blur-md rounded-3xl border border-[#1A3158] p-4 md:p-5 shadow-xl flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-[#142646] text-blue-200 flex items-center justify-center shrink-0 border border-[#23457B]">
                    <Play size={13} />
                  </span>
                  <span className="text-xs font-bold text-white truncate" title={videoName}>
                    {videoName || "Studio Video Preview"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEffectsModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#122340] hover:bg-[#1A335C] text-slate-200 border border-[#1E3B68] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette size={13} /> Bộ lọc
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFullVideo}
                    disabled={!videoUrl || isExporting}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Download size={13} />
                    {isExporting ? `Đang xuất ${exportProgress}%` : "Xuất Video"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompareOriginal(!compareOriginal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      compareOriginal
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "bg-[#122340] hover:bg-[#1A335C] text-slate-200 border border-[#1E3B68]"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Đang xem: GỐC" : "Xem bản gốc"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-[#050B14] rounded-2xl overflow-hidden relative border border-[#1A3158] flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto shadow-2xl">
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      loop
                      playsInline
                      style={{
                        filter: canvasFilterCss,
                        transition: "filter 0.3s ease"
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.duration) {
                          setVideoDuration(videoRef.current.duration);
                        }
                        setVideoLoadError(null);
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => {
                        if (videoUrl.startsWith("http") && !videoUrl.includes("/api/stream-video")) {
                          setVideoUrl(`/api/stream-video?url=${encodeURIComponent(videoUrl)}`);
                        } else {
                          setVideoLoadError("Máy chủ nguồn chặn phát trực tiếp CORS. Bạn bấm nút bên dưới để chọn file từ máy.");
                        }
                      }}
                      className="w-full h-full object-contain"
                    />

                    {/* LỖI CORS */}
                    {videoLoadError && (
                      <div className="absolute inset-0 bg-[#070D18]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white">
                        <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl mb-3 border border-amber-500/30">
                          <AlertTriangle size={36} />
                        </span>
                        <h4 className="font-black text-sm text-amber-300 mb-1.5 uppercase">
                          Máy Chủ Nguồn Chặn Phát Trực Tiếp
                        </h4>
                        <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                          Link bên ngoài bị chặn quyền CORS. Bạn vui lòng bấm nút bên dưới để chọn file trực tiếp từ máy tính:
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer"
                        >
                          <Upload size={15} /> 📁 Chọn File Từ Máy Tính
                        </button>
                      </div>
                    )}

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
                          <div className="px-3 py-1 bg-[#1877F2]/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5 uppercase">
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

                    {/* VÙNG CHE MỜ SUB GỐC */}
                    {maskConfig.enabled && !compareOriginal && (
                      <div
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center justify-center transition-all"
                        style={{
                          bottom: `${maskConfig.positionYPercent}%`,
                          height: `${maskConfig.heightPx}px`,
                        }}
                      >
                        <div
                          className="w-[92%] h-full rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md"
                          style={{
                            backgroundColor: maskConfig.bgColor,
                            opacity: maskConfig.opacity,
                            backdropFilter: `blur(${maskConfig.blurAmount}px)`,
                          }}
                        />
                      </div>
                    )}

                    {/* 🌟 PHỤ ĐỀ SẮC NÉT CAO (CHỐNG MỜ HOÀN TOÀN TRÊN MỌI NỀN) */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div
                        className={`absolute left-0 right-0 z-40 pointer-events-none flex justify-center px-4 transition-all ${
                          subtitleConfig.position === "bottom-15"
                            ? "bottom-[15%]"
                            : subtitleConfig.position === "center"
                            ? "bottom-[48%]"
                            : subtitleConfig.position === "top"
                            ? "top-[16%]"
                            : "bottom-[24%]"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl max-w-[92%] text-center transition-all ${
                            subtitleConfig.stylePreset === "yellow-box"
                              ? "bg-yellow-400 shadow-[0_4px_24px_rgba(0,0,0,0.8)] border border-yellow-200"
                              : subtitleConfig.stylePreset === "black-pill"
                              ? "bg-black/90 border border-yellow-400/40 shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
                              : subtitleConfig.showBgBox
                              ? "bg-black/75 backdrop-blur-xs border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
                              : ""
                          }`}
                        >
                          <p
                            className={`font-black leading-snug tracking-wide select-none ${
                              subtitleConfig.stylePreset === "yellow-box"
                                ? "text-black"
                                : subtitleConfig.stylePreset === "white-stroke"
                                ? "text-white"
                                : "text-[#FDE047]"
                            }`}
                            style={{
                              fontSize: `${subtitleConfig.fontSize || 22}px`,
                              textShadow:
                                subtitleConfig.stylePreset === "yellow-box"
                                  ? "none"
                                  : "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)",
                              WebkitTextStroke:
                                subtitleConfig.stylePreset === "yellow-box" ? "none" : "1.5px #000000",
                            }}
                          >
                            {currentSubtitleCue.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <UploadCloud size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-400">Chưa chọn video</p>
                    <p className="text-[11px] text-slate-500 mt-1">Bấm nút "Tải Video Lên" để bắt đầu</p>
                  </div>
                )}
              </div>

              {/* TIMELINE CONTROLS */}
              <div className="mt-4 pt-3 border-t border-[#1A3158] flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1565C0] to-[#1877F2] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-blue-200">
                    <span className="font-bold text-white">
                      {formatSecToTime(currentTime)}
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
                        lastSpokenCueIdRef.current = null;
                        currentSentenceSpokenRef.current = null;
                        if (ttsAudioRef.current) try { ttsAudioRef.current.pause(); } catch {}
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="flex-1 accent-[#1877F2] h-2 bg-[#142646] rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-blue-200">
                      {formatSecToTime(videoDuration)}
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
                    className="p-2 rounded-xl bg-[#122340] hover:bg-[#1A335C] text-blue-200 border border-[#1E3B68] cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SỬA TOÀN BỘ KỊCH BẢN HÀNG LOẠT (QUICK SCRIPT EDITOR) */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0C1628] border border-[#23457B] rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A3158]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
                  <Edit2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">Chỉnh Sửa Toàn Bộ Kịch Bản / Nhập Sub Tay</h3>
                  <p className="text-xs text-slate-300">Mỗi dòng tương ứng với một câu phụ đề. Hệ thống sẽ tự động canh đều thời gian theo video.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#122340]"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={12}
              value={bulkEditText}
              onChange={(e) => setBulkEditText(e.target.value)}
              placeholder="Dán hoặc nhập lời thoại tại đây (mỗi dòng một câu)...&#10;Ví dụ:&#10;Hôm nay mình test thử lực hút của chiếc máy hút mùi Höbscher này nhé!&#10;Bật nấc 3 lên là hút dính chặt tấm bìa carton dày cộp luôn.&#10;Công suất hút cực kỳ khỏe, không lo mùi dầu mỡ trong bếp."
              className="w-full p-4 bg-[#060D18] border border-[#1A3158] rounded-2xl text-white font-medium text-xs leading-relaxed focus:border-[#1877F2] focus:outline-none resize-none"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                {bulkEditText.split("\n").filter((l) => l.trim()).length} câu lời thoại
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkEdit}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg"
                >
                  Áp Dụng Kịch Bản Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HIỆU ỨNG */}
      {showEffectsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0C1628] border border-[#23457B] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A3158]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Palette size={18} className="text-[#1877F2]" /> Bộ Lọc Màu & Hiệu Ứng
              </h3>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
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
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      visualEffects.filterType === item.id
                        ? "bg-[#1877F2] text-white border-blue-400"
                        : "bg-[#122340] text-slate-300 border-[#1E3B68]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Độ sáng: {visualEffects.brightness}%
                </label>
                <input
                  type="range"
                  min={80}
                  max={140}
                  value={visualEffects.brightness}
                  onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                  className="w-full accent-[#1877F2] h-2 bg-[#142646] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Độ bão hòa màu: {visualEffects.saturation}%
                </label>
                <input
                  type="range"
                  min={60}
                  max={180}
                  value={visualEffects.saturation}
                  onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                  className="w-full accent-[#1877F2] h-2 bg-[#142646] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGO & BANNER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0C1628] border border-[#23457B] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A3158]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-amber-400" /> Thiết Lập Logo & Banner
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#08101E] border border-[#1A3158] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-slate-200">Logo</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Logo
                  </label>
                </div>
                <input
                  type="text"
                  value={logoConfig.name}
                  onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Tên Logo (VD: KPOST AI)"
                  className="w-full text-xs font-bold px-3 py-2 bg-[#122340] border border-[#1E3B68] rounded-xl text-white mb-2"
                />
              </div>

              <div className="p-3 bg-[#08101E] border border-[#1A3158] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-slate-200">Banner Khuyến Mãi</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Banner
                  </label>
                </div>
                <input
                  type="text"
                  value={bannerConfig.title}
                  onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Tiêu đề banner..."
                  className="w-full text-xs font-bold px-3 py-2 bg-[#122340] border border-[#1E3B68] rounded-xl text-white mb-2"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOUYIN */}
      {showDouyinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0C1628] border border-[#23457B] rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A3158] shrink-0">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Flame size={20} className="text-amber-400" /> Douyin Hot Trends & Kịch Bản Mẫu
              </h3>
              <button type="button" onClick={() => setShowDouyinModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto pr-1 flex-1">
              {DOUYIN_HOT_TRENDS.map((trend) => (
                <div key={trend.id} className="bg-[#08101E] border border-[#1A3158] rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-500/30">
                      {trend.categoryLabel}
                    </span>
                    <h4 className="text-xs font-black text-white mt-1">{trend.title}</h4>
                    <p className="text-[10px] text-amber-200 mt-1 font-bold">💡 {trend.viralInsight}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImportDouyinVideo(trend)}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    🚀 Nhập Video & Kịch Bản Này
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1A3158] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
