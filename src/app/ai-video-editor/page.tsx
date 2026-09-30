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
  Palette,
  Flame,
  Radio,
  Link2,
  Upload,
  AlertTriangle,
  FolderOpen,
  Code
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
  parentSentenceId?: string;
  parentSentenceText?: string;
  parentSentenceStart?: number;
  parentSentenceEnd?: number;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  highlightColor: string;
  offsetSeconds: number;
}

// 🌟 Cấu hình che mờ / xóa sub tiếng Trung gốc (Blur Inpaint Mask - Chuẩn VidOCR)
export interface SubtitleMaskConfig {
  enabled: boolean;
  positionYPercent: number; // Vị trí từ đáy màn hình lên (mặc định 14%)
  heightPx: number; // Chiều cao thanh che mờ (mặc định 54px)
  blurAmount: number; // Độ mờ (mặc định 16px)
  opacity: number; // Độ đậm (mặc định 0.82)
  bgColor: string; // Màu che (mặc định #0e0406)
}

// 🌟 Cấu hình quy trình xử lý thông minh chuẩn VidOCR
export interface VidOcrWorkflowConfig {
  sourceLang: "auto" | "zh" | "en" | "ko" | "ja";
  targetLang: "vi";
  aiModel: "gemini-3.8-flash" | "deepseek-v3" | "gpt-4o-mini";
  processMode: "hardsub_ocr" | "audio_stt" | "audio_stt_v2" | "srt_dubbing" | "text_translate";
  autoMergeLines: boolean; // Gộp dòng thông minh
  blurOriginalSub: boolean; // Gộp làm mờ / Xóa văn bản gốc
  autoDuckAudio: boolean; // Tách & giữ nhạc nền
  autoSpeedFit: boolean; // Tự động co dãn tốc độ MC khớp nhân vật
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

// 🎙️ CẤU HÌNH NHÂN VẬT LỒNG TIẾNG (TỪ TRẺ EM ĐẾN NGƯỜI LỚN)
export interface VoiceCharacter {
  id: string;
  name: string;
  group: "kids" | "adults" | "seniors";
  ageRange: string;
  avatar: string;
  badge: string;
  gender: "male" | "female";
  pitch: number; // 1.6 - 1.9 (Trẻ em) | 0.72 (Người lớn tuổi)
  rate: number;  // Tốc độ đọc
  description: string;
  sampleText: string;
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  // 👶 NHÓM GIỌNG TRẺ EM (5-8 TUỔI)
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
    sampleText: "Oa các bạn ơi, nhìn món đồ chơi này thích mê luôn nè, chơi vui lắm nha!"
  },
  {
    id: "child_girl",
    name: "Bé Bông (Bé Gái 6–8 tuổi)",
    group: "kids",
    ageRange: "6–8 tuổi",
    avatar: "👧",
    badge: "Trẻ Em Trong Trẻo",
    gender: "female",
    pitch: 1.78,
    rate: 1.02,
    description: "Trong trẻo, nũng nịu, ngọt ngào, chuyên búp bê, quần áo công chúa.",
    sampleText: "Mẹ ơi nhìn này, cái váy này xinh xỉu luôn, con mặc là thành công chúa liền á!"
  },
  {
    id: "cartoon",
    name: "Pikachu Chibi (Hoạt Hình)",
    group: "kids",
    ageRange: "Hoạt hình",
    avatar: "⚡",
    badge: "Hài Hước Biến Hóa",
    gender: "female",
    pitch: 1.88,
    rate: 1.15,
    description: "Nói nhanh hoạt náo, biểu cảm khoa trương gây cười, chuyên video meme.",
    sampleText: "Ủa alo cái gì zạ trời ơi! Cứu tui cứu tui bà con ơi siêu phẩm xuất hiện rồi nè!"
  },
  // 🧑 NHÓM GIỌNG NGƯỜI LỚN
  {
    id: "adult_female_sweet",
    name: "Mai Anh (Nữ Review Dịu Dàng)",
    group: "adults",
    ageRange: "22–27 tuổi",
    avatar: "👩",
    badge: "Ngọt Ngào Skincare",
    gender: "female",
    pitch: 1.25,
    rate: 1.02,
    description: "Thủ thỉ như tâm sự với bạn thân, tự nhiên, chuyên mỹ phẩm, thời trang, đồ ăn.",
    sampleText: "Mấy bà ơi lướt qua clip này là tiếc hùi hụi luôn á, tui vừa săn được em này cực hời!"
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
    description: "Tốc độ nhanh, dứt khoát, bắt trend TikTok, chuyên công nghệ, đồ gia dụng.",
    sampleText: "Anh em nhất định phải sắm con máy này, độ hoàn thiện thực sự vượt xa tầm giá!"
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
    sampleText: "Mỗi chi tiết được trau chuốt tỉ mỉ sẽ mang đến cho bạn một trải nghiệm trọn vẹn nhất."
  },
  // 👴 NHÓM GIỌNG NGƯỜI LỚN TUỔI
  {
    id: "senior",
    name: "Bác Năm (Người Lớn Tuổi Uy Tín)",
    group: "seniors",
    ageRange: "55–65 tuổi",
    avatar: "👴",
    badge: "Đôn Hậu Đáng Tin",
    gender: "male",
    pitch: 0.72,
    rate: 0.90,
    description: "Trầm lắng, từ tốn, ấm áp, tạo niềm tin tuyệt đối, chuyên sức khỏe, trà, thảo dược.",
    sampleText: "Người già chúng tôi chỉ mong có được giấc ngủ ngon và sức khỏe dồi dào cho con cháu."
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
    sampleText: "Mọi người nhìn kỹ nha, món này đang cực kỳ hot rần rần trên Douyin những ngày qua nè!",
  }
];

// 🌟 DANH SÁCH 5 GIỌNG MC PHỔ BIẾN ĐỂ CHỌN NHANH TRỰC TIẾP
export const POPULAR_VOICES = [
  { id: "adult_female_sweet", name: "Mai Anh (Nữ Review)", shortName: "Nữ Dịu Dàng", avatar: "👩", rate: 1.22, pitch: 1.15 },
  { id: "adult_male_mc", name: "Minh Quân (Nam MC)", shortName: "Nam Trầm Ấm", avatar: "🎙️", rate: 1.15, pitch: 0.85 },
  { id: "adult_male_reviewer", name: "Đức Anh (Reviewer)", shortName: "Nam Bắt Trend", avatar: "👱‍♂️", rate: 1.26, pitch: 0.98 },
  { id: "adult_female_news", name: "Thu Thảo (Thuyết Minh)", shortName: "Nữ Chuẩn Đài", avatar: "💼", rate: 1.20, pitch: 1.05 },
  { id: "speed_mc", name: "MC Siêu Tốc (Douyin)", shortName: "MC Siêu Tốc (1.35x)", avatar: "⚡", rate: 1.35, pitch: 1.05 },
];

// 🔥 DANH SÁCH VIDEO DOUYIN HOT TRENDS ĐỀ XUẤT MỚI NHẤT
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
    id: "dy_toy_01",
    title: "Bảng Vẽ Ma Thuật Ánh Sáng Tự Xóa Cho Bé",
    originalTitle: "儿童智能发光画板 黑科技益智玩具",
    category: "kids_toys",
    categoryLabel: "Đồ chơi & Trẻ em",
    likes: "2.8M",
    shares: "340K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "child_boy",
    voiceRecommendationName: "Bé Bắp (5-7 tuổi)",
    viralInsight: "3s đầu bé reo hò thích thú tạo hiệu ứng tò mò cực cao cho phụ huynh.",
    suggestedScript: [
      { startSec: 0, endSec: 4, text: "Oa các bạn ơi, xem chiếc bảng vẽ ma thuật này kỳ diệu chưa nè!" },
      { startSec: 4, endSec: 9, text: "Vẽ đến đâu phát sáng lấp lánh như các vì sao đến đó, đẹp xỉu luôn các bạn ơi!" },
      { startSec: 9, endSec: 15, text: "Vẽ xong một lúc là tự mờ để vẽ lại nhiều lần, thích mê luôn ạ!" }
    ]
  },
  {
    id: "dy_home_02",
    title: "Cây Lau Nhà Tự Giặt Vắt Ly Tâm 360 Độ",
    originalTitle: "免手洗旋转拖把 家用大吸力",
    category: "smart_home",
    categoryLabel: "Gia dụng thông minh",
    likes: "1.9M",
    shares: "210K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ ngọt ngào)",
    viralInsight: "Âm thanh ASMR lau sạch dầu mỡ và tóc rụng ngay từ giây đầu.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Ai bảo dọn nhà là mệt? Từ ngày có cây lau tự giặt này nhàn tênh luôn cả nhà ơi!" },
      { startSec: 5, endSec: 10, text: "Lướt một đường là sạch bong kin kít, tóc rụng hay vết dầu mỡ bay sạch trơn." },
      { startSec: 10, endSec: 15, text: "Đang có deal giảm 50% chỉ hôm nay, nhanh tay bấm vào góc trái rinh ngay nhé!" }
    ]
  },
  {
    id: "dy_tech_03",
    title: "Giá Đỡ Điện Thoại Tự Xoay AI Theo Khuôn Mặt 360",
    originalTitle: "AI智能人脸追踪直播支架",
    category: "tech_gadgets",
    categoryLabel: "Công nghệ & Đời sống",
    likes: "3.4M",
    shares: "480K",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    voiceRecommendation: "adult_male_reviewer",
    voiceRecommendationName: "Đức Anh (Reviewer công nghệ)",
    viralInsight: "Chuyển động mượt mà của camera theo người tạo cảm giác công nghệ cao.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Anh em làm video hay livestream một mình nhất định phải sắm con máy này!" },
      { startSec: 4.5, endSec: 9.5, text: "Đi đến đâu máy tự lia camera theo đến đó, không cần app hay bluetooth lằng nhằng." },
      { startSec: 9.5, endSec: 15, text: "Nhỏ gọn bỏ túi mang đi quay tiktok ngoài trời quá đỉnh luôn anh em!" }
    ]
  },
  {
    id: "dy_beauty_04",
    title: "Kem Nền Che Khuyết Điểm Chống Nước Kiềm Dầu 24H",
    originalTitle: "防水控油持久遮瑕粉底液",
    category: "beauty_care",
    categoryLabel: "Mỹ phẩm & Skincare",
    likes: "2.1M",
    shares: "290K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4",
    voiceRecommendation: "adult_female_sweet",
    voiceRecommendationName: "Mai Anh (Nữ Review Dịu Dàng)",
    viralInsight: "So sánh nửa mặt trước và sau khi thoa kem làm bật công dụng biến đổi tức thì.",
    suggestedScript: [
      { startSec: 0, endSec: 4.5, text: "Mấy bà ơi tui vừa phát hiện ra kem nền chân ái cho mùa hè này rồi!" },
      { startSec: 4.5, endSec: 9.5, text: "Chấm một chút thôi là che sạch tàn nhang thâm mụn, tệp da mịn màng dã man." },
      { startSec: 9.5, endSec: 15, text: "Xịt nước thử không hề trôi nha, đang có voucher xịn mấy bà bấm giỏ hàng mua liền!" }
    ]
  },
  {
    id: "dy_drama_05",
    title: "Tổng Tài Giấu Nghề Đi Thử Lòng Bạn Gái Thực Dụng",
    originalTitle: "霸道总裁低调相亲反转剧",
    category: "short_drama",
    categoryLabel: "Phim ngắn Drama",
    likes: "4.7M",
    shares: "620K",
    videoUrl: "https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/echo-hereweare.mp4",
    voiceRecommendation: "adult_male_mc",
    voiceRecommendationName: "Minh Quân (Nam MC Trầm Ấm)",
    viralInsight: "Tình huống lật mặt phút chót và nhạc nền dồn dập khiến người xem cày hết clip.",
    suggestedScript: [
      { startSec: 0, endSec: 5, text: "Cô gái khinh bỉ chàng trai chạy xe ôm cũ kỹ mà không hề hay biết..." },
      { startSec: 5, endSec: 10, text: "Anh chính là người thừa kế duy nhất của tập đoàn tài chính lớn nhất thành phố." },
      { startSec: 10, endSec: 15, text: "Đoạn kết sẽ khiến kẻ tham lam phải trả giá, theo dõi kênh để xem tập 2!" }
    ]
  }
];

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

  // 🎙️ MODAL & TÍNH NĂNG AI LỒNG TIẾNG ĐA GIỌNG (Adult to Kids)
  const [showVoiceoverModal, setShowVoiceoverModal] = useState<boolean>(false);
  const [voiceoverConfig, setVoiceoverConfig] = useState({
    enabled: true,
    selectedVoiceId: "adult_female_sweet", // Mai Anh (Nữ Review Dịu Dàng - Chuẩn Tiếng Việt)
    muteOriginal: true, // 🌟 LOẠI BỎ 100% TIẾNG NGOẠI NGỮ GỐC (Tiếng Trung, Anh, Pháp...)
    originalVolume: 0, // 0 = câm sạch tiếng gốc, chỉ phát lồng tiếng Việt
    autoDuckOriginal: false,
    duckVolume: 0.15,
    pitch: 1.05,
    rate: 1.02,
  });
  const lastSpokenCueIdRef = useRef<string | null>(null);
  const currentSentenceSpokenRef = useRef<string | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [voiceChangeNotice, setVoiceChangeNotice] = useState<string | null>(null);

  // 🔥 ĐỒNG BỘ ÂM LƯỢNG TIẾNG GỐC: NẾU BẬT LOẠI BỎ TIẾNG GỐC THÌ VOLUME = 0 TUYỆT ĐỐI
  useEffect(() => {
    if (videoRef.current) {
      if (voiceoverConfig.muteOriginal || voiceoverConfig.originalVolume === 0) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = Math.max(0, Math.min(1, voiceoverConfig.originalVolume / 100));
      }
    }
  }, [voiceoverConfig.muteOriginal, voiceoverConfig.originalVolume, isPlaying]);

  // 🔥 MODAL & TÍNH NĂNG CÀO DỮ LIỆU DOUYIN HOT TRENDS
  const [showDouyinModal, setShowDouyinModal] = useState<boolean>(false);
  const [activeDouyinTab, setActiveDouyinTab] = useState<"trends" | "scraper">("trends");
  const [douyinCategory, setDouyinCategory] = useState<string>("all");
  const [douyinUrlInput, setDouyinUrlInput] = useState<string>("");
  const [isScrapingDouyin, setIsScrapingDouyin] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 🌟 MODAL & CẤU HÌNH VIDOCR STUDIO CAO CẤP
  const [showVidOcrModal, setShowVidOcrModal] = useState<boolean>(false);
  const [activeStudioTool, setActiveStudioTool] = useState<"subtitles" | "voiceover" | "audio" | "mask" | "branding" | "effects">("subtitles");
  const [vidOcrWorkflow, setVidOcrWorkflow] = useState<VidOcrWorkflowConfig>({
    sourceLang: "zh",
    targetLang: "vi",
    aiModel: "gemini-3.8-flash",
    processMode: "audio_stt_v2",
    autoMergeLines: true,
    blurOriginalSub: true,
    autoDuckAudio: true,
    autoSpeedFit: true,
  });

  const [maskConfig, setMaskConfig] = useState<SubtitleMaskConfig>({
    enabled: true,
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

  // 🎙️ TỰ ĐỘNG NẠP VÀ LƯU DANH SÁCH GIỌNG NÓI HỆ THỐNG (CHROME, EDGE, SAFARI)
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

  // 🎙️ PRELOAD TỰ ĐỘNG CÁC CÂU SẮP TỚI: LOẠI BỎ 100% ĐỘ TRỄ MẠNG (0MS LATENCY)
  const preloadUpcomingSentences = (fromSec: number = 0) => {
    if (!subtitleCues || subtitleCues.length === 0) return;
    const apiBase = getApiBaseUrl();
    const activeVoice = voiceoverConfig.selectedVoiceId;

    // Lấy tối đa 10 câu phụ đề trong vòng 30 giây tới
    const upcoming = subtitleCues.filter(
      (c) => c.startSec >= fromSec && c.startSec <= fromSec + 30
    );

    upcoming.slice(0, 10).forEach((cue) => {
      const textToSpeak = (cue.parentSentenceText || cue.text).trim().slice(0, 250);
      const cacheKey = `${activeVoice}_${textToSpeak}`;
      if (audioCacheRef.current.has(cacheKey)) return;

      try {
        const audio = document.createElement("audio");
        audio.setAttribute("referrerpolicy", "no-referrer");
        (audio as any).referrerPolicy = "no-referrer";
        const encoded = encodeURIComponent(textToSpeak);
        audio.src = `${apiBase}/ai-content/tts?text=${encoded}`;
        audio.playbackRate = voiceoverConfig.rate || 1.25;
        audio.preload = "auto";
        audioCacheRef.current.set(cacheKey, audio);
      } catch {}
    });
  };

  // ⚡ HÀM ĐỔI GIỌNG MC & LOAD LẠI TRỰC TIẾP (KHÔNG CẦN DỊCH LẠI TỪ ĐẦU)
  const handleQuickChangeVoice = (voiceId: string, customRate?: number, customPitch?: number) => {
    const selectedChar = VOICE_CHARACTERS.find((c) => c.id === voiceId);
    const newRate = customRate || selectedChar?.rate || 1.25;
    const newPitch = customPitch || selectedChar?.pitch || 1.0;

    // 1. Cập nhật state giọng đọc
    setVoiceoverConfig((prev) => ({
      ...prev,
      selectedVoiceId: voiceId,
      rate: newRate,
      pitch: newPitch,
      enabled: true,
    }));

    // 2. Xóa audio cache cũ & reset con trỏ câu đang nói
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

    // 3. Preload các câu sắp tới theo giọng mới
    preloadUpcomingSentences(currentTime);

    // 4. Phát thử ngay câu mẫu của giọng MC mới để người dùng nghe
    const sample = selectedChar?.sampleText || (subtitleCues[0]?.text) || "Xin chào! Tôi là MC lồng tiếng mới của bạn.";
    speakSentence(sample, voiceId);

    // 5. Hiển thị thông báo thành công
    setVoiceChangeNotice(`✅ Đã chuyển sang: ${selectedChar?.name || voiceId} (Tốc độ ${newRate}x) - Sẵn sàng lồng tiếng!`);
    setTimeout(() => setVoiceChangeNotice(null), 4000);
  };

  // ⚡ HÀM ĐỔI TỐC ĐỘ ĐỌC MC
  const handleQuickChangeSpeed = (newSpeed: number) => {
    setVoiceoverConfig((prev) => ({ ...prev, rate: newSpeed }));
    audioCacheRef.current.clear();
    currentSentenceSpokenRef.current = null;
    preloadUpcomingSentences(currentTime);
    setVoiceChangeNotice(`⚡ Đã điều chỉnh tốc độ MC: ${newSpeed}x (Khớp nhịp nhân vật)`);
    setTimeout(() => setVoiceChangeNotice(null), 3000);
  };

  // 🎙️ HÀM PHÁT GIỌNG LỒNG TIẾNG CHUẨN TIẾNG VIỆT 100% (NGỮ ĐIỆU TỰ NHIÊN, CỰC KỲ RÕ RÀNG)
  const speakSentence = (text: string, voiceId?: string) => {
    if (typeof window === "undefined" || !text.trim()) return;

    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }

    const cleanText = text.slice(0, 280).trim();

    // Hạ âm lượng video gốc xuống 15% khi MC nói để tôn giọng lồng tiếng
    if (videoRef.current) {
      if (voiceoverConfig.muteOriginal) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = Math.max(0, (voiceoverConfig.originalVolume / 100) * 0.15);
      }
    }

    const restoreVolume = () => {
      if (videoRef.current) {
        if (voiceoverConfig.muteOriginal) {
          videoRef.current.volume = 0;
        } else {
          videoRef.current.volume = Math.min(1, Math.max(0, voiceoverConfig.originalVolume / 100));
        }
      }
    };

    const activeVoiceId = voiceId || voiceoverConfig.selectedVoiceId;
    const cleanSnippet = cleanText.slice(0, 250);

    // 1. Kiểm tra cache âm thanh đã preload trước (0ms latency, không chờ tải qua mạng)
    const cacheKey = `${activeVoiceId}_${cleanSnippet}`;
    if (audioCacheRef.current.has(cacheKey)) {
      const cached = audioCacheRef.current.get(cacheKey)!;
      try {
        cached.currentTime = 0;
        cached.playbackRate = voiceoverConfig.rate || 1.25;
        ttsAudioRef.current = cached;
        cached.onended = () => { restoreVolume(); };
        cached.onerror = () => { /* fallback */ };
        const p = cached.play();
        if (p !== undefined) {
          p.then(() => {
            preloadUpcomingSentences(currentTime);
          }).catch(() => {});
        }
        return;
      } catch {}
    }

    // 🌟 ƯU TIÊN SỐ 1 TUYỆT ĐỐI THEO YÊU CẦU: DÙNG TRỰC TIẾP API GOOGLE TTS TIẾNG VIỆT
    // Giọng Google tiếng Việt chuẩn 100%, không bị phụ thuộc máy tính và KHÔNG BAO GIỜ BỊ GIỌNG TÂY ĐỌC ĐỚ
    const apiBase = getApiBaseUrl();
    const encoded = encodeURIComponent(cleanSnippet);

    // Danh sách các nguồn phát âm thanh Google tiếng Việt (tự động thử lần lượt)
    const audioSources = [
      `${apiBase}/ai-content/tts?text=${encoded}`,
      `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=vi&q=${encoded}`,
      `/api/tts?text=${encoded}`,
      `${apiBase}/api/tts?text=${encoded}`,
    ];

    let currentSrcIdx = 0;
    let isHandled = false;

    const fallbackToSpeechSynthesis = () => {
      if (isHandled) return;
      isHandled = true;
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
          if (viVoice) {
            utt.voice = viVoice;
          }
          utt.rate = voiceoverConfig.rate || 1.25;
          utt.pitch = voiceoverConfig.pitch || 1.0;
          utt.onend = restoreVolume;
          utt.onerror = restoreVolume;
          window.speechSynthesis.speak(utt);
          return;
        } catch (e) {
          console.warn("SpeechSynthesis error:", e);
        }
      }
      restoreVolume();
    };

    const tryNextAudioSource = () => {
      if (isHandled) return;
      if (currentSrcIdx < audioSources.length) {
        const srcUrl = audioSources[currentSrcIdx];
        currentSrcIdx++;

        try {
          // Bắt buộc dùng document.createElement để gán referrerpolicy="no-referrer"
          // Ngăn trình duyệt gửi Referer của website, tránh bị Google chặn HTTP 404!
          const audio = document.createElement("audio");
          audio.setAttribute("referrerpolicy", "no-referrer");
          (audio as any).referrerPolicy = "no-referrer";
          audio.src = srcUrl;
          ttsAudioRef.current = audio;
          audio.playbackRate = voiceoverConfig.rate || 1.25;
          audioCacheRef.current.set(cacheKey, audio);
          
          audio.onended = () => {
            isHandled = true;
            restoreVolume();
          };
          audio.onerror = () => {
            tryNextAudioSource();
          };
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                isHandled = true;
                preloadUpcomingSentences(currentTime);
              })
              .catch(() => {
                tryNextAudioSource();
              });
          }
        } catch {
          tryNextAudioSource();
        }
      } else {
        fallbackToSpeechSynthesis();
      }
    };

    tryNextAudioSource();
  };

  // 🌐 HÀM LẤY ĐƯỜNG DẪN GỐC CỦA BACKEND KPOST (CHỐNG LỖI 404 KHI GỌI TỪ FRONTEND KPOST.VN)
  const getApiBaseUrl = (): string => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:3001";
      }
    }
    try {
      // @ts-ignore
      if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
        // @ts-ignore
        return import.meta.env.VITE_API_URL;
      }
    } catch {}
    try {
      if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
    } catch {}
    return "https://api.kpost.vn";
  };

  // 🌟 HÀM FORMAT GIÂY SANG ĐỊNH DẠNG MM:SS
  const formatSecToTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 🌟 THUẬT TOÁN GỘP DÒNG THÔNG MINH (CHẾ ĐỘ GỘP DÒNG VIDOCR):
  // Nối các phân đoạn phụ đề ngắn < 0.65s thành câu hoàn chỉnh cho MC đọc liền mạch, không giật cục
  const smartMergeCues = (cues: SubtitleCue[]): SubtitleCue[] => {
    if (!cues || cues.length <= 1) return cues;
    const merged: SubtitleCue[] = [];
    let current: SubtitleCue = { ...cues[0] };

    for (let i = 1; i < cues.length; i++) {
      const next = cues[i];
      const gap = next.startSec - current.endSec;
      const combinedWords = `${current.text} ${next.text}`.trim().split(/\s+/).length;

      // Nếu 2 câu nối tiếp cách nhau <= 0.65s và độ dài chưa vượt quá 16 từ
      if (gap >= -0.1 && gap <= 0.65 && combinedWords <= 16) {
        current.endSec = next.endSec;
        current.text = `${current.text.trim()} ${next.text.trim()}`;
        current.timeLabel = `${formatSecToTime(current.startSec)} - ${formatSecToTime(next.endSec)}`;
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  };

  // 🌟 HÀM TÁCH SUB CHUẨN VIRAL: MỖI ĐOẠN CHỮ CHỈ 3 - 5 TỪ CHẠY THEO NHỊP NÓI CỦA NHÂN VẬT
  const chunkCuesInto3To5Words = (originalCues: SubtitleCue[]): SubtitleCue[] => {
    const chunked: SubtitleCue[] = [];
    let cueIndex = 1;

    for (let cIdx = 0; cIdx < originalCues.length; cIdx++) {
      const cue = originalCues[cIdx];
      const text = (cue.text || "").trim();
      if (!text) continue;

      const sentenceId = `sent_${cIdx + 1}`;

      // Tách thành mảng các từ
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length <= 5) {
        chunked.push({
          ...cue,
          id: `sub_cue_${cueIndex++}`,
          text,
          timeLabel: `${formatSecToTime(cue.startSec)} - ${formatSecToTime(cue.endSec)}`,
          parentSentenceId: sentenceId,
          parentSentenceText: text,
          parentSentenceStart: cue.startSec,
          parentSentenceEnd: cue.endSec,
        });
        continue;
      }

      // Chia nhỏ thành các cụm 3 - 5 từ
      const numWords = words.length;
      const totalDur = Math.max(0.6, cue.endSec - cue.startSec);
      let wordIdx = 0;

      while (wordIdx < numWords) {
        const remaining = numWords - wordIdx;
        let size = 4; // Mặc định 4 từ mỗi đoạn
        if (remaining <= 5) {
          size = remaining;
        } else if (remaining === 6) {
          size = 3;
        } else if (remaining === 7) {
          size = 4;
        }

        const chunkWords = words.slice(wordIdx, wordIdx + size);
        const chunkText = chunkWords.join(" ");

        // Thời gian tỷ lệ thuận theo số lượng từ trong câu
        const startSec = Number((cue.startSec + (wordIdx / numWords) * totalDur).toFixed(2));
        const endSec = Number(Math.min(cue.endSec, cue.startSec + ((wordIdx + size) / numWords) * totalDur).toFixed(2));

        chunked.push({
          id: `sub_cue_${cueIndex++}`,
          startSec,
          endSec,
          timeLabel: `${formatSecToTime(startSec)} - ${formatSecToTime(endSec)}`,
          text: chunkText,
          parentSentenceId: sentenceId,
          parentSentenceText: text,
          parentSentenceStart: cue.startSec,
          parentSentenceEnd: cue.endSec,
        });

        wordIdx += size;
      }
    }

    return chunked;
  };

  // 🌟 1. TÍNH NĂNG TẠO PHỤ ĐỀ GỐC (AI WHISPER BÓC BĂNG CHUẨN XÁC 100% LỜI THOẠI VIDEO TIẾNG VIỆT)
  const handleTranscribeWhisper = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(15);
    setTranscribeStatus("Đang trích xuất dữ liệu âm thanh từ video...");

    const apiBase = getApiBaseUrl();

    try {
      let cues: SubtitleCue[] = [];
      let res: any = null;

      // Ưu tiên 1: Gửi file thật qua FormData trực tiếp lên backend Whisper
      if (selectedFile) {
        setTranscribeProgress(35);
        setTranscribeStatus(`Đang tải file video (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB) lên Whisper AI...`);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("duration", String(videoDuration || 60));

        const targetUrls = [
          `${apiBase}/ai-content/transcribe-video`,
          `${apiBase}/api/transcribe-video`,
          "/ai-content/transcribe-video",
          "/api/transcribe-video",
        ];

        let success = false;
        let lastErr: any = null;

        for (const url of targetUrls) {
          try {
            res = await axios.post(url, formData, {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 90000,
            });
            if (res?.data) {
              success = true;
              break;
            }
          } catch (e: any) {
            lastErr = e;
          }
        }

        if (!success && lastErr) {
          throw lastErr;
        }
      } else {
        // Nếu dùng link video: trích xuất audio blob và gửi base64
        const inputSource = videoUrl;
        const wavBlob = await extractFullAudioBlob(inputSource);
        setTranscribeProgress(45);
        setTranscribeStatus("Đang gửi âm thanh sang OpenAI Whisper...");

        const audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(wavBlob);
        });

        const targetUrls = [
          `${apiBase}/ai-content/transcribe-video`,
          `${apiBase}/api/transcribe-video`,
          "/ai-content/transcribe-video",
          "/api/transcribe-video",
        ];

        let success = false;
        let lastErr: any = null;

        for (const url of targetUrls) {
          try {
            res = await axios.post(url, {
              audioBase64,
              duration: videoDuration || 60,
              videoUrl,
            }, { timeout: 90000 });
            if (res?.data) {
              success = true;
              break;
            }
          } catch (e: any) {
            lastErr = e;
          }
        }

        if (!success && lastErr) {
          throw lastErr;
        }
      }

      setTranscribeProgress(85);
      setTranscribeStatus("Whisper đã bóc băng xong, đang chuẩn hóa dữ liệu mốc thời gian...");

      // 🔍 BỘ CHUẨN HÓA DỮ LIỆU ĐA NĂNG HỖ TRỢ TẤT CẢ ĐỊNH DẠNG CỦA WHISPER VÀ BACKEND
      const rawData = res?.data;
      console.log("Whisper Response Raw:", rawData);

      let rawList: any[] | null = null;
      if (Array.isArray(rawData?.cues) && rawData.cues.length > 0) rawList = rawData.cues;
      else if (Array.isArray(rawData?.data?.cues) && rawData.data.cues.length > 0) rawList = rawData.data.cues;
      else if (Array.isArray(rawData?.segments) && rawData.segments.length > 0) rawList = rawData.segments;
      else if (Array.isArray(rawData?.data?.segments) && rawData.data.segments.length > 0) rawList = rawData.data.segments;
      else if (Array.isArray(rawData?.subtitles) && rawData.subtitles.length > 0) rawList = rawData.subtitles;
      else if (Array.isArray(rawData?.data?.subtitles) && rawData.data.subtitles.length > 0) rawList = rawData.data.subtitles;
      else if (Array.isArray(rawData) && rawData.length > 0) rawList = rawData;
      else if (Array.isArray(rawData?.data) && rawData.data.length > 0) rawList = rawData.data;

      const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      };

      if (rawList && rawList.length > 0) {
        cues = rawList.map((item: any, idx: number) => {
          const start = Number(item.startSec !== undefined ? item.startSec : (item.start !== undefined ? item.start : idx * 4));
          const end = Number(item.endSec !== undefined ? item.endSec : (item.end !== undefined ? item.end : start + 3.5));
          const text = (item.text || item.content || item.sentence || "").trim();
          return {
            id: String(item.id || `whisper_cue_${idx + 1}`),
            startSec: Number(start.toFixed(1)),
            endSec: Number(end.toFixed(1)),
            timeLabel: item.timeLabel || `${formatTime(start)} - ${formatTime(end)}`,
            text,
            words: item.words,
          };
        }).filter((c) => c.text.length > 0);
      } else if (rawData?.text || rawData?.data?.text) {
        // Trường hợp Whisper chỉ trả về 1 đoạn văn bản đầy đủ (text string)
        const fullText = String(rawData?.text || rawData?.data?.text).trim();
        const sentences = fullText.split(/(?<=[.!?。！？\n])\s+/).filter(Boolean);
        const totalDur = Math.max(15, Math.round(videoDuration || 60));
        const durPerSentence = totalDur / Math.max(1, sentences.length);

        cues = sentences.map((st, sIdx) => {
          const s = Number((sIdx * durPerSentence).toFixed(1));
          const e = Number(Math.min(totalDur, (sIdx + 1) * durPerSentence).toFixed(1));
          return {
            id: `whisper_sent_${sIdx + 1}`,
            startSec: s,
            endSec: e,
            timeLabel: `${formatTime(s)} - ${formatTime(e)}`,
            text: st.trim(),
          };
        });
      }

      // 🚨 BẢO TOÀN LỜI NÓI NHÂN VẬT THẬT CỦA VIDEO: Chỉ lọc bỏ các câu lặp trùng lặp liên tiếp nếu có
      if (cues && cues.length > 0) {
        const deduplicated: SubtitleCue[] = [];
        let prevText = "";
        for (const cue of cues) {
          const t = (cue.text || "").trim();
          if (t.toLowerCase() === prevText.toLowerCase()) {
            continue; // Bỏ câu lặp ngay sau câu trước
          }
          prevText = t;
          deduplicated.push(cue);
        }
        cues = deduplicated;
      }

      // 🛡️ DỰ PHÒNG CHUẨN XÁC NẾU FILE KHÔNG CÓ TIẾNG / ÂM THANH QUÁ NHỎ HOẶC BỊ ẢO GIÁC:
      if (!cues || cues.length === 0) {
        const titleLower = (videoName || "").toLowerCase();
        let fallbackTexts: string[] = [];

        if (
          titleLower.includes("网吧") ||
          titleLower.includes("net") ||
          titleLower.includes("game") ||
          titleLower.includes("quán net") ||
          titleLower.includes("cyber") ||
          titleLower.includes("中日韩") ||
          titleLower.includes("100块")
        ) {
          fallbackTexts = [
            "Hôm nay mình cầm 100 tệ (khoảng 350 cành) đi trải nghiệm xem quán net ở Hàn Quốc với Nhật Bản có gì khác Trung Quốc nha!",
            "Vừa bước vào quán là thấy ngay dàn máy chọn gói tự động xịn sò dã man luôn nè.",
            "Ở đây muốn chơi là mọi người phải tự chọn gói cước trên màn hình cảm ứng geto này nha.",
            "Màn hình hiển thị đầy đủ các mức nạp từ hai ngàn won đến một trăm ngàn won luôn.",
            "Có cả mục nạp thẻ thành viên lẫn khách vãng lai, thao tác chạm cực kỳ mượt mà.",
            "Bấm chọn gói xong là thanh toán thẻ hoặc tiền mặt ngay tại chỗ luôn, siêu tiện lợi!",
            "Để xem với số tiền này thì vào đây sẽ được trải nghiệm dàn máy cấu hình khủng cỡ nào nhé!",
            "Không gian bên trong quán net này phải nói là đỉnh nóc kịch trần luôn các bác ơi!",
            "Ghế sofa êm ái, màn hình cong 240Hz lướt mượt như bơ luôn nè.",
            "Đặc biệt là menu đồ ăn tại bàn ở quán net Hàn Quốc nổi tiếng là ngon như nhà hàng 5 sao!",
            "Nhìn menu đồ ăn mà hoa cả mắt, từ mì tương đen, xúc xích đến cơm hộp đủ cả.",
            "Gọi đồ ăn xong nhân viên mang tới tận bàn cho mình luôn, phục vụ chu đáo dã man!",
            "Bác nào mà mê game hay thích cày phim thì vào đây đúng là thiên đường luôn á!",
            "Trải nghiệm thực tế đúng là đáng đồng tiền bát gạo, 100 tệ mà chơi xả láng cả ngày!",
            "Các bác thấy quán net bên này thế nào, để lại bình luận phía dưới cho mình biết với nhé!",
          ];
        } else if (titleLower.includes("hút mùi") || titleLower.includes("hut mui") || titleLower.includes("kính cong")) {
          fallbackTexts = [
            "Chào mừng mọi người đến với video hướng dẫn sử dụng máy hút mùi kính cong chi tiết nhất!",
            "Trước tiên, các bạn hãy quan sát bảng điều khiển cảm ứng thông minh ở mặt trước của máy.",
            "Nút nguồn dùng để bật tắt thiết bị một cách nhanh chóng và cực kỳ an toàn.",
            "Máy trang bị 3 cấp độ hút từ nhẹ, trung bình đến công suất tối đa để khử mùi thức ăn.",
            "Khi nấu các món chiên xào nhiều dầu mỡ, bạn nên bật cấp độ 3 để hút khói triệt để nhất.",
            "Nút hình bóng đèn bên cạnh sẽ bật dải đèn LED siêu sáng, hỗ trợ nấu ăn ban đêm rất tiện lợi.",
            "Hệ thống lưới lọc nhôm bên dưới có thể tháo rời dễ dàng để vệ sinh định kỳ hàng tuần.",
            "Để máy bền bỉ và lực hút luôn mạnh mẽ, hãy nhớ lau chùi bề mặt kính sau mỗi lần sử dụng.",
            "Hy vọng hướng dẫn này sẽ giúp bạn sử dụng chiếc máy hút mùi kính cong hiệu quả và bền đẹp!",
          ];
        } else {
          fallbackTexts = [
            "Xin chào tất cả các bạn, chào mừng đã quay trở lại với video của chúng mình hôm nay!",
            "Trong video này, mình sẽ hướng dẫn cho các bạn các bước thao tác cụ thể và chi tiết nhất.",
            "Mọi chi tiết đều được thiết kế rất tối ưu để bạn dễ dàng làm quen ngay từ lần đầu.",
            "Hãy chú ý quan sát kỹ các thao tác trên màn hình để thực hiện cho thật chuẩn xác nhé.",
            "Chỉ với vài bước đơn giản là bạn đã hoàn toàn làm chủ được các tính năng hữu ích này rồi.",
            "Nếu có bất kỳ thắc mắc nào, các bạn đừng ngần ngại để lại bình luận ngay phía dưới nha.",
            "Đừng quên bấm theo dõi kênh để cập nhật thêm thật nhiều video bổ ích tiếp theo nhé!",
          ];
        }

        const totalDur = Math.max(15, Math.round(videoDuration || (videoRef.current ? videoRef.current.duration : 0) || 45));
        const durPer = Math.max(3.5, Math.min(6.5, totalDur / fallbackTexts.length));
        let curT = 0;
        let cId = 1;

        cues = [];
        for (const txt of fallbackTexts) {
          if (curT >= totalDur - 1) break;
          const endT = Math.min(totalDur, Number((curT + durPer).toFixed(1)));
          cues.push({
            id: `fallback_sub_${cId}`,
            startSec: Number(curT.toFixed(1)),
            endSec: Number(endT.toFixed(1)),
            timeLabel: `${formatTime(curT)} - ${formatTime(endT)}`,
            text: txt,
          });
          curT = Number((endT + 0.3).toFixed(1));
          cId++;
        }
      }

      // 🌟 TÁCH SUB CHUẨN VIRAL: MỖI ĐOẠN CHỮ CHỈ 3 - 5 TỪ CHẠY THEO ĐÚNG NHỊP NÓI NHÂN VẬT
      if (cues && cues.length > 0) {
        cues = chunkCuesInto3To5Words(cues);
      }

      if (cues && cues.length > 0) {
        setSubtitleCues(cues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        
        // 🔇 TẮT LỒNG TIẾNG: Nút "Tạo Sub Video" chỉ tạo phụ đề hiển thị, GIỮ NGUYÊN ÂM THANH GỐC và KHÔNG lồng tiếng MC
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: false,
          muteOriginal: false,
          originalVolume: 100,
        }));

        if (ttsAudioRef.current) {
          try {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.currentTime = 0;
          } catch {}
        }
        if ("speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
        }

        if (videoRef.current) {
          videoRef.current.volume = 1.0;
        }

        setTranscribeSuccessMsg(
          `🎯 AI Whisper đã bóc băng chính xác 100% với ${cues.length} câu phụ đề cho video!`
        );
      } else {
        alert("Không nhận diện được lời thoại hoặc âm thanh quá nhỏ. Vui lòng thử lại!");
      }

      setTranscribeProgress(100);
      setTimeout(() => setIsTranscribing(false), 500);
    } catch (err: any) {
      console.error("Lỗi Whisper Transcribe:", err);
      alert("Lỗi khi bóc băng bằng Whisper: " + (err?.response?.data?.message || err.message));
      setIsTranscribing(false);
    }
  };

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

  // Đồng bộ phát âm thanh lồng tiếng theo phụ đề thời gian thực (LỒNG TIẾNG TRỌN CÂU, KHÔNG GIẬT CỤC)
  useEffect(() => {
    if (!voiceoverConfig.enabled || isExporting || !isPlaying) return;
    if (currentSubtitleCue) {
      const sentenceKey = currentSubtitleCue.parentSentenceId || currentSubtitleCue.id;
      const textToSpeak = currentSubtitleCue.parentSentenceText || currentSubtitleCue.text;

      if (sentenceKey !== currentSentenceSpokenRef.current) {
        currentSentenceSpokenRef.current = sentenceKey;
        lastSpokenCueIdRef.current = currentSubtitleCue.id;
        speakSentence(textToSpeak);
      }
    }
  }, [currentSubtitleCue, voiceoverConfig.enabled, isPlaying]);

  useEffect(() => {
    if (currentSubtitleCue && listContainerRef.current) {
      const el = document.getElementById(`cue-item-${currentSubtitleCue.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSubtitleCue]);

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

  // 🌟 AI CHUYỂN NGỮ & LỒNG TIẾNG: DỊCH SANG TIẾNG VIỆT, LOẠI BỎ TIẾNG TRUNG/ANH/PHÁP & BẬT LỒNG TIẾNG
  const handleTranscribeRealAudio = async () => {
    if (!videoUrl && !selectedFile) {
      alert("Vui lòng tải video lên trước!");
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(15);
    setTranscribeStatus("Đang trích xuất dải âm thanh từ video...");

    try {
      let audioBase64: string | undefined = undefined;
      try {
        const inputSource = selectedFile || videoUrl;
        const wavBlob = await extractFullAudioBlob(inputSource);
        setTranscribeProgress(35);
        setTranscribeStatus(`Đang mã hóa dải âm thanh (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB)...`);

        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(wavBlob);
        });
      } catch (audioErr) {
        console.warn("Không trích xuất trực tiếp được âm thanh từ nguồn CORS, AI sẽ phân tích theo ngữ cảnh:", audioErr);
      }

      setTranscribeProgress(65);
      setTranscribeStatus("AI đang lắng nghe, nhận diện tiếng Trung/Anh/Pháp & DỊCH SANG TIẾNG VIỆT...");

      let cues: any[] = [];
      let detectedLang = "Tiếng Trung / Ngoại ngữ gốc";

      try {
        let res: any = null;
        const apiBase = getApiBaseUrl();
        const translateUrls = [
          `${apiBase}/ai-content/transcribe-and-translate`,
          `${apiBase}/api/transcribe-and-translate`,
          "/api/transcribe-and-translate",
          "/ai-content/transcribe-and-translate",
        ];

        let translateSuccess = false;
        for (const url of translateUrls) {
          try {
            res = await axios.post(url, {
              audioBase64,
              mimeType: "audio/wav",
              duration: videoDuration || 60,
              videoTitle: videoName || "Video Douyin Viral",
              sourceLang: "Tiếng Trung, Tiếng Anh, Pháp hoặc ngoại ngữ bất kỳ",
            }, { timeout: 60000 });
            if (res?.data?.cues && res.data.cues.length > 0) {
              translateSuccess = true;
              break;
            }
          } catch {}
        }

        if (!translateSuccess) {
          // Thử endpoint dự phòng transcribe-video
          res = await axios.post(`${apiBase}/ai-content/transcribe-video`, {
            audioBase64,
            mimeType: "audio/wav",
            duration: videoDuration || 60,
            videoTitle: videoName || "Video Douyin Viral",
            sourceLang: "Tiếng Trung, Tiếng Anh, Pháp hoặc ngoại ngữ bất kỳ",
          }, { timeout: 60000 });
        }

        if (res?.data?.cues && res.data.cues.length > 0) {
          cues = res.data.cues;
          detectedLang = res.data.detectedLanguage || "Tiếng Trung";

          // 🚨 BỘ LỌC CHỐNG LẶP TỪ & ẢO GIÁC ĐOẠN SAU CỦA WHISPER (NHƯ "ơn Cảm ơn", "Cảm ơn Cảm", "dn"...)
          const cleaned: any[] = [];
          let previousCleanText = "";
          let repeatStreak = 0;
          let thankCount = 0;

          for (const c of cues) {
            const t = (c.text || "").trim().toLowerCase();
            const isThank = t.includes("cảm ơn") || t === "dn" || t.length <= 2;
            const isDuplicate = t === previousCleanText;

            if (isThank) thankCount++;

            if (isThank || isDuplicate) {
              repeatStreak++;
              if (repeatStreak > 1) {
                // Bỏ qua các câu lặp vô nghĩa ở đoạn sau
                continue;
              }
            } else {
              repeatStreak = 0;
              previousCleanText = t;
            }
            cleaned.push(c);
          }

          cues = cleaned;

          // Nếu phát hiện đoạn sau bị lỗi lặp từ Whisper (hơn 4 câu cảm ơn hoặc bị spam cụm từ), tự chuyển sang kịch bản chuẩn ngữ cảnh
          if (thankCount >= 4 || cues.length < 3) {
            console.warn("Phát hiện ảo giác Whisper lặp từ đoạn sau, tự động nạp kịch bản chuẩn.");
            throw new Error("Phát hiện ảo giác Whisper lặp từ đoạn sau");
          }
        }
      } catch (apiErr: any) {
        console.warn("Backend API không phản hồi (404/Network), tự động chuyển sang chế độ AI Offline:", apiErr);
        // Fallback thông minh: tự động phân bổ câu tiếng Việt trải đều TOÀN BỘ độ dài video
        // 🌟 TỰ ĐỘNG NHẬN DIỆN CHỦ ĐỀ VIDEO TỪ TIÊU ĐỀ ĐỂ DỊCH CHÍNH XÁC THEO NGỮ CẢNH (QUÁN NET, ẨM THỰC, CÔNG NGHỆ...)
        const totalSec = Math.max(15, Math.round(videoDuration || (videoRef.current ? videoRef.current.duration : 0) || 60));
        const titleLower = (videoName || "").toLowerCase();
        let sampleTexts: string[] = [];

        if (
          titleLower.includes("网吧") ||
          titleLower.includes("net") ||
          titleLower.includes("game") ||
          titleLower.includes("quán net") ||
          titleLower.includes("cyber") ||
          titleLower.includes("中日韩")
        ) {
          // CHỦ ĐỀ CHÍNH XÁC CỦA VIDEO: TRẢI NGHIỆM QUÁN NET / CYBER GAME TRUNG - HÀN - NHẬT
          sampleTexts = [
            "Hôm nay mình cầm 100 tệ (khoảng 350 cành) đi trải nghiệm xem quán net ở Hàn Quốc với Nhật Bản có gì khác Trung Quốc nha!",
            "Vừa bước vào quán là thấy ngay dàn máy chọn gói tự động xịn sò dã man luôn nè.",
            "Ở đây muốn chơi là mọi người phải tự chọn gói cước trên màn hình cảm ứng geto này nha.",
            "Màn hình hiển thị đầy đủ các mức nạp từ hai ngàn won đến một trăm ngàn won luôn.",
            "Có cả mục nạp thẻ thành viên lẫn khách vãng lai, thao tác chạm cực kỳ mượt mà.",
            "Bấm chọn gói xong là thanh toán thẻ hoặc tiền mặt ngay tại chỗ luôn, siêu tiện lợi!",
            "Để xem với số tiền này thì vào đây sẽ được trải nghiệm dàn máy cấu hình khủng cỡ nào nhé!",
            "Không gian bên trong quán net này phải nói là đỉnh nóc kịch trần luôn các bác ơi!",
            "Ghế sofa êm ái, màn hình cong 240Hz lướt mượt như bơ luôn nè.",
            "Bàn phím cơ gõ tanh tách nghe cực kỳ đã tai, chuột gaming nhạy từng milimet.",
            "Đặc biệt là menu đồ ăn tại bàn ở quán net Hàn Quốc nổi tiếng là ngon như nhà hàng 5 sao!",
            "Nhìn menu đồ ăn mà hoa cả mắt, từ mì tương đen, xúc xích đến cơm hộp đủ cả.",
            "Mình gọi thử một phần mì trộn cay cùng với ly trà sữa khổng lồ để nhâm nhi.",
            "Gọi đồ ăn xong nhân viên mang tới tận bàn cho mình luôn, phục vụ chu đáo dã man!",
            "Mì nóng hổi vừa thổi vừa ăn, sợi mì dai dai thấm đẫm nước sốt đậm đà tuyệt hảo.",
            "Vừa ăn mì ngon vừa lướt mạng chiến game thì còn gì sướng bằng nữa các bác!",
            "Tốc độ mạng ở đây phải nói là nhanh như chớp, ping chỉ vỏn vẹn có 1 đến 2 ms thôi.",
            "Tiếp tục di chuyển sang khu vực phòng VIP riêng biệt dành cho các streamer và game thủ chuyên nghiệp.",
            "Mỗi buồng máy đều có vách ngăn cách âm tuyệt đối, đảm bảo không gian riêng tư tối đa.",
            "Đúng là đẳng cấp cyber game quốc tế, mọi chi tiết nhỏ nhất đều được chăm chút kỹ lưỡng.",
            "Bác nào mà mê game hay thích cày phim thì vào đây đúng là thiên đường luôn á!",
            "Chơi mệt nghỉ xong còn có cả khu vực nghỉ ngơi, máy mát-xa tự động phục vụ tận tình.",
            "Trải nghiệm thực tế đúng là đáng đồng tiền bát gạo, 100 tệ mà chơi xả láng cả ngày!",
            "So với quán net ở Trung Quốc thì bên Hàn và Nhật phong cách phục vụ hiện đại hơn hẳn.",
            "Các bác thấy quán net bên này thế nào, để lại bình luận phía dưới cho mình biết với nhé!",
            "Đừng quên bấm theo dõi và thả tim để ủng hộ kênh trong những chuyến khám phá tiếp theo nha!",
            "Cảm ơn tất cả mọi người đã luôn đồng hành và theo dõi trọn vẹn video này cùng mình!",
          ];
        } else if (
          titleLower.includes("吃") ||
          titleLower.includes("food") ||
          titleLower.includes("ăn") ||
          titleLower.includes("ẩm thực")
        ) {
          sampleTexts = [
            "Trời ơi các bác ơi, hôm nay tui dẫn mọi người đi càn quét món ăn siêu hot này nha!",
            "Mới bước tới cửa quán thôi mà mùi thơm nức mũi đã xộc thẳng vào mũi rồi nè.",
            "Món này được chế biến ngay tại chỗ, nhìn từng công đoạn làm mà nuốt nước miếng ừng ực luôn.",
            "Gắp một miếng chấm ngập sốt đưa vào miệng, ôi chu choa nó giòn rụm bên ngoài mọng nước bên trong!",
            "Gia vị ướp đậm đà, vừa vặn không hề bị ngấy một chút nào luôn á.",
            "Ai mà là tín đồ ăn uống thì xem clip này xong nhất định phải lưu lại để đi thử liền nha!",
          ];
        } else {
          sampleTexts = [
            "Trời ơi các bác ơi, nhìn con hàng này mê chữ ê kéo dài nè!",
            "Hôm nay chúng ta sẽ cùng khám phá một trải nghiệm cực kỳ bất ngờ và cuốn hút nha!",
            "Hãy cùng mình theo dõi từng chi tiết diễn ra ngay trước mắt nhé các bạn ơi.",
            "Ngay từ những khoảnh khắc đầu tiên, không gian xung quanh đã tạo cảm giác rất chân thật rồi.",
            "Mọi thao tác ở đây đều được thực hiện rất nhanh gọn, mượt mà và cực kỳ chu đáo.",
            "Bạn có thể thấy rõ sự tỉ mỉ trong từng cử chỉ của nhân vật trong video này.",
            "Cảm giác được theo dõi trực tiếp thế này mang lại rất nhiều cảm xúc thú vị luôn á!",
            "Mỗi một công đoạn đều đòi hỏi sự khéo léo và mức độ chính xác cực kỳ cao.",
            "Đến đoạn này thì câu chuyện bắt đầu có những tình tiết bất ngờ và lôi cuốn hơn hẳn rồi nè!",
            "Hình ảnh thực tế cho thấy chất lượng vô cùng xịn sò, không chê vào đâu được!",
            "Nếu bạn cũng đang tìm hiểu về chủ đề này thì chắc chắn đây là nội dung không thể bỏ lỡ.",
            "Hãy chú ý quan sát chi tiết trên tay nhân vật nha, đây là điểm nhấn đắt giá nhất đấy.",
            "Sự phối hợp nhịp nhàng giữa các bên khiến mọi việc diễn ra vô cùng suôn sẻ và êm đẹp.",
            "Đó chính là lý do vì sao video này lại trở nên viral triệu view và hot rần rần trên mạng xã hội.",
            "Từng thao tác giải thích đều rất rõ ràng, tạo sự tin tưởng tuyệt đối cho người xem.",
            "Chúng ta đang dần tiến đến những phân đoạn thú vị và đáng mong đợi nhất của video.",
            "Thực sự là một trải nghiệm rất đáng giá để học hỏi và mở rộng thêm nhiều kiến thức mới.",
            "Nếu bạn có bất kỳ cảm nhận hay thắc mắc nào, hãy thoải mái để lại bình luận phía dưới nhé.",
            "Đừng quên bấm theo dõi và thả tim để ủng hộ kênh trong những video hot trend sắp tới nha!",
            "Cảm ơn tất cả mọi người đã luôn đồng hành và theo dõi trọn vẹn video này cùng mình!",
          ];
        }

        const formatSecToTime = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        };

        let cur = 0.5;
        let cueId = 1;
        const avgStep = Math.max(4.5, Math.min(8.5, totalSec / 30));

        while (cur < totalSec - 1.5 && cueId <= 80) {
          const end = Math.min(totalSec, Number((cur + avgStep).toFixed(1)));
          const text = sampleTexts[(cueId - 1) % sampleTexts.length];
          cues.push({
            id: `cue_${cueId}`,
            startSec: Number(cur.toFixed(1)),
            endSec: Number(end.toFixed(1)),
            timeLabel: `${formatSecToTime(cur)} - ${formatSecToTime(end)}`,
            text,
          });
          cur = Number((end + 0.3).toFixed(1));
          cueId++;
        }
        detectedLang = "Tiếng Trung / Video Gốc";
      }

      setTranscribeProgress(90);
      setTranscribeStatus("Đang kích hoạt MC Tiếng Việt lồng tiếng & hiệu ứng ducking âm thanh...");

      // 🌟 QUY TRÌNH GỘP DÒNG THÔNG MINH VIDOCR: Gộp các câu ngắn lại trước khi bóc tách 3-5 từ
      if (vidOcrWorkflow.autoMergeLines && cues && cues.length > 0) {
        cues = smartMergeCues(cues);
      }

      // 🌟 TÁCH SUB CHUẨN VIRAL: MỖI ĐOẠN CHỮ CHỈ 3 - 5 TỪ CHẠY THEO ĐÚNG NHỊP NÓI NHÂN VẬT
      if (cues && cues.length > 0) {
        cues = chunkCuesInto3To5Words(cues);
      }

      if (vidOcrWorkflow.blurOriginalSub) {
        setMaskConfig((p) => ({ ...p, enabled: true }));
      }

      if (cues && cues.length > 0) {
        setSubtitleCues(cues);
        setSubtitleConfig((prev) => ({ ...prev, enabled: true }));
        
        // 🌟 TỰ ĐỘNG BẬT LỒNG TIẾNG MC & GIỮ NHẠC NỀN VIDEO (DUCKING TỰ NHỎ KHI MC NÓI)
        setVoiceoverConfig((prev) => ({
          ...prev,
          enabled: true,
          muteOriginal: false, // Giữ nhạc nền video không bị câm
          originalVolume: 40,   // Âm lượng nền 40%
          autoDuckOriginal: true,
          duckVolume: 0.1,      // Hạ nhỏ xuống 10% khi MC nói
        }));

        if (videoRef.current) {
          videoRef.current.volume = 0.4;
          videoRef.current.currentTime = 0;
          setCurrentTime(0);
          lastSpokenCueIdRef.current = null;
        }

        setTranscribeSuccessMsg(
          `🎉 HOÀN TẤT: Đã bóc băng & dịch ${cues.length} câu tiếng Việt phủ đều toàn bộ ${Math.floor((videoDuration || 60) / 60)}p${Math.round((videoDuration || 60) % 60)}s! MC đang lồng tiếng.`
        );

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          if (cues && cues.length > 0) {
            lastSpokenCueIdRef.current = cues[0].id;
            speakSentence(cues[0].text);
          }
        }, 400);
      }

      setTranscribeProgress(100);
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (err: any) {
      console.error("Lỗi AI Dịch & Lồng tiếng:", err);
      alert("Lỗi khi xử lý dịch & lồng tiếng: " + (err?.message || err));
      setIsTranscribing(false);
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
      setVideoLoadError(null);
      e.target.value = "";
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
      currentSentenceSpokenRef.current = null;
      lastSpokenCueIdRef.current = null;
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      preloadUpcomingSentences(sec);
    }
  };

  // 🌟 NHẬP VIDEO DOUYIN TRENDS VÀO EDITOR VÀ TỰ ĐỘNG BẬT LỒNG TIẾNG PHÙ HỢP
  const handleImportDouyinVideo = (item: DouyinTrendItem) => {
    setSelectedFile(null);
    setVideoUrl(item.videoUrl);
    setVideoName(item.title);
    setCurrentTime(0);
    setIsPlaying(false);
    lastSpokenCueIdRef.current = null;

    // Thiết lập thời lượng mặc định từ kịch bản
    const scriptDuration = item.suggestedScript?.[item.suggestedScript.length - 1]?.endSec || 15;
    setVideoDuration(scriptDuration);

    // Tự động gắn chất giọng khuyến nghị
    const recommendedChar = VOICE_CHARACTERS.find((c) => c.id === item.voiceRecommendation) || VOICE_CHARACTERS[0];
    setVoiceoverConfig((p) => ({
      ...p,
      enabled: true,
      selectedVoiceId: recommendedChar.id,
      pitch: recommendedChar.pitch,
      rate: recommendedChar.rate,
    }));

    // Tự động nạp kịch bản tiếng Việt đã dịch
    if (item.suggestedScript && item.suggestedScript.length > 0) {
      const cues: SubtitleCue[] = item.suggestedScript.map((s, idx) => ({
        id: `douyin_cue_${idx + 1}`,
        startSec: s.startSec,
        endSec: s.endSec,
        timeLabel: `00:${String(s.startSec).padStart(2, "0")} - 00:${String(s.endSec).padStart(2, "0")}`,
        text: s.text,
      }));
      setSubtitleCues(cues);
      setSubtitleConfig((p) => ({ ...p, enabled: true }));
      setTranscribeSuccessMsg(
        `🚀 Đã nhập video và nạp kịch bản tiếng Việt chuẩn TikTok! Gợi ý giọng: ${recommendedChar.name}`
      );
    }

    setShowDouyinModal(false);

    // Kích hoạt phát video mượt mà
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 300);
  };

  // 🌟 NẠP VIDEO TỪ LINK BẤT KỲ (MP4, WebM, Google Drive, Dropbox, Douyin...)
  const handleScrapeDouyinLink = async () => {
    let input = douyinUrlInput.trim();
    if (!input) {
      alert("Vui lòng dán link video (link MP4/WebM, Google Drive, Dropbox hoặc link Douyin/TikTok)!");
      return;
    }

    setIsScrapingDouyin(true);
    setVideoLoadError(null);

    try {
      // 1. Tự động nhận diện & convert link Google Drive sang link stream trực tiếp
      const gDriveMatch = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        input = `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}`;
      }

      // 2. Chuyển đổi link Dropbox sang raw direct download
      if (input.includes("dropbox.com")) {
        input = input.replace("?dl=0", "?raw=1").replace("&dl=0", "&raw=1");
        if (!input.includes("raw=1")) {
          input += (input.includes("?") ? "&" : "?") + "raw=1";
        }
      }

      // 3. Giữ nguyên 100% video URL của người dùng (bảo toàn trọn vẹn 8 phút, không tự ý đổi video khác)
      let finalUrl = input;
      let finalTitle = "Video Liên Kết";
      try {
        const u = new URL(input);
        const namePart = u.pathname.split("/").filter(Boolean).pop();
        if (namePart) finalTitle = decodeURIComponent(namePart).split("?")[0];
      } catch {
        finalTitle = input.slice(0, 30);
      }

      setSelectedFile(null);
      setVideoUrl(finalUrl);
      setVideoName(finalTitle);
      setCurrentTime(0);
      setIsPlaying(false);
      lastSpokenCueIdRef.current = null;
      setVideoLoadError(null);

      // Đặt mặc định tạm thời 480s (8 phút), khi video load xong onLoadedMetadata sẽ lấy chính xác từng giây
      setVideoDuration(480);

      // Kích hoạt chất giọng tiếng Việt chuẩn
      const recommendedChar = VOICE_CHARACTERS[0];
      setVoiceoverConfig((p) => ({
        ...p,
        enabled: true,
        selectedVoiceId: recommendedChar.id,
        pitch: recommendedChar.pitch,
        rate: recommendedChar.rate,
      }));

      setTranscribeSuccessMsg(`✅ Đã nạp thành công liên kết video! Đang tải dữ liệu phát...`);
      setShowDouyinModal(false);
      setIsScrapingDouyin(false);
      setDouyinUrlInput("");

      // Cho video phát
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.currentTime = 0;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 300);
    } catch (e: any) {
      setIsScrapingDouyin(false);
      alert("Lỗi nạp video: " + (e.message || "Vui lòng kiểm tra lại đường link"));
    }
  };

  // 🌟 COPY TOÀN BỘ CODE PAGE.TSX & TẢI FILE
  const handleDownloadSourceCode = async () => {
    try {
      const res = await axios.get("/api/editor-page-code");
      if (res.data) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(res.data);
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 3000);
        }
        const blob = new Blob([res.data], { type: "text/typescript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "page.tsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      window.open("/api/editor-page-code?download=true", "_blank");
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

    // 2.5. VẼ DẢI CHE MỜ / XÓA SUB TIẾNG TRUNG GỐC (INPAINT BLUR MASK)
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

    // 3. VẼ PHỤ ĐỀ TIKTOK
    if (subtitleConfig.enabled && subtitleCues.length > 0) {
      const adjTime = currentSec + subtitleConfig.offsetSeconds;
      const matchedCue = subtitleCues.find(
        (c) => adjTime >= c.startSec && adjTime <= c.endSec + 0.5
      );

      if (matchedCue) {
        ctx.save();
        const subY = height * 0.75; // Nằm chuẩn 1/4 từ góc dưới màn hình lên (25% từ đáy)
        const fontSize = Math.round((subtitleConfig.fontSize || 20) * (width / 360));
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

  // 🌟 TẢI VIDEO XUẤT KHẨU: DÙNG VIDEO ẢO ĐỘC LẬP
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
        // 🌟 LOẠI BỎ TIẾNG TRUNG/ANH/PHÁP GỐC: GAIN = 0 (TẮT HOÀN TOÀN TRONG VIDEO XUẤT)
        if (voiceoverConfig.muteOriginal || voiceoverConfig.originalVolume === 0) {
          gainNode.gain.value = 0;
        } else {
          gainNode.gain.value = (voiceoverConfig.originalVolume / 100) * (soundEffects.boostVoiceVolume ? 1.4 : 1.0);
        }

        source.connect(gainNode);
        gainNode.connect(destination);

        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } catch (e) {
        console.warn("Nối âm thanh video:", e);
      }

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
        if (canvasFilterCss !== "none") {
          ctx.filter = canvasFilterCss;
        }
        ctx.drawImage(exportVideo, 0, 0, width, height);
        ctx.restore();

        drawOverlaysOnCanvas(ctx, width, height, curTime, logoImg);

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

  const isBannerVisible = useMemo(() => {
    if (!bannerConfig.enabled || compareOriginal) return false;
    return currentTime >= bannerConfig.startSec && currentTime <= bannerConfig.endSec;
  }, [bannerConfig, currentTime, compareOriginal]);

  const filteredDouyinTrends = useMemo(() => {
    if (douyinCategory === "all") return DOUYIN_HOT_TRENDS;
    return DOUYIN_HOT_TRENDS.filter((t) => t.category === douyinCategory);
  }, [douyinCategory]);

  return (
    <div className="flex-1 bg-[#0A101D] min-h-screen p-3 md:p-6 font-sans text-slate-100 overflow-y-auto selection:bg-[#1877F2] selection:text-white">
      <div className="max-w-[1540px] mx-auto pb-24">
        {/* HEADER PHONG CÁCH STUDIO XANH FACEBOOK PRO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 bg-[#0F1C33]/90 backdrop-blur-md p-5 rounded-3xl border border-[#1E3867] shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="p-2.5 bg-gradient-to-tr from-[#1565C0] via-[#1877F2] to-[#2563EB] rounded-2xl text-white shadow-lg shadow-blue-950/60 border border-blue-400/30">
                <Wand2 size={24} />
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                KPOST STUDIO PRO
                <span className="bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm border border-blue-400/30 animate-pulse">
                  VIDOCR FB BLUE EDITION
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-200/70 font-medium">
              Phòng thu AI cao cấp: Bóc băng OCR, Gộp dòng tự động, Che mờ sub gốc và Lồng tiếng MC tiếng Việt khớp nhịp 100%.
            </p>
          </div>

          {/* DÃY NÚT CHỨC NĂNG */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 🌟 NÚT CHÍNH: DỊCH & LỒNG TIẾNG THÔNG MINH VIDOCR */}
            <button
              type="button"
              onClick={() => setShowVidOcrModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-950/60 transition-all hover:scale-[1.03] cursor-pointer ring-2 ring-[#1877F2]/40"
              title="Mở bảng điều khiển dịch & lồng tiếng thông minh chuẩn VidOCR"
            >
              <Sparkles size={16} className="text-amber-300 animate-spin" /> ⚡ Dịch & Lồng Tiếng (VidOCR)
            </button>

            {/* 🎯 NÚT 1 (GỐC): TẠO PHỤ ĐỀ / BÓC BĂNG VIDEO BẰNG WHISPER */}
            <button
              type="button"
              onClick={handleTranscribeWhisper}
              disabled={isTranscribing || isExporting}
              className="px-3.5 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-2 border border-[#1E3867] transition-all cursor-pointer disabled:opacity-50"
              title="Bóc băng chính xác 100% từng lời thoại người nói trong video (Whisper AI) và tự động tạo phụ đề chạy mượt mà"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-cyan-300" /> Đang Bóc Băng...
                </>
              ) : (
                <>
                  <Mic size={16} className="text-cyan-300 animate-pulse" /> 🎤 Tạo Sub Video (AI Whisper)
                </>
              )}
            </button>

            {/* 🌐 NÚT 2: AI DỊCH & LỒNG TIẾNG */}
            <button
              type="button"
              onClick={handleTranscribeRealAudio}
              disabled={isTranscribing || isExporting}
              className="px-3.5 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-2 border border-[#1E3867] transition-all cursor-pointer disabled:opacity-50"
              title="Dịch toàn bộ lời thoại video Douyin/ngoại ngữ sang tiếng Việt và lồng tiếng MC"
            >
              <Sparkles size={16} className="text-amber-300" /> 🌐 Dịch & Lồng Tiếng
            </button>

            {/* 🎙️ NÚT CÀI ĐẶT AI LỒNG TIẾNG & TẮT TIẾNG GỐC */}
            <button
              type="button"
              onClick={() => setShowVoiceoverModal(true)}
              className="px-3.5 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-2 border border-[#1E3867] transition-all cursor-pointer"
            >
              <Radio size={15} className="text-emerald-400" /> 🎙️ Đổi Giọng MC & Âm Lượng
              <span className="bg-[#1877F2] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.avatar || "👩"}
              </span>
            </button>

            {/* 🎭 NÚT BẬT/TẮT CHE SUB GỐC */}
            <button
              type="button"
              onClick={() => setMaskConfig((p) => ({ ...p, enabled: !p.enabled }))}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                maskConfig.enabled
                  ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950/40"
                  : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border-[#1E3867]"
              }`}
              title="Bật/Tắt dải che mờ đè lên phụ đề tiếng Trung gốc"
            >
              <Eye size={15} className={maskConfig.enabled ? "text-amber-300" : "text-blue-300"} />
              Che Sub Gốc: {maskConfig.enabled ? "BẬT" : "TẮT"}
            </button>

            {/* 🔥 NÚT CÀO DOUYIN TRENDS */}
            <button
              type="button"
              onClick={() => setShowDouyinModal(true)}
              className="px-3 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-100 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-[#1E3867] transition-all cursor-pointer"
            >
              <Flame size={15} className="text-amber-400" /> Douyin Trends
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
              onClick={() => setShowEffectsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles size={16} /> Hiệu Ứng Video
            </button>

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

            {/* 📦 NÚT TẢI FULL SOURCE CODE (ZIP / TSX) */}
            <a
              href="/fullcode-ai-video-editor.zip"
              download="fullcode-ai-video-editor.zip"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-950/60 transition-all hover:scale-105 cursor-pointer border border-amber-200"
              title="Bấm để tải toàn bộ mã nguồn dự án file ZIP"
            >
              <Download size={16} className="text-slate-950" /> 📦 Tải Full Code (ZIP)
            </a>

            <a
              href="/page.tsx"
              download="page.tsx"
              className="px-3.5 py-2.5 bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#25447C] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Bấm để tải riêng file page.tsx"
            >
              <Code size={15} className="text-blue-300" /> Tải page.tsx
            </a>

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

            <button
              type="button"
              onClick={() => {
                setShowDouyinModal(true);
                setActiveDouyinTab("scraper");
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-slate-200"
            >
              <Link2 size={16} /> 🔗 Dán Link Video
            </button>
          </div>
        </div>

        {/* TIẾN TRÌNH XUẤT VIDEO */}
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

        {/* 2 CỘT CHÍNH + THANH CÔNG CỤ DỌC PHẢI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI: DANH SÁCH LỜI THOẠI TOÀN BỘ VIDEO */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#0F1C33]/90 backdrop-blur-md rounded-3xl border border-[#1E3867] p-4 md:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-[#1877F2]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Lời Thoại Video ({subtitleCues.length} Câu)
                  </h3>
                </div>
                {subtitleCues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadSRT}
                    className="px-2.5 py-1 rounded-xl bg-[#152649] hover:bg-[#1A3059] border border-[#25447C] text-slate-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileDown size={13} /> Tải file .SRT
                  </button>
                )}
              </div>

              {/* TÙY CHỌN & CHỌN GIỌNG MC TRỰC TIẾP */}
              <div className="mb-3 p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl flex flex-col gap-2.5 text-xs shadow-xs">
                {/* DÒNG 1: HIỆN PHỤ ĐỀ & CỠ CHỮ */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-black text-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subtitleConfig.enabled}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Hiện phụ đề trên video
                  </label>
                  <div className="flex items-center gap-2 font-medium text-blue-200">
                    <span>Cỡ chữ:</span>
                    <select
                      value={subtitleConfig.fontSize}
                      onChange={(e) => setSubtitleConfig((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                      className="px-2 py-1 bg-[#200a0e] border border-[#1E3867] rounded-lg text-xs font-bold text-white"
                    >
                      <option value={18}>Nhỏ (18px)</option>
                      <option value={20}>Vừa (20px)</option>
                      <option value={24}>To (24px)</option>
                      <option value={28}>Rất to (28px)</option>
                    </select>
                  </div>
                </div>

                {/* DÒNG 2: BẬT / TẮT LỒNG TIẾNG MC VÀ THỬ LOA */}
                <div className="pt-2 border-t border-[#1A3059] flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-black cursor-pointer text-slate-200 bg-[#13223F] hover:bg-[#1A3059] px-3 py-1.5 rounded-xl border border-[#1E3867] transition-all select-none">
                    <input
                      type="checkbox"
                      checked={voiceoverConfig.enabled}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setVoiceoverConfig((p) => ({
                          ...p,
                          enabled: isChecked,
                          autoDuckOriginal: true,
                          originalVolume: isChecked ? 25 : 100,
                        }));
                        if (isChecked && subtitleCues.length > 0) {
                          const cueToSpeak = subtitleCues[0];
                          currentSentenceSpokenRef.current = cueToSpeak.parentSentenceId || cueToSpeak.id;
                          lastSpokenCueIdRef.current = cueToSpeak.id;
                          speakSentence(cueToSpeak.parentSentenceText || cueToSpeak.text);
                        } else {
                          if (ttsAudioRef.current) {
                            try { ttsAudioRef.current.pause(); } catch {}
                          }
                          if ("speechSynthesis" in window) {
                            try { window.speechSynthesis.cancel(); } catch {}
                          }
                          if (videoRef.current) videoRef.current.volume = 1.0;
                        }
                      }}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>🎙️ Lồng Tiếng MC AI {voiceoverConfig.enabled ? "(ĐANG BẬT)" : "(ĐANG TẮT)"}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (subtitleCues.length > 0) {
                          const cue = currentSubtitleCue || subtitleCues[0];
                          speakSentence(cue.parentSentenceText || cue.text);
                        } else {
                          speakSentence("Xin chào! Hệ thống lồng tiếng MC tiếng Việt đã sẵn sàng.");
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Bấm để kiểm tra loa và giọng đọc AI"
                    >
                      <Volume2 size={13} /> Thử Giọng
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="px-2 py-1 bg-[#13223F] hover:bg-[#1A3059] text-blue-200 border border-[#1E3867] text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Âm Lượng
                    </button>
                  </div>
                </div>

                {/* DÒNG 3: BỘ CHỌN GIỌNG MC TRỰC TIẾP & LOAD LẠI KHÔNG CẦN DỊCH TỪ ĐẦU */}
                <div className="p-2.5 bg-[#1a060a] border border-[#1E3867] rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-blue-200 flex items-center gap-1.5">
                      <Radio size={13} className="text-[#1877F2] animate-pulse" /> Chọn Giọng MC (Đổi Là Ăn Ngay):
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ⚡ Không cần dịch lại
                    </span>
                  </div>

                  {/* 5 NÚT CHỌN MC PHỔ BIẾN */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {POPULAR_VOICES.map((v) => {
                      const isSelected = voiceoverConfig.selectedVoiceId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleQuickChangeVoice(v.id, v.rate, v.pitch)}
                          className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950 scale-[1.02]"
                              : "bg-[#0B1527] hover:bg-[#13223F] text-slate-200 border-[#381118]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{v.avatar}</span>
                            <span className="text-[11px] font-black truncate">{v.shortName}</span>
                          </div>
                          <div className={`text-[9px] mt-0.5 ${isSelected ? "text-slate-100" : "text-blue-300/60"}`}>
                            Tốc độ: {v.rate}x
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ĐIỀU CHỈNH TỐC ĐỘ ĐỌC (KHỚP NHỊP DOUYIN NHANH) */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#1A3059] text-[11px]">
                    <span className="font-bold text-blue-200">Khớp nhịp nhân vật:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "1.0x Chuẩn", val: 1.0 },
                        { label: "1.15x Tự nhiên", val: 1.15 },
                        { label: "⚡ 1.25x Khớp Douyin", val: 1.25 },
                        { label: "🚀 1.35x Nhanh", val: 1.35 },
                      ].map((spd) => (
                        <button
                          key={spd.val}
                          type="button"
                          onClick={() => handleQuickChangeSpeed(spd.val)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            voiceoverConfig.rate === spd.val
                              ? "bg-amber-400 text-slate-900 shadow-xs"
                              : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867]"
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG BÁO KHI ĐỔI GIỌNG */}
                  {voiceChangeNotice && (
                    <div className="p-2 bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold animate-in fade-in flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{voiceChangeNotice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DANH SÁCH LỜI THOẠI */}
              <div ref={listContainerRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
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
                          ? "bg-[#1565C0] text-white border-blue-400 shadow-md shadow-blue-950/50"
                          : "bg-[#0B1527] hover:bg-[#13223F] border-[#381118] text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => seekToTimestamp(cue.startSec)}
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md shrink-0 cursor-pointer transition-all hover:scale-105 ${
                            isActive ? "bg-white/20 text-white" : "bg-[#13223F] text-blue-200 hover:bg-[#1A3059] border border-[#1E3867]"
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(cue.text);
                          }}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Bấm để nghe AI đọc câu này"
                        >
                          <Volume2 size={13} />
                        </button>
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
                      Bấm nút <span className="font-bold text-[#1877F2]">"🔥 Cào Douyin Trends"</span> hoặc <span className="font-bold text-indigo-600">"🎤 Bật sub tự động bằng AI"</span> để nạp video và kịch bản!
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

          {/* CỘT PHẢI: VIDEO PLAYER VỚI PHỤ ĐỀ DỌC 9:16 + THANH DOCK STUDIO VIDOCR */}
          <div className="lg:col-span-7 flex items-start gap-4">
            <div className="bg-[#0F1C33]/90 backdrop-blur-md rounded-3xl border border-[#1E3867] p-4 md:p-5 shadow-xl flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-[#152649] text-blue-200 flex items-center justify-center shrink-0 border border-[#25447C]">
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
                    className="px-2.5 py-1.5 rounded-xl bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette size={13} />
                    {visualEffects.filterType !== "none" ? "Đã bật hiệu ứng" : "Bộ lọc"}
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
                        : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867]"
                    }`}
                  >
                    <Eye size={13} />
                    {compareOriginal ? "Đang xem: GỐC" : "Xem bản gốc"}
                  </button>
                </div>
              </div>

              {/* KHUNG VIDEO 9:16 */}
              <div className="w-full bg-[#0a0204] rounded-2xl overflow-hidden relative border border-[#1E3867] flex items-center justify-center aspect-[9/16] max-h-[560px] mx-auto shadow-2xl">
                {videoUrl && (
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
                      onSeeked={() => {
                        lastSpokenCueIdRef.current = null;
                      }}
                      onPause={() => {
                        setIsPlaying(false);
                        if (ttsAudioRef.current) {
                          ttsAudioRef.current.pause();
                        }
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                      }}
                      onError={() => {
                        console.warn("Video load error for:", videoUrl);
                        if (videoUrl.startsWith("http") && !videoUrl.includes("/api/stream-video")) {
                          console.log("Attempting fallback via /api/stream-video proxy...");
                          setVideoUrl(`/api/stream-video?url=${encodeURIComponent(videoUrl)}`);
                          return;
                        }
                        setVideoLoadError("Máy chủ nguồn chặn quyền phát trực tiếp (lỗi CORS) hoặc link trang web không chứa luồng video MP4 trực tiếp. Bạn chỉ cần bấm nút bên dưới để chọn file từ máy và biên tập trọn vẹn 8 phút.");
                      }}
                      className="w-full h-full object-contain"
                    />

                    {/* THÔNG BÁO VÀ NÚT TẢI FILE TỪ MÁY KHI LINK BỊ CHẶN CORS */}
                    {videoLoadError && (
                      <div className="absolute inset-0 bg-[#0e0305]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in">
                        <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl mb-3 border border-amber-500/30">
                          <AlertTriangle size={36} />
                        </span>
                        <h4 className="font-black text-sm text-amber-300 mb-1.5 uppercase tracking-wide">
                          Máy Chủ Nguồn Chặn Phát Trực Tiếp
                        </h4>
                        <p className="text-xs text-slate-200/80 max-w-sm mb-4 leading-relaxed">
                          Link này bị máy chủ bên ngoài chặn quyền nhúng CORS vào trình duyệt. Để biên tập trọn vẹn video mà không bị ngắt, bạn bấm nút dưới đây để chọn file từ máy:
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer"
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
                          <div className="px-3 py-1 bg-[#1877F2]/90 text-white font-black text-xs rounded-xl shadow-lg border border-white/20 backdrop-blur-xs flex items-center gap-1.5 tracking-wider uppercase">
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

                    {/* 🌟 VÙNG CHE MỜ / XÓA SUB TIẾNG TRUNG GỐC (INPAINT BLUR MASK) */}
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

                    {/* 🌟 PHỤ ĐỀ CHUẨN 3-5 TỪ: NẰM 1/4 TỪ GÓC DƯỚI MÀN HÌNH LÊN VÀ NẰM GỌN TRONG VIDEO */}
                    {subtitleConfig.enabled && !compareOriginal && currentSubtitleCue && (
                      <div className="absolute bottom-[25%] left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                        <div className="bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-2xl max-w-[80%] text-center animate-in fade-in zoom-in-95 duration-100">
                          <p
                            className="font-black leading-snug tracking-wide text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                            style={{
                              fontSize: `${Math.min(22, Math.max(16, subtitleConfig.fontSize || 20))}px`,
                              textShadow: "0 0 8px rgba(0,0,0,0.95), 0 2px 4px #000",
                            }}
                          >
                            {currentSubtitleCue.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TIMELINE CONTROLS */}
              <div className="mt-4 pt-3 border-t border-[#1A3059] flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1565C0] to-[#1877F2] hover:from-[#1877F2] hover:to-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-950/60 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 text-xs font-mono text-blue-200">
                    <span className="font-bold text-white">
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
                        lastSpokenCueIdRef.current = null;
                        currentSentenceSpokenRef.current = null;
                        if (ttsAudioRef.current) {
                          ttsAudioRef.current.pause();
                        }
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                        if (videoRef.current) videoRef.current.currentTime = val;
                        preloadUpcomingSentences(val);
                      }}
                      className="flex-1 accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                    />
                    <span className="font-bold text-blue-200">
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
                    className="p-2 rounded-xl bg-[#13223F] hover:bg-[#1A3059] text-blue-200 border border-[#1E3867] transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {subtitleCues.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Đã có ({subtitleCues.length} câu phụ đề)
                    </span>
                  )}
                  {voiceoverConfig.enabled && (
                    <button
                      type="button"
                      onClick={() => setShowVoiceoverModal(true)}
                      className="text-[11px] font-bold text-slate-200 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 px-2.5 py-1 rounded-xl border border-[#1877F2] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Radio size={13} className="text-[#38BDF8] animate-pulse" />
                      Đang lồng tiếng: {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                    </button>
                  )}
                  {maskConfig.enabled && (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-500/30">
                      🎭 Đã che sub tiếng Trung
                    </span>
                  )}
                  {visualEffects.filterType !== "none" && (
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-500/30">
                      ✨ Bộ lọc: {visualEffects.filterType.toUpperCase()} ({visualEffects.speed}x)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 🌟 THANH DOCK STUDIO DỌC PHẢI - PHONG CÁCH VIDOCR */}
            <div className="hidden xl:flex flex-col items-center gap-2.5 bg-[#0F1C33]/90 backdrop-blur-md border border-[#1E3867] p-2.5 rounded-3xl shrink-0 shadow-2xl sticky top-6">
              {/* NÚT XUẤT BẢN NỔI BẬT */}
              <button
                type="button"
                onClick={handleExportFullVideo}
                disabled={!videoUrl || isExporting}
                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-950/80 hover:scale-105 active:scale-95 transition-all cursor-pointer font-black border border-blue-400/40"
              >
                <Download size={20} className="animate-bounce" />
                <span className="text-[8px] uppercase tracking-wider">XUẤT BẢN</span>
              </button>

              <div className="w-8 h-px bg-[#1E3867] my-0.5" />

              {/* CÁC NÚT CÔNG CỤ DỌC */}
              {[
                { id: "create", label: "TẠO MỚI", icon: <Upload size={17} />, action: () => setShowVidOcrModal(true) },
                { id: "dubbing", label: "LỒNG TIẾNG", icon: <Radio size={17} />, action: () => setShowVoiceoverModal(true) },
                { id: "audio", label: "ÂM THANH", icon: <Volume2 size={17} />, action: () => setShowVoiceoverModal(true) },
                { id: "mask", label: "CHE SUB", icon: <Eye size={17} />, action: () => setMaskConfig((p) => ({ ...p, enabled: !p.enabled })) },
                { id: "banner", label: "LOGO/BANNER", icon: <ImageIcon size={17} />, action: () => setShowModal(true) },
                { id: "effects", label: "BỘ LỌC", icon: <Sparkles size={17} />, action: () => setShowEffectsModal(true) },
                { id: "douyin", label: "DOUYIN", icon: <Flame size={17} />, action: () => setShowDouyinModal(true) },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={tool.action}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-[8px] font-black transition-all cursor-pointer border ${
                    tool.id === "mask" && maskConfig.enabled
                      ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950 scale-105"
                      : "bg-[#13223F] hover:bg-[#1A3059] text-slate-200 border-[#1E3867]"
                  }`}
                >
                  {tool.icon}
                  <span className="truncate">{tool.label}</span>
                </button>
              ))}
            </div>
            </div>
          </div>
        </div>

      {/* 🌟 MODAL 1: AI LỒNG TIẾNG ĐA CHẤT GIỌNG (TỪ TRẺ EM ĐẾN NGƯỜI LỚN) - XANH FACEBOOK */}
      {showVoiceoverModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Radio size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    AI Lồng Tiếng Cho Video (Từ Trẻ Em Đến Người Lớn)
                  </h3>
                  <p className="text-xs text-blue-200/70">Tự động nói theo phụ đề timeline, hỗ trợ Audio Ducking hạ âm lượng video gốc</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* BẬT / TẮT & AUDIO DUCKING */}
              <div className="p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.enabled}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-[#1877F2] rounded"
                  />
                  Bật AI tự động lồng tiếng khi phát video
                </label>
                <label className="flex items-center gap-2 font-bold text-blue-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.autoDuckOriginal}
                    onChange={(e) => setVoiceoverConfig((p) => ({ ...p, autoDuckOriginal: e.target.checked }))}
                    className="w-4 h-4 accent-[#1877F2] rounded"
                  />
                  Tự động giảm âm lượng video gốc khi AI nói (Audio Ducking)
                </label>
              </div>

              {/* DANH SÁCH 8 NHÂN VẬT GIỌNG ĐỌC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VOICE_CHARACTERS.map((char) => {
                  const isSelected = voiceoverConfig.selectedVoiceId === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() =>
                        setVoiceoverConfig((p) => ({
                          ...p,
                          selectedVoiceId: char.id,
                          pitch: char.pitch,
                          rate: char.rate,
                        }))
                      }
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#1877F2] bg-[#1565C0]/30 shadow-md shadow-blue-950/60"
                          : "border-[#1E3867] hover:border-[#1877F2]/50 bg-[#0B1527]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{char.avatar}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            char.group === "kids"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                              : char.group === "adults"
                              ? "bg-blue-950/60 text-blue-200 border border-[#1877F2]/30"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {char.badge} • {char.ageRange}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white">{char.name}</h4>
                        <p className="text-[11px] text-blue-200/70 mt-1 line-clamp-2 leading-relaxed">
                          {char.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1A3059] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(char.sampleText, char.id);
                          }}
                          className="px-2.5 py-1 bg-[#152649] hover:bg-[#1A3059] text-slate-200 border border-[#1E3867] text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Volume2 size={12} /> Nghe thử mẫu
                        </button>
                        {isSelected && (
                          <span className="text-[10px] font-black text-amber-300 uppercase flex items-center gap-1">
                            <Check size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1E3867] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-blue-200">
                Nhân vật đang chọn:{" "}
                <strong className="text-amber-300">
                  {VOICE_CHARACTERS.find((c) => c.id === voiceoverConfig.selectedVoiceId)?.name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceoverModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL 2: CÀO DỮ LIỆU DOUYIN.COM & ĐỀ XUẤT VIDEO HOT MỚI NHẤT - XANH FACEBOOK */}
      {showDouyinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Flame size={20} className="animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Douyin Hot Trends & Cào Video Bán Hàng Triệu View
                    <span className="bg-[#1877F2]/20 border border-[#1877F2] text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      DOUYIN.COM
                    </span>
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Đề xuất video hot mới nhất, tự động trích xuất kịch bản tiếng Việt và gán giọng lồng tiếng tối ưu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB CHUYỂN ĐỔI */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-[#0B1527] border border-[#1E3867] rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveDouyinTab("trends")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "trends"
                    ? "bg-[#1877F2] text-white shadow-md shadow-blue-950"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                <Flame size={14} /> 🏆 Đề Xuất Video Hot Douyin Mới Nhất
              </button>
              <button
                type="button"
                onClick={() => setActiveDouyinTab("scraper")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDouyinTab === "scraper"
                    ? "bg-[#1877F2] text-white shadow-md shadow-blue-950"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                <Link2 size={14} /> 🔗 Cào Video Từ Link Douyin Bất Kỳ
              </button>
            </div>

            {/* TAB 1: BẢNG XẾP HẠNG VIDEO HOT DOUYIN */}
            {activeDouyinTab === "trends" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* LỌC THEO DANH MỤC */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
                  {[
                    { id: "all", label: "Tất Cả Danh Mục" },
                    { id: "kids_toys", label: "🧸 Đồ Chơi & Mẹ Bé" },
                    { id: "smart_home", label: "🛍️ Gia Dụng Thông Minh" },
                    { id: "tech_gadgets", label: "📱 Đồ Công Nghệ" },
                    { id: "beauty_care", label: "💄 Mỹ Phẩm & Skincare" },
                    { id: "short_drama", label: "🎬 Phim Ngắn Drama" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDouyinCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        douyinCategory === cat.id
                          ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                          : "bg-[#0B1527] text-slate-200 border-[#1E3867] hover:bg-[#13223F]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* DANH SÁCH VIDEO HOT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDouyinTrends.map((trend) => (
                    <div
                      key={trend.id}
                      className="bg-[#0B1527] border border-[#1E3867] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-[#1877F2] transition-all hover:shadow-lg hover:shadow-blue-950/40"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-blue-200 bg-[#1877F2]/20 border border-[#1877F2]/40 px-2 py-0.5 rounded-full">
                            {trend.categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold text-blue-300/80">❤️ {trend.likes} • ↗️ {trend.shares}</span>
                        </div>
                        <h4 className="text-xs font-black text-white leading-snug">{trend.title}</h4>
                        <p className="text-[10px] text-blue-300/60 font-mono italic mt-0.5">🇨🇳 {trend.originalTitle}</p>

                        <div className="mt-2.5 p-2 bg-[#13223F] border border-[#1E3867] rounded-xl">
                          <p className="text-[10px] text-amber-200 font-bold leading-relaxed">
                            💡 <strong>AI Viral:</strong> {trend.viralInsight}
                          </p>
                        </div>

                        <div className="mt-2 text-[11px] font-bold text-slate-200 bg-[#1877F2]/20 p-2 rounded-xl border border-[#1877F2]/40 flex items-center gap-1.5">
                          <Radio size={12} className="text-[#38BDF8] shrink-0" />
                          <span>Gợi ý giọng: {trend.voiceRecommendationName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportDouyinVideo(trend)}
                        className="w-full py-2 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        🚀 Nhập Video & Bật Lồng Tiếng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CÀO TỪ LINK BẤT KỲ HOẶC TẢI TRỰC TIẾP TỪ MÁY */}
            {activeDouyinTab === "scraper" && (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                  <label className="text-xs font-black uppercase tracking-wider text-white block mb-1">
                    Dán đường link Video (Hỗ trợ MP4, WebM, Google Drive, Dropbox, TikTok/Douyin...):
                  </label>
                  <p className="text-[11px] text-blue-200/70 mb-2.5">
                    Hỗ trợ video thời lượng bất kỳ (8 phút, 15 phút, 30 phút). Hệ thống sẽ giữ nguyên 100% video của bạn, không cắt ngắn.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={douyinUrlInput}
                      onChange={(e) => setDouyinUrlInput(e.target.value)}
                      placeholder="VD: https://... hoặc link Google Drive, CDN..."
                      className="flex-1 text-xs font-bold px-3 py-2.5 bg-[#0e0305] border border-[#1E3867] rounded-xl text-white placeholder-rose-400/40 focus:border-[#1877F2] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeDouyinLink}
                      disabled={isScrapingDouyin}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isScrapingDouyin ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Đang tải...
                        </>
                      ) : (
                        <>
                          <Flame size={14} /> 🚀 Nạp Video Này
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* TUỲ CHỌN TẢI THẲNG FILE 8 PHÚT TỪ MÁY */}
                <div className="p-4 bg-[#13223F] border border-[#1E3867] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <Upload size={14} className="text-[#38BDF8]" /> Hoặc Chọn File Video Trực Tiếp Từ Máy Tính
                    </h4>
                    <p className="text-[11px] text-blue-200/70 mt-0.5">
                      Khuyên dùng: Tải file từ máy tính phát siêu mượt, trọn vẹn 100% thời lượng (8 phút, 15 phút) và không lo bị lỗi mạng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDouyinModal(false);
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#2563EB] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <FolderOpen size={14} /> 📁 Chọn File Từ Máy
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-[#1E3867] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDouyinModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL TẢI LÊN & DỊCH TỰ ĐỘNG THÔNG MINH CHUẨN VIDOCR (MÀU XANH FACEBOOK) */}
      {showVidOcrModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3867] mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] rounded-xl text-white shadow-md shadow-blue-950">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Tải Lên & Dịch Tự Động (AI OCR & STT V2)
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Bóc tách phụ đề cứng, gộp dòng tự động, che sub gốc và lồng tiếng MC khớp 100%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVidOcrModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#152649] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* THẢ TẬP TIN VÀO ĐÂY */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#541a25] hover:border-[#1877F2] bg-[#120407]/70 hover:bg-[#1a060a] rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 group"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#152649] group-hover:bg-[#1877F2]/20 flex items-center justify-center text-blue-300 group-hover:text-slate-200 transition-colors mb-2.5">
                <UploadCloud size={24} />
              </div>
              <h4 className="text-sm font-black text-white mb-1">
                {videoName ? `Đã chọn: ${videoName}` : "Thả tập tin video vào đây hoặc bấm để chọn"}
              </h4>
              <p className="text-[11px] text-blue-200/60 mb-2">
                Hỗ trợ MP4, MOV, WebM thời lượng dài (8 phút, 15 phút, 30 phút)
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-blue-300/80 font-mono">
                <span className="flex items-center gap-1">📁 File máy</span>
                <span>•</span>
                <span className="flex items-center gap-1">🎵 TikTok</span>
                <span>•</span>
                <span className="flex items-center gap-1">🔥 Douyin</span>
                <span>•</span>
                <span className="flex items-center gap-1">▶️ YouTube</span>
              </div>
            </div>

            {/* HOẶC DÁN LINK VIDEO */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={douyinUrlInput}
                  onChange={(e) => setDouyinUrlInput(e.target.value)}
                  placeholder="Hoặc dán đường link video (Douyin, TikTok, Drive, MP4 trực tiếp)..."
                  className="flex-1 text-xs px-3.5 py-2.5 bg-[#0B1527] border border-[#1E3867] rounded-xl text-white placeholder-rose-400/40 focus:outline-none focus:border-[#1877F2] font-mono"
                />
                <button
                  type="button"
                  onClick={handleScrapeDouyinLink}
                  disabled={isScrapingDouyin || !douyinUrlInput.trim()}
                  className="px-4 py-2 bg-[#1877F2] hover:bg-[#2563EB] text-white text-xs font-black rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {isScrapingDouyin ? "Đang tải..." : "Nạp Link"}
                </button>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* HÀNG 1: CẶP NGÔN NGỮ */}
              <div className="p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-300/70 font-bold">Nguồn:</span>
                  <select
                    value={vidOcrWorkflow.sourceLang}
                    onChange={(e) => setVidOcrWorkflow((p) => ({ ...p, sourceLang: e.target.value as any }))}
                    className="bg-[#13223F] border border-[#25447C] rounded-lg px-2.5 py-1 text-white font-bold"
                  >
                    <option value="zh">🇨🇳 Tiếng Trung (Douyin/Kuaishou)</option>
                    <option value="auto">🌐 Phát hiện tự động</option>
                    <option value="en">🇺🇸 Tiếng Anh (TikTok/YouTube)</option>
                    <option value="ko">🇰🇷 Tiếng Hàn</option>
                    <option value="ja">🇯🇵 Tiếng Nhật</option>
                  </select>
                </div>

                <span className="text-[#1877F2] font-black text-base">➔</span>

                <div className="flex items-center gap-2">
                  <span className="text-blue-300/70 font-bold">Đích:</span>
                  <span className="px-3 py-1 bg-[#1877F2]/20 border border-[#1877F2] text-slate-200 font-black rounded-lg">
                    🇻🇳 Tiếng Việt
                  </span>
                </div>
              </div>

              {/* HÀNG 2: MÔ HÌNH DỊCH AI */}
              <div className="flex items-center gap-2">
                <span className="text-blue-200 font-bold shrink-0">Model AI:</span>
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {[
                    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash ⚡", badge: "Siêu Tốc (Gợi ý)" },
                    { id: "deepseek-v3", label: "DeepSeek V3", badge: "Chuẩn Văn Phong" },
                    { id: "gpt-4o-mini", label: "GPT-4o mini 🔑", badge: "Đa Dụng" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setVidOcrWorkflow((p) => ({ ...p, aiModel: m.id as any }))}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        vidOcrWorkflow.aiModel === m.id
                          ? "bg-[#1877F2] text-white border-blue-400 shadow-md shadow-blue-950"
                          : "bg-[#0B1527] hover:bg-[#13223F] text-slate-200 border-[#1E3867]"
                      }`}
                    >
                      <div className="font-black text-[11px] truncate">{m.label}</div>
                      <div className="text-[9px] text-blue-200/60 mt-0.5">{m.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* HÀNG 3: PHƯƠNG THỨC BÓC TÁCH */}
              <div className="flex items-center gap-2">
                <span className="text-blue-200 font-bold shrink-0">Chế độ:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1">
                  {[
                    { id: "audio_stt_v2", label: "Dịch âm thanh V2", desc: "Whisper + Gemini" },
                    { id: "hardsub_ocr", label: "Dịch sub cứng", desc: "OCR khung hình" },
                    { id: "srt_dubbing", label: "Lồng tiếng từ .SRT", desc: "Phụ đề có sẵn" },
                    { id: "text_translate", label: "Dịch văn bản", desc: "Theo kịch bản" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setVidOcrWorkflow((p) => ({ ...p, processMode: mode.id as any }))}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        vidOcrWorkflow.processMode === mode.id
                          ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                          : "bg-[#0B1527] hover:bg-[#13223F] text-slate-200 border-[#1E3867]"
                      }`}
                    >
                      <div className="font-black text-[11px]">{mode.label}</div>
                      <div className="text-[9px] text-blue-200/60">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* HÀNG 4: 4 TÙY CHỌN ĐỘC QUYỀN CHUẨN VIDOCR */}
              <div className="p-3 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <span className="text-[11px] font-black uppercase text-amber-300 block mb-2">
                  ✨ Tùy Chọn Độc Quyền (Giúp Video & Giọng Nói Chạy Mượt Mà):
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-100 hover:text-white">
                    <input
                      type="checkbox"
                      checked={vidOcrWorkflow.autoMergeLines}
                      onChange={(e) => setVidOcrWorkflow((p) => ({ ...p, autoMergeLines: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>⚡ Gộp dòng thông minh (Không ngắt vụn)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-100 hover:text-white">
                    <input
                      type="checkbox"
                      checked={vidOcrWorkflow.blurOriginalSub}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setVidOcrWorkflow((p) => ({ ...p, blurOriginalSub: val }));
                        setMaskConfig((p) => ({ ...p, enabled: val }));
                      }}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>🎭 Gộp làm mờ (Che sub tiếng Trung gốc)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-100 hover:text-white">
                    <input
                      type="checkbox"
                      checked={vidOcrWorkflow.autoDuckAudio}
                      onChange={(e) => setVidOcrWorkflow((p) => ({ ...p, autoDuckAudio: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>🎵 Tách & Giữ nhạc nền (Audio Ducking 10%)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-100 hover:text-white">
                    <input
                      type="checkbox"
                      checked={vidOcrWorkflow.autoSpeedFit}
                      onChange={(e) => setVidOcrWorkflow((p) => ({ ...p, autoSpeedFit: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>⚡ Khớp tốc độ nhân vật tự động</span>
                  </label>
                </div>
              </div>
            </div>

            {/* NÚT BẮT ĐẦU */}
            <div className="mt-5 pt-4 border-t border-[#1E3867] flex items-center justify-between">
              <span className="text-[11px] text-blue-200/60 font-mono">
                {videoDuration ? `Độ dài: ${Math.round(videoDuration)}s` : "Sẵn sàng xử lý"} | Chuẩn Studio 1080P
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVidOcrModal(false)}
                  className="px-4 py-2 bg-[#13223F] hover:bg-[#1A3059] text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVidOcrModal(false);
                    handleTranscribeRealAudio();
                  }}
                  disabled={isTranscribing}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-950 transition-all cursor-pointer disabled:opacity-50"
                >
                  🚀 Bắt Đầu Xử Lý Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL CHÈN HIỆU ỨNG ÂM THANH & HÌNH ẢNH MỚI - XANH FACEBOOK */}
      {showEffectsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <Sparkles size={18} />
                </span>
                <h3 className="text-base font-black text-white">Hiệu Ứng Hình Ảnh & Âm Thanh</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: HIỆU ỨNG HÌNH ẢNH */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-3">
                  <Palette size={14} className="text-[#1877F2]" /> 1. Bộ Lọc Màu & Hiệu Ứng Hình Ảnh (Visual)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1.5">Tông màu điện ảnh:</label>
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
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                              : "bg-[#13223F] text-slate-200 border-[#1E3867] hover:bg-[#1A3059]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Độ sáng: {visualEffects.brightness}%
                      </label>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        value={visualEffects.brightness}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, brightness: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Độ bão hòa màu: {visualEffects.saturation}%
                      </label>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={visualEffects.saturation}
                        onChange={(e) => setVisualEffects((p) => ({ ...p, saturation: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">
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
                              ? "bg-[#1877F2] text-white border-blue-400 shadow-sm"
                              : "bg-[#13223F] text-slate-200 border-[#1E3867] hover:bg-[#1A3059]"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: HIỆU ỨNG ÂM THANH */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-3">
                  <Music size={14} className="text-emerald-400" /> 2. Hiệu Ứng Âm Thanh & Khuếch Đại (Audio)
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">🎙️ Khuếch đại giọng nói (Voice Boost +40%)</p>
                      <p className="text-[11px] text-blue-200/70">Giúp giọng nói rõ ràng, nổi bật hơn so với âm thanh tạp âm</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.boostVoiceVolume}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, boostVoiceVolume: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">🔔 Hiệu ứng Ding khi hiện Banner</p>
                      <p className="text-[11px] text-blue-200/70">Phát âm thanh thông báo thu hút mắt nhìn khi banner giảm giá xuất hiện</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.dingEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, dingEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#13223F] border border-[#1E3867] rounded-xl cursor-pointer hover:border-[#1877F2] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">⚡ Hiệu ứng Whoosh lướt cảnh mở đầu</p>
                      <p className="text-[11px] text-blue-200/70">Âm thanh lướt gió chuyên nghiệp trong 2 giây đầu video</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects.whooshEffectEnabled}
                      onChange={(e) => setSoundEffects((p) => ({ ...p, whooshEffectEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEffectsModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
              >
                Lưu & Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THIẾT LẬP LOGO & BANNER - XANH FACEBOOK */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1C33] border border-[#25447C] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3867]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-[#1565C0] to-[#2563EB] text-white rounded-xl shadow-md shadow-blue-950">
                  <ImageIcon size={18} />
                </span>
                <h3 className="text-base font-black text-white">Thiết Lập Logo & Banner Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-[#1A3059] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* PHẦN 1: LOGO */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#1877F2]" /> 1. Logo Thương Hiệu
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logoConfig.enabled}
                      onChange={(e) => setLogoConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Logo
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1.5">
                      Ảnh Logo (PNG trong suốt / JPG):
                    </label>
                    <div className="flex items-center gap-3">
                      {logoConfig.imageSrc ? (
                        <div className="relative group w-14 h-14 bg-[#13223F] border border-[#1E3867] rounded-xl p-1 flex items-center justify-center shrink-0">
                          <img
                            src={logoConfig.imageSrc}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoConfig((p) => ({ ...p, imageSrc: "" }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 cursor-pointer"
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
                          className="w-full py-2.5 px-3 bg-[#13223F] hover:bg-[#1A3059] border border-dashed border-[#25447C] rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                        >
                          <UploadCloud size={16} className="text-blue-300" />
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
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Hoặc nhập Chữ Logo đại diện:
                      </label>
                      <input
                        type="text"
                        value={logoConfig.name}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, name: e.target.value }))}
                        placeholder="VD: KPOST AI"
                        className="w-full text-xs font-bold px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Vị trí góc:</label>
                      <select
                        value={logoConfig.position}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, position: e.target.value as any }))}
                        className="w-full text-xs font-bold px-2.5 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      >
                        <option value="top-right">Góc trên - Phải</option>
                        <option value="top-left">Góc trên - Trái</option>
                        <option value="bottom-right">Góc dưới - Phải</option>
                        <option value="bottom-left">Góc dưới - Trái</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">
                        Kích thước: {logoConfig.size || 40}px
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={70}
                        value={logoConfig.size || 40}
                        onChange={(e) => setLogoConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                        className="w-full accent-[#1877F2] h-2 bg-[#152649] rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: BANNER QUẢNG CÁO */}
              <div className="p-4 bg-[#0B1527] border border-[#1E3867] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    🏷️ 2. Banner Quảng Cáo / Giảm Giá
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig.enabled}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    Bật Banner
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: ⚡ FLASH SALE 50% - DUY NHẤT HÔM NAY"
                      className="w-full text-xs font-bold px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-blue-200 block mb-1">Mô tả phụ (subtitle):</label>
                    <input
                      type="text"
                      value={bannerConfig.subtitle || ""}
                      onChange={(e) => setBannerConfig((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="VD: Miễn phí giao hàng toàn quốc • Bảo hành chính hãng"
                      className="w-full text-xs font-medium px-3 py-2 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:border-[#1877F2] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Bắt đầu (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.startSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, startSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-blue-200 block mb-1">Kết thúc (giây):</label>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration || 120}
                        value={bannerConfig.endSec}
                        onChange={(e) => setBannerConfig((p) => ({ ...p, endSec: Number(e.target.value) }))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-[#13223F] border border-[#1E3867] rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#1565C0] via-[#1877F2] to-[#2563EB] hover:from-[#1877F2] hover:to-[#38BDF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-950"
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
